use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::Deserialize;
use serde_json::json;
use sqlx::{PgPool, Row};
use uuid::Uuid;
use chrono::Utc;

use crate::errors::AppError;
use crate::middleware::{AuthUser, Claims};
use crate::models::*;
use validator::Validate;

// JWT expiration duration (1 week in seconds)
const JWT_EXPIRATION: u64 = 60 * 60 * 24 * 7;

fn generate_token(user_id: Uuid, role: String) -> Result<String, AppError> {
    let jwt_secret = std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "invesa_secret_super_key_12345_secure_key".to_string());
    
    let claims = Claims {
        sub: user_id,
        role,
        exp: Utc::now().timestamp() as u64 + JWT_EXPIRATION,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret.as_bytes()),
    )
    .map_err(|err| AppError::Internal(format!("Token generation failed: {}", err)))
}

// ----------------------------------------
// AUTH ROUTE HANDLERS
// ----------------------------------------

pub async fn register(
    State(pool): State<PgPool>,
    Json(payload): Json<RegisterReq>,
) -> Result<Json<AuthRes>, AppError> {
    // Validate input
    payload.validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {}", e)))?;

    // Check if user already exists
    let existing_user = sqlx::query!(
        "SELECT id FROM users WHERE email = $1",
        payload.email.to_lowercase()
    )
    .fetch_optional(&pool)
    .await?;

    if existing_user.is_some() {
        return Err(AppError::BadRequest("User with this email already exists".to_string()));
    }

    // Hash password
    let password_hash = hash(&payload.password_hash, DEFAULT_COST)
        .map_err(|e| AppError::Internal(format!("Password hashing failed: {}", e)))?;

    // Insert user
    let user_skills = payload.skills.unwrap_or_default();
    let linkedin_url = payload.linkedin.flatten();

    let user = sqlx::query_as!(
        User,
        r#"
        INSERT INTO users (name, email, password_hash, role, bio, skills, linkedin, recovery_key_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name, email, password_hash, role, bio, skills, linkedin, recovery_key_hash, created_at
        "#,
        payload.name,
        payload.email.to_lowercase(),
        password_hash,
        payload.role,
        payload.bio,
        &user_skills,
        linkedin_url,
        payload.recovery_key_hash
    )
    .fetch_one(&pool)
    .await?;

    let token = generate_token(user.id, user.role.clone())?;

    Ok(Json(AuthRes {
        token,
        user: PublicUser::from(user),
    }))
}

pub async fn login(
    State(pool): State<PgPool>,
    Json(payload): Json<LoginReq>,
) -> Result<Json<AuthRes>, AppError> {
    // Validate input
    payload.validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {}", e)))?;

    // Fetch user
    let user = sqlx::query_as!(
        User,
        "SELECT * FROM users WHERE email = $1",
        payload.email.to_lowercase()
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::Unauthorized("Invalid email or password".to_string()))?;

    // Verify password
    let is_valid = verify(&payload.password_hash, &user.password_hash)
        .map_err(|e| AppError::Internal(format!("Password verification failed: {}", e)))?;

    if !is_valid {
        return Err(AppError::Unauthorized("Invalid email or password".to_string()));
    }

    let token = generate_token(user.id, user.role.clone())?;

    Ok(Json(AuthRes {
        token,
        user: PublicUser::from(user),
    }))
}

// ----------------------------------------
// IDEAS ROUTE HANDLERS
// ----------------------------------------

#[derive(Debug, Deserialize)]
pub struct FilterParams {
    pub category: Option<String>,
    pub search: Option<String>,
}

pub async fn get_ideas(
    State(pool): State<PgPool>,
    Query(params): Query<FilterParams>,
) -> Result<Json<Vec<Idea>>, AppError> {
    let mut query = String::from(
        "SELECT id, founder_id, title, summary, description, category, stage, team_slots, ip_hash, created_at FROM ideas WHERE 1=1"
    );
    let mut args_idx = 1;
    let mut category_val = None;
    let mut search_val = None;

    if let Some(ref cat) = params.category {
        query.push_str(&format!(" AND category = ${}", args_idx));
        category_val = Some(cat.clone());
        args_idx += 1;
    }

    if let Some(ref q) = params.search {
        query.push_str(&format!(
            " AND (title ILIKE ${0} OR summary ILIKE ${0} OR description ILIKE ${0})",
            args_idx
        ));
        search_val = Some(format!("%{}%", q));
    }

    let mut db_query = sqlx::query_as::<_, Idea>(&query);

    if let Some(ref cat) = category_val {
        db_query = db_query.bind(cat);
    }
    if let Some(ref q) = search_val {
        db_query = db_query.bind(q);
    }

    let ideas = db_query.fetch_all(&pool).await?;
    Ok(Json(ideas))
}

pub async fn create_idea(
    State(pool): State<PgPool>,
    auth: AuthUser,
    Json(payload): Json<CreateIdeaReq>,
) -> Result<Json<Idea>, AppError> {
    // Validate input
    payload.validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {}", e)))?;

    if auth.role != "founder" {
        return Err(AppError::Forbidden("Only founders can register startup ideas".to_string()));
    }

    // Begin Transaction to insert both idea and founder team membership
    let mut tx = pool.begin().await?;

    let idea = sqlx::query_as!(
        Idea,
        r#"
        INSERT INTO ideas (founder_id, title, summary, description, category, stage, team_slots, ip_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, founder_id, title, summary, description, category, stage, team_slots, ip_hash, created_at
        "#,
        auth.id,
        payload.title,
        payload.summary,
        payload.description,
        payload.category,
        payload.stage,
        &payload.team_slots,
        payload.ip_hash
    )
    .fetch_one(&mut *tx)
    .await?;

    // Fetch founder name
    let founder_name = sqlx::query_scalar!("SELECT name FROM users WHERE id = $1", auth.id)
        .fetch_one(&mut *tx)
        .await?;

    // Auto add founder to team_members
    sqlx::query!(
        r#"
        INSERT INTO team_members (idea_id, user_id, role_title)
        VALUES ($1, $2, $3)
        "#,
        idea.id,
        auth.id,
        format!("Founder ({})", founder_name)
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(Json(idea))
}

fn extract_optional_user(headers: &axum::http::HeaderMap) -> Option<AuthUser> {
    let auth_header = headers.get("Authorization")?.to_str().ok()?;
    if !auth_header.starts_with("Bearer ") {
        return None;
    }
    let token = &auth_header[7..];
    let jwt_secret = std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "invesa_secret_super_key_12345_secure_key".to_string());
    
    let token_data = jsonwebtoken::decode::<Claims>(
        token,
        &jsonwebtoken::DecodingKey::from_secret(jwt_secret.as_bytes()),
        &jsonwebtoken::Validation::default(),
    )
    .ok()?;

    Some(AuthUser {
        id: token_data.claims.sub,
        role: token_data.claims.role,
    })
}

pub async fn get_idea_by_id(
    State(pool): State<PgPool>,
    headers: axum::http::HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<IdeaDetail>, AppError> {
    // 1. Fetch idea & founder name
    let idea_row = sqlx::query!(
        r#"
        SELECT i.*, u.name as founder_name 
        FROM ideas i 
        JOIN users u ON i.founder_id = u.id 
        WHERE i.id = $1
        "#,
        id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Idea not found".to_string()))?;

    // 2. Fetch team members details
    let team_members = sqlx::query_as!(
        TeamMemberDetail,
        r#"
        SELECT tm.id, tm.user_id, u.name, tm.role_title, tm.joined_at
        FROM team_members tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.idea_id = $1
        "#,
        id
    )
    .fetch_all(&pool)
    .await?;

    // 3. Fetch join requests details
    let join_requests = sqlx::query_as!(
        JoinRequestDetail,
        r#"
        SELECT jr.id, jr.idea_id, jr.builder_id, u.name as builder_name, COALESCE(u.skills, '{}') as "builder_skills!", jr.message, jr.status, jr.created_at, i.title as idea_title
        FROM join_requests jr
        JOIN users u ON jr.builder_id = u.id
        JOIN ideas i ON jr.idea_id = i.id
        WHERE jr.idea_id = $1
        "#,
        id
    )
    .fetch_all(&pool)
    .await?;

    // 4. Fetch investor interest details
    let investor_interests = sqlx::query_as!(
        InvestorInterestDetail,
        r#"
        SELECT ii.id, ii.idea_id, ii.investor_id, u.name as investor_name, ii.note, ii.created_at
        FROM investor_interests ii
        JOIN users u ON ii.investor_id = u.id
        WHERE ii.idea_id = $1
        "#,
        id
    )
    .fetch_all(&pool)
    .await?;

    // Extract auth user details if token is valid
    let auth_user = extract_optional_user(&headers);

    let is_founder_or_team = if let Some(ref auth) = auth_user {
        auth.id == idea_row.founder_id || team_members.iter().any(|tm| tm.user_id == auth.id)
    } else {
        false
    };

    // Filter join requests:
    // - Founder & team members can see all requests.
    // - Authenticated builder who isn't a member can only see their own requests.
    // - Guests/investors/others see empty list.
    let filtered_join_requests = if is_founder_or_team {
        join_requests
    } else if let Some(ref auth) = auth_user {
        join_requests.into_iter().filter(|jr| jr.builder_id == auth.id).collect()
    } else {
        Vec::new()
    };

    // Filter investor interests:
    // - Founder & team members can see all interests.
    // - Authenticated investor can only see their own interests.
    // - Guests/builders/others see empty list.
    let filtered_investor_interests = if is_founder_or_team {
        investor_interests
    } else if let Some(ref auth) = auth_user {
        investor_interests.into_iter().filter(|ii| ii.investor_id == auth.id).collect()
    } else {
        Vec::new()
    };

    Ok(Json(IdeaDetail {
        id: idea_row.id,
        founder_id: idea_row.founder_id,
        founder_name: idea_row.founder_name,
        title: idea_row.title,
        summary: idea_row.summary,
        description: idea_row.description,
        category: idea_row.category,
        stage: idea_row.stage,
        team_slots: idea_row.team_slots,
        ip_hash: idea_row.ip_hash,
        created_at: idea_row.created_at,
        team_members,
        join_requests: filtered_join_requests,
        investor_interests: filtered_investor_interests,
    }))
}

// ----------------------------------------
// BUILDER & INVESTOR ACTIONS
// ----------------------------------------

pub async fn join_request(
    State(pool): State<PgPool>,
    auth: AuthUser,
    Path(idea_id): Path<Uuid>,
    Json(payload): Json<JoinRequestReq>,
) -> Result<StatusCode, AppError> {
    // Validate input
    payload.validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {}", e)))?;

    if auth.role != "builder" {
        return Err(AppError::Forbidden("Only builders can request to join teams".to_string()));
    }

    // Check if idea exists
    let idea_exists = sqlx::query("SELECT id FROM ideas WHERE id = $1")
        .bind(idea_id)
        .fetch_optional(&pool)
        .await?;

    if idea_exists.is_none() {
        return Err(AppError::NotFound("Idea not found".to_string()));
    }

    // Check if already member
    let already_member = sqlx::query!(
        "SELECT id FROM team_members WHERE idea_id = $1 AND user_id = $2",
        idea_id,
        auth.id
    )
    .fetch_optional(&pool)
    .await?;

    if already_member.is_some() {
        return Err(AppError::BadRequest("You are already a member of this team".to_string()));
    }

    // Check if already requested (pending or accepted)
    let existing_request = sqlx::query!(
        "SELECT id FROM join_requests WHERE idea_id = $1 AND builder_id = $2 AND status IN ('pending', 'accepted')",
        idea_id,
        auth.id
    )
    .fetch_optional(&pool)
    .await?;

    if existing_request.is_some() {
        return Err(AppError::BadRequest("You have already submitted a request for this project".to_string()));
    }

    sqlx::query!(
        r#"
        INSERT INTO join_requests (idea_id, builder_id, message)
        VALUES ($1, $2, $3)
        "#,
        idea_id,
        auth.id,
        payload.message
    )
    .execute(&pool)
    .await?;

    Ok(StatusCode::CREATED)
}

pub async fn express_interest(
    State(pool): State<PgPool>,
    auth: AuthUser,
    Path(idea_id): Path<Uuid>,
    Json(payload): Json<InvestorInterestReq>,
) -> Result<StatusCode, AppError> {
    // Validate input
    payload.validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {}", e)))?;

    if auth.role != "investor" {
        return Err(AppError::Forbidden("Only investors can track ideas".to_string()));
    }

    // Check if idea exists
    let idea_exists = sqlx::query("SELECT id FROM ideas WHERE id = $1")
        .bind(idea_id)
        .fetch_optional(&pool)
        .await?;

    if idea_exists.is_none() {
        return Err(AppError::NotFound("Idea not found".to_string()));
    }

    // Check if already expressed interest
    let existing_interest = sqlx::query!(
        "SELECT id FROM investor_interests WHERE idea_id = $1 AND investor_id = $2",
        idea_id,
        auth.id
    )
    .fetch_optional(&pool)
    .await?;

    if existing_interest.is_some() {
        return Err(AppError::BadRequest("You have already expressed interest in this project".to_string()));
    }

    sqlx::query!(
        r#"
        INSERT INTO investor_interests (idea_id, investor_id, note)
        VALUES ($1, $2, $3)
        "#,
        idea_id,
        auth.id,
        payload.note
    )
    .execute(&pool)
    .await?;

    Ok(StatusCode::CREATED)
}

pub async fn handle_join_request(
    State(pool): State<PgPool>,
    auth: AuthUser,
    Path((idea_id, request_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<JoinRequestStatusReq>,
) -> Result<StatusCode, AppError> {
    // Validate input
    payload.validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {}", e)))?;

    // Verify user is the owner founder of the idea
    let idea = sqlx::query!(
        "SELECT founder_id FROM ideas WHERE id = $1",
        idea_id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Idea not found".to_string()))?;

    if idea.founder_id != auth.id {
        return Err(AppError::Forbidden("You do not have permission to manage this idea".to_string()));
    }

    let mut tx = pool.begin().await?;

    // Get and update request status
    let req = sqlx::query!(
        "SELECT builder_id, status FROM join_requests WHERE id = $1 AND idea_id = $2",
        request_id,
        idea_id
    )
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| AppError::NotFound("Request not found".to_string()))?;

    if req.status != "pending" {
        return Err(AppError::BadRequest("Request has already been processed".to_string()));
    }

    sqlx::query!(
        "UPDATE join_requests SET status = $1 WHERE id = $2",
        payload.status,
        request_id
    )
    .execute(&mut *tx)
    .await?;

    if payload.status == "accepted" {
        // Insert into team members
        sqlx::query!(
            r#"
            INSERT INTO team_members (idea_id, user_id, role_title)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
            "#,
            idea_id,
            req.builder_id,
            "Developer / Partner"
        )
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok(StatusCode::OK)
}

// ----------------------------------------
// DASHBOARD & PROFILE DATA HANDLERS
// ----------------------------------------

pub async fn get_dashboard(
    State(pool): State<PgPool>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    if auth.role == "founder" {
        // Fetch founder ideas
        let my_ideas = sqlx::query_as::<_, Idea>(
            "SELECT * FROM ideas WHERE founder_id = $1 ORDER BY created_at DESC"
        )
        .bind(auth.id)
        .fetch_all(&pool)
        .await?;

        // Fetch pending requests for founder's ideas
        let pending_requests = sqlx::query_as!(
            JoinRequestDetail,
            r#"
            SELECT jr.id, jr.idea_id, jr.builder_id, u.name as builder_name, COALESCE(u.skills, '{}') as "builder_skills!", jr.message, jr.status, jr.created_at, i.title as idea_title
            FROM join_requests jr
            JOIN users u ON jr.builder_id = u.id
            JOIN ideas i ON jr.idea_id = i.id
            WHERE i.founder_id = $1 AND jr.status = 'pending'
            ORDER BY jr.created_at DESC
            "#,
            auth.id
        )
        .fetch_all(&pool)
        .await?;

        // Fetch investor signals for founder's ideas
        let investor_signals = sqlx::query_as!(
            InvestorInterestDetail,
            r#"
            SELECT ii.id, ii.idea_id, ii.investor_id, u.name as investor_name, ii.note, ii.created_at
            FROM investor_interests ii
            JOIN users u ON ii.investor_id = u.id
            JOIN ideas i ON ii.idea_id = i.id
            WHERE i.founder_id = $1
            ORDER BY ii.created_at DESC
            "#,
            auth.id
        )
        .fetch_all(&pool)
        .await?;

        Ok(Json(json!({
            "myIdeas": my_ideas,
            "pendingRequests": pending_requests,
            "investorSignals": investor_signals
        })))
    } else if auth.role == "builder" {
        // Fetch applied requests
        let applied_requests = sqlx::query!(
            r#"
            SELECT jr.id, jr.idea_id, jr.builder_id, jr.message, jr.status, jr.created_at, i.title as idea_title
            FROM join_requests jr
            JOIN ideas i ON jr.idea_id = i.id
            WHERE jr.builder_id = $1
            ORDER BY jr.created_at DESC
            "#,
            auth.id
        )
        .fetch_all(&pool)
        .await?
        .into_iter()
        .map(|r| json!({
            "id": r.id,
            "ideaId": r.idea_id,
            "builderId": r.builder_id,
            "message": r.message,
            "status": r.status,
            "createdAt": r.created_at,
            "ideaTitle": r.idea_title
        }))
        .collect::<Vec<_>>();

        // Fetch joined teams
        let my_teams = sqlx::query_as::<_, Idea>(
            r#"
            SELECT i.* 
            FROM ideas i
            JOIN team_members tm ON i.id = tm.idea_id
            WHERE tm.user_id = $1 AND i.founder_id != $1
            "#,
        )
        .bind(auth.id)
        .fetch_all(&pool)
        .await?;

        Ok(Json(json!({
            "appliedRequests": applied_requests,
            "myTeams": my_teams
        })))
    } else { // investor
        // Starred pipelines
        let pipeline = sqlx::query_as::<_, Idea>(
            r#"
            SELECT i.* 
            FROM ideas i
            JOIN investor_interests ii ON i.id = ii.idea_id
            WHERE ii.investor_id = $1
            "#,
        )
        .bind(auth.id)
        .fetch_all(&pool)
        .await?;

        // All startups
        let all_startups = sqlx::query_as::<_, Idea>(
            "SELECT * FROM ideas ORDER BY created_at DESC"
        )
        .fetch_all(&pool)
        .await?;

        Ok(Json(json!({
            "pipeline": pipeline,
            "allStartups": all_startups
        })))
    }
}

pub async fn get_profile(
    State(pool): State<PgPool>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let user = sqlx::query_as!(
        User,
        "SELECT * FROM users WHERE id = $1",
        user_id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Profile not found".to_string()))?;

    let public_user = PublicUser::from(user);

    let ideas = if public_user.role == "founder" {
        sqlx::query_as::<_, Idea>("SELECT * FROM ideas WHERE founder_id = $1")
            .bind(user_id)
            .fetch_all(&pool)
            .await?
    } else if public_user.role == "builder" {
        sqlx::query_as::<_, Idea>(
            r#"
            SELECT i.* 
            FROM ideas i
            JOIN team_members tm ON i.id = tm.idea_id
            WHERE tm.user_id = $1
            "#,
        )
        .bind(user_id)
        .fetch_all(&pool)
        .await?
    } else {
        vec![]
    };

    Ok(Json(json!({
        "user": public_user,
        "ideas": ideas
    })))
}

// Helper to generate dynamic, custom analyses based on startup idea details
fn generate_mock_analysis(
    _idea_id: Uuid,
    title: &str,
    description: &str,
    category: &str,
    stage: &str,
) -> (
    i32,
    i32,
    i32,
    i32,
    Vec<String>,
    Vec<String>,
    Vec<String>,
    Vec<String>,
    String,
) {
    let mut market_fit = 3;
    let mut viability = 3;
    let mut innovation = 3;

    // Adjust ratings based on startup stage
    match stage {
        "Idea" => {
            market_fit += 1;
            innovation += 2;
        }
        "Prototype" => {
            market_fit += 2;
            viability += 1;
            innovation += 1;
        }
        "MVP" => {
            market_fit += 2;
            viability += 2;
        }
        "Scaling" => {
            market_fit += 2;
            viability += 2;
            innovation -= 1;
        }
        _ => {}
    }

    // Adjust by description length and keywords
    if description.len() > 200 {
        viability += 1;
    }
    
    let desc_lower = description.to_lowercase();
    let title_lower = title.to_lowercase();

    if desc_lower.contains("ai") || desc_lower.contains("learning") || desc_lower.contains("intelligence") || title_lower.contains("ai") {
        innovation += 1;
        market_fit += 1;
    }
    if desc_lower.contains("blockchain") || desc_lower.contains("crypto") || desc_lower.contains("decentralized") || desc_lower.contains("defi") {
        innovation += 1;
        viability -= 1; // crypto regulatory hurdle
    }

    // Clamp ratings between 1 and 5
    market_fit = market_fit.clamp(1, 5);
    viability = viability.clamp(1, 5);
    innovation = innovation.clamp(1, 5);

    // Calculate overall score (40 to 99)
    let length_bonus = (description.len().min(500) as i32) / 25;
    let overall_score = (market_fit * 20 + viability * 20 + innovation * 20 + length_bonus).clamp(40, 99);

    // Build standard SWOT lists
    let mut strengths = vec![
        format!("Addresses a clear pain point in the {} sector.", category),
        "Cryptographic ledger verification protects IP baseline.".to_string(),
    ];
    let mut weaknesses = vec![
        format!("Project is in early stages ({}), carrying initial execution risks.", stage),
        "Requires building a highly specialized initial team.".to_string(),
    ];
    let mut opportunities = vec![
        format!("Strong tailwinds and growing demand for {} solutions.", category),
        "Ability to scale rapidly by leveraging platform developer slots.".to_string(),
    ];
    let mut threats = vec![
        "Potential competition from established tech platforms.".to_string(),
        "Compliance or regulatory shifts could delay deployment.".to_string(),
    ];

    let mut recommendations = format!(
        "1. Complete the core technical roadmap. Because your project is in the '{}' stage, validating core assumptions with a demo should be the priority.\n\
         2. Leverage the Invesa builder slot system to onboard developers and designers.\n\
         3. Maintain an active builder feed to show real-time progress to tracking investors.",
        stage
    );

    // Contextual customization for Agritech / Micro-lending / Farmers
    if desc_lower.contains("farmer") || desc_lower.contains("agri") || desc_lower.contains("lend") {
        strengths.push("Direct targeting of high-impact, underserved agricultural segments.".to_string());
        weaknesses.push("High dependency on offline agent trust and localized networks.".to_string());
        opportunities.push("Potential integration with localized agricultural cooperatives.".to_string());
        threats.push("Macroeconomic factors, crop failures, and climate risks.".to_string());
        recommendations = "1. Pilot the peer reputation lending model with a single cooperative to gather initial yield data.\n\
                           2. Design a simple offline protocol for local agents who handle transactions.\n\
                           3. Form partnerships with regional agritech suppliers to allow direct purchasing of supplies via micro-loans.".to_string();
    }
    // Contextual customization for Security / Document Verification / ZKP
    else if desc_lower.contains("document") || desc_lower.contains("proof") || desc_lower.contains("verification") || desc_lower.contains("zkp") {
        strengths.push("Privacy-first design guarantees document security without data storage.".to_string());
        weaknesses.push("ZKP cryptography is computationally intensive for mobile devices.".to_string());
        opportunities.push("B2B enterprise SaaS licensing for universities and HR systems.".to_string());
        threats.push("Fierce competition in decentralized identity (DID) standards.".to_string());
        recommendations = "1. Provide easy-to-integrate Web APIs or packages for existing HR and student information systems.\n\
                           2. Optimize the proving key generation process to ensure low latency on customer-facing frontends.\n\
                           3. Obtain third-party cryptographic audits early to build institutional credibility.".to_string();
    }
    // Contextual customization for general categories
    else if category == "Fintech" {
        strengths.push("Highly monetizable transactional model with potential for strong unit economics.".to_string());
        threats.push("Strict compliance requirements (KYC, local banking regulations).".to_string());
    } else if category == "Security" || category == "Web3" {
        strengths.push("Defensible tech stack presents high barriers to entry for competitors.".to_string());
        opportunities.push("Increasing global awareness and demand for user data sovereignty.".to_string());
    }

    (
        overall_score,
        market_fit,
        viability,
        innovation,
        strengths,
        weaknesses,
        opportunities,
        threats,
        recommendations,
    )
}

pub async fn get_idea_analysis(
    State(pool): State<PgPool>,
    Path(idea_id): Path<Uuid>,
) -> Result<Json<IdeaAnalysis>, AppError> {
    let analysis = sqlx::query_as::<_, IdeaAnalysis>(
        "SELECT id, idea_id, overall_score, market_fit_rating, viability_rating, innovation_rating, strengths, weaknesses, opportunities, threats, recommendations, created_at FROM idea_analyses WHERE idea_id = $1"
    )
    .bind(idea_id)
    .fetch_optional(&pool)
    .await?;

    match analysis {
        Some(a) => Ok(Json(a)),
        None => Err(AppError::NotFound("AI Analysis not found for this idea".to_string())),
    }
}

pub async fn analyze_idea(
    State(pool): State<PgPool>,
    _auth: AuthUser,
    Path(idea_id): Path<Uuid>,
) -> Result<Json<IdeaAnalysis>, AppError> {
    // 1. Fetch idea metadata
    let idea = sqlx::query_as::<_, Idea>(
        "SELECT id, founder_id, title, summary, description, category, stage, team_slots, ip_hash, created_at FROM ideas WHERE id = $1"
    )
    .bind(idea_id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Startup idea not found".to_string()))?;

    // 2. Generate analysis
    let (
        overall_score,
        market_fit,
        viability,
        innovation,
        strengths,
        weaknesses,
        opportunities,
        threats,
        recommendations,
    ) = generate_mock_analysis(idea_id, &idea.title, &idea.description, &idea.category, &idea.stage);

    // 3. Insert or update analysis (ON CONFLICT on idea_id)
    let analysis = sqlx::query_as::<_, IdeaAnalysis>(
        r#"
        INSERT INTO idea_analyses (
            idea_id, overall_score, market_fit_rating, viability_rating, innovation_rating,
            strengths, weaknesses, opportunities, threats, recommendations
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (idea_id) DO UPDATE SET
            overall_score = EXCLUDED.overall_score,
            market_fit_rating = EXCLUDED.market_fit_rating,
            viability_rating = EXCLUDED.viability_rating,
            innovation_rating = EXCLUDED.innovation_rating,
            strengths = EXCLUDED.strengths,
            weaknesses = EXCLUDED.weaknesses,
            opportunities = EXCLUDED.opportunities,
            threats = EXCLUDED.threats,
            recommendations = EXCLUDED.recommendations,
            created_at = CURRENT_TIMESTAMP
        RETURNING id, idea_id, overall_score, market_fit_rating, viability_rating, innovation_rating, strengths, weaknesses, opportunities, threats, recommendations, created_at
        "#,
    )
    .bind(idea_id)
    .bind(overall_score)
    .bind(market_fit)
    .bind(viability)
    .bind(innovation)
    .bind(&strengths)
    .bind(&weaknesses)
    .bind(&opportunities)
    .bind(&threats)
    .bind(recommendations)
    .fetch_one(&pool)
    .await?;

    Ok(Json(analysis))
}

pub async fn get_feed(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<IdeaPost>>, AppError> {
    let rows = sqlx::query(
        r#"
        SELECT 
            p.id, 
            p.idea_id, 
            i.title as idea_title, 
            p.author_id, 
            p.author_name, 
            p.post_type, 
            p.content, 
            p.media_url, 
            p.likes, 
            COALESCE(array_agg(pl.user_id) FILTER (WHERE pl.user_id IS NOT NULL), '{}') as liked_by, 
            p.created_at
        FROM idea_posts p
        JOIN ideas i ON p.idea_id = i.id
        LEFT JOIN post_likes pl ON p.id = pl.post_id
        GROUP BY p.id, i.title
        ORDER BY p.created_at DESC
        "#
    )
    .fetch_all(&pool)
    .await?;

    let posts = rows
        .into_iter()
        .map(|row| IdeaPost {
            id: row.get("id"),
            idea_id: row.get("idea_id"),
            idea_title: row.get("idea_title"),
            author_id: row.get("author_id"),
            author_name: row.get("author_name"),
            post_type: row.get("post_type"),
            content: row.get("content"),
            media_url: row.get("media_url"),
            likes: row.get("likes"),
            liked_by: row.get("liked_by"),
            created_at: row.get("created_at"),
        })
        .collect();

    Ok(Json(posts))
}

pub async fn get_idea_posts(
    State(pool): State<PgPool>,
    Path(idea_id): Path<Uuid>,
) -> Result<Json<Vec<IdeaPost>>, AppError> {
    let rows = sqlx::query(
        r#"
        SELECT 
            p.id, 
            p.idea_id, 
            i.title as idea_title, 
            p.author_id, 
            p.author_name, 
            p.post_type, 
            p.content, 
            p.media_url, 
            p.likes, 
            COALESCE(array_agg(pl.user_id) FILTER (WHERE pl.user_id IS NOT NULL), '{}') as liked_by, 
            p.created_at
        FROM idea_posts p
        JOIN ideas i ON p.idea_id = i.id
        LEFT JOIN post_likes pl ON p.id = pl.post_id
        WHERE p.idea_id = $1
        GROUP BY p.id, i.title
        ORDER BY p.created_at DESC
        "#
    )
    .bind(idea_id)
    .fetch_all(&pool)
    .await?;

    let posts = rows
        .into_iter()
        .map(|row| IdeaPost {
            id: row.get("id"),
            idea_id: row.get("idea_id"),
            idea_title: row.get("idea_title"),
            author_id: row.get("author_id"),
            author_name: row.get("author_name"),
            post_type: row.get("post_type"),
            content: row.get("content"),
            media_url: row.get("media_url"),
            likes: row.get("likes"),
            liked_by: row.get("liked_by"),
            created_at: row.get("created_at"),
        })
        .collect();

    Ok(Json(posts))
}

pub async fn create_idea_post(
    State(pool): State<PgPool>,
    auth: AuthUser,
    Path(idea_id): Path<Uuid>,
    Json(payload): Json<CreatePostReq>,
) -> Result<Json<IdeaPost>, AppError> {
    // Validate input
    payload.validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {}", e)))?;

    // 1. Verify idea exists and user has permission to post
    let idea_row = sqlx::query("SELECT founder_id FROM ideas WHERE id = $1")
        .bind(idea_id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Idea not found".to_string()))?;

    let founder_id: Uuid = idea_row.get("founder_id");

    let is_team_member = if founder_id == auth.id {
        true
    } else {
        let member = sqlx::query("SELECT id FROM team_members WHERE idea_id = $1 AND user_id = $2")
            .bind(idea_id)
            .bind(auth.id)
            .fetch_optional(&pool)
            .await?;
        member.is_some()
    };

    if !is_team_member {
        return Err(AppError::Forbidden(
            "Only the founder and accepted team members can post updates".to_string(),
        ));
    }

    // 2. Fetch user name
    let user_row = sqlx::query("SELECT name FROM users WHERE id = $1")
        .bind(auth.id)
        .fetch_one(&pool)
        .await?;
    let author_name: String = user_row.get("name");

    // 3. Create the post
    let post_id = Uuid::new_v4();
    let post_row = sqlx::query(
        r#"
        INSERT INTO idea_posts (id, idea_id, author_id, author_name, post_type, content, media_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, idea_id, author_id, author_name, post_type, content, media_url, likes, created_at
        "#
    )
    .bind(post_id)
    .bind(idea_id)
    .bind(auth.id)
    .bind(author_name)
    .bind(payload.post_type)
    .bind(payload.content)
    .bind(payload.media_url)
    .fetch_one(&pool)
    .await?;

    // 4. Fetch idea title
    let idea_title_row = sqlx::query("SELECT title FROM ideas WHERE id = $1")
        .bind(idea_id)
        .fetch_one(&pool)
        .await?;
    let idea_title: String = idea_title_row.get("title");

    Ok(Json(IdeaPost {
        id: post_row.get("id"),
        idea_id: post_row.get("idea_id"),
        idea_title,
        author_id: post_row.get("author_id"),
        author_name: post_row.get("author_name"),
        post_type: post_row.get("post_type"),
        content: post_row.get("content"),
        media_url: post_row.get("media_url"),
        likes: post_row.get("likes"),
        liked_by: vec![],
        created_at: post_row.get("created_at"),
    }))
}

pub async fn toggle_post_like(
    State(pool): State<PgPool>,
    auth: AuthUser,
    Path(post_id): Path<Uuid>,
) -> Result<Json<IdeaPost>, AppError> {
    // Check if post exists
    let post_exists = sqlx::query("SELECT id FROM idea_posts WHERE id = $1")
        .bind(post_id)
        .fetch_optional(&pool)
        .await?;

    if post_exists.is_none() {
        return Err(AppError::NotFound("Post not found".to_string()));
    }

    let existing_like = sqlx::query("SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2")
        .bind(post_id)
        .bind(auth.id)
        .fetch_optional(&pool)
        .await?;

    let mut tx = pool.begin().await?;

    if existing_like.is_some() {
        // Remove like
        sqlx::query("DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2")
            .bind(post_id)
            .bind(auth.id)
            .execute(&mut *tx)
            .await?;

        sqlx::query("UPDATE idea_posts SET likes = GREATEST(0, likes - 1) WHERE id = $1")
            .bind(post_id)
            .execute(&mut *tx)
            .await?;
    } else {
        // Add like
        sqlx::query("INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)")
            .bind(post_id)
            .bind(auth.id)
            .execute(&mut *tx)
            .await?;

        sqlx::query("UPDATE idea_posts SET likes = likes + 1 WHERE id = $1")
            .bind(post_id)
            .execute(&mut *tx)
            .await?;
    }

    tx.commit().await?;

    let post = fetch_post_by_id(&pool, post_id).await?;
    Ok(Json(post))
}

async fn fetch_post_by_id(pool: &PgPool, post_id: Uuid) -> Result<IdeaPost, AppError> {
    let row = sqlx::query(
        r#"
        SELECT 
            p.id, 
            p.idea_id, 
            i.title as idea_title, 
            p.author_id, 
            p.author_name, 
            p.post_type, 
            p.content, 
            p.media_url, 
            p.likes, 
            COALESCE(array_agg(pl.user_id) FILTER (WHERE pl.user_id IS NOT NULL), '{}') as liked_by, 
            p.created_at
        FROM idea_posts p
        JOIN ideas i ON p.idea_id = i.id
        LEFT JOIN post_likes pl ON p.id = pl.post_id
        WHERE p.id = $1
        GROUP BY p.id, i.title
        "#
    )
    .bind(post_id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Post not found".to_string()))?;

    Ok(IdeaPost {
        id: row.get("id"),
        idea_id: row.get("idea_id"),
        idea_title: row.get("idea_title"),
        author_id: row.get("author_id"),
        author_name: row.get("author_name"),
        post_type: row.get("post_type"),
        content: row.get("content"),
        media_url: row.get("media_url"),
        likes: row.get("likes"),
        liked_by: row.get("liked_by"),
        created_at: row.get("created_at"),
    })
}

// ----------------------------------------
// SIMULATION & MATCHMAKER HANDLERS
// ----------------------------------------

pub async fn save_simulation(
    State(pool): State<PgPool>,
    auth: AuthUser,
    Json(payload): Json<CreateSimulationReq>,
) -> Result<Json<SavedSimulation>, AppError> {
    let series_a_val = payload.series_a_valuation.unwrap_or(0.0);
    let series_a_r = payload.series_a_raise.unwrap_or(0.0);
    let series_a_opt = payload.series_a_option_pool.unwrap_or(0.0);

    let sim = sqlx::query_as!(
        SavedSimulation,
        r#"
        INSERT INTO saved_simulations (
            user_id, idea_id, title, pre_money_valuation, raise_amount, 
            option_pool_percent, co_founder_percent, 
            series_a_valuation, series_a_raise, series_a_option_pool
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, user_id, idea_id, title, pre_money_valuation, raise_amount, 
                  option_pool_percent, co_founder_percent, 
                  series_a_valuation, series_a_raise, series_a_option_pool, created_at
        "#,
        auth.id,
        payload.idea_id,
        payload.title,
        payload.pre_money_valuation,
        payload.raise_amount,
        payload.option_pool_percent,
        payload.co_founder_percent,
        series_a_val,
        series_a_r,
        series_a_opt
    )
    .fetch_one(&pool)
    .await?;

    Ok(Json(sim))
}

pub async fn get_simulations(
    State(pool): State<PgPool>,
    auth: AuthUser,
) -> Result<Json<Vec<SavedSimulation>>, AppError> {
    let sims = sqlx::query_as!(
        SavedSimulation,
        r#"
        SELECT id, user_id, idea_id, title, pre_money_valuation, raise_amount, 
               option_pool_percent, co_founder_percent, 
               series_a_valuation, series_a_raise, series_a_option_pool, created_at
        FROM saved_simulations
        WHERE user_id = $1
        ORDER BY created_at DESC
        "#,
        auth.id
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(sims))
}

pub async fn get_simulation_by_idea(
    State(pool): State<PgPool>,
    auth: AuthUser,
    Path(idea_id): Path<Uuid>,
) -> Result<Json<Option<SavedSimulation>>, AppError> {
    // Check if the user is authorized to view the simulation:
    // - Founder of the idea
    // - Accepted team member of the idea
    // - Investor who expressed interest in the idea
    let is_auth = sqlx::query_scalar!(
        r#"
        SELECT EXISTS (
            SELECT 1 FROM ideas WHERE id = $1 AND founder_id = $2
            UNION ALL
            SELECT 1 FROM team_members WHERE idea_id = $1 AND user_id = $2
            UNION ALL
            SELECT 1 FROM investor_interests WHERE idea_id = $1 AND investor_id = $2
        ) as "exists!"
        "#,
        idea_id,
        auth.id
    )
    .fetch_one(&pool)
    .await?;

    if !is_auth {
        return Err(AppError::Forbidden("You are not authorized to view this cap table simulation".to_string()));
    }

    let sim = sqlx::query_as!(
        SavedSimulation,
        r#"
        SELECT id, user_id, idea_id, title, pre_money_valuation, raise_amount, 
               option_pool_percent, co_founder_percent, 
               series_a_valuation, series_a_raise, series_a_option_pool, created_at
        FROM saved_simulations
        WHERE idea_id = $1
        ORDER BY created_at DESC
        LIMIT 1
        "#,
        idea_id
    )
    .fetch_optional(&pool)
    .await?;

    Ok(Json(sim))
}

pub async fn delete_simulation(
    State(pool): State<PgPool>,
    auth: AuthUser,
    Path(sim_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    let result = sqlx::query!(
        "DELETE FROM saved_simulations WHERE id = $1 AND user_id = $2",
        sim_id,
        auth.id
    )
    .execute(&pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Simulation not found or unauthorized".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_matchmaker(
    State(pool): State<PgPool>,
    auth: AuthUser,
) -> Result<Json<MatchmakerRes>, AppError> {
    let current_user = sqlx::query_as!(
        User,
        "SELECT * FROM users WHERE id = $1",
        auth.id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    let user_role = current_user.role.as_str();

    match user_role {
        "founder" => {
            let founder_ideas = sqlx::query_as!(
                Idea,
                "SELECT id, founder_id, title, summary, description, category, stage, team_slots, ip_hash, created_at FROM ideas WHERE founder_id = $1",
                auth.id
            )
            .fetch_all(&pool)
            .await?;

            let builders = sqlx::query_as!(
                User,
                "SELECT * FROM users WHERE role = 'builder'"
            )
            .fetch_all(&pool)
            .await?;

            let mut builder_matches = Vec::new();

            for builder in builders {
                let builder_skills = builder.skills.clone().unwrap_or_default();
                let mut max_score = 0;
                let mut best_matching = Vec::new();
                let mut best_missing = Vec::new();

                for idea in &founder_ideas {
                    let mut matching = Vec::new();
                    let mut missing = Vec::new();

                    for slot in &idea.team_slots {
                        let slot_lower = slot.to_lowercase();
                        let found = builder_skills.iter().any(|s| {
                            let s_lower = s.to_lowercase();
                            s_lower.contains(&slot_lower) || slot_lower.contains(&s_lower)
                        });

                        if found {
                            matching.push(slot.clone());
                        } else {
                            missing.push(slot.clone());
                        }
                    }

                    let score = if idea.team_slots.is_empty() {
                        0
                    } else {
                        ((matching.len() as f32 / idea.team_slots.len() as f32) * 100.0) as i32
                    };

                    if score > max_score || builder_matches.is_empty() {
                        max_score = score;
                        best_matching = matching;
                        best_missing = missing;
                    }
                }

                if founder_ideas.is_empty() {
                    max_score = 30;
                }

                builder_matches.push(BuilderMatch {
                    builder: PublicUser::from(builder),
                    match_score: max_score,
                    matching_skills: best_matching,
                    missing_skills: best_missing,
                });
            }

            builder_matches.sort_by(|a, b| b.match_score.cmp(&a.match_score));

            Ok(Json(MatchmakerRes {
                builder_matches: Some(builder_matches),
                idea_matches: None,
            }))
        }
        "builder" => {
            let ideas = sqlx::query_as!(
                Idea,
                "SELECT id, founder_id, title, summary, description, category, stage, team_slots, ip_hash, created_at FROM ideas"
            )
            .fetch_all(&pool)
            .await?;

            let builder_skills = current_user.skills.clone().unwrap_or_default();
            let mut idea_matches = Vec::new();

            for idea in ideas {
                let founder = sqlx::query!("SELECT name FROM users WHERE id = $1", idea.founder_id)
                    .fetch_optional(&pool)
                    .await?;
                let founder_name = founder.map(|f| f.name).unwrap_or_else(|| "Unknown".to_string());

                let mut matching = Vec::new();
                let mut missing = Vec::new();

                for slot in &idea.team_slots {
                    let slot_lower = slot.to_lowercase();
                    let found = builder_skills.iter().any(|s| {
                        let s_lower = s.to_lowercase();
                        s_lower.contains(&slot_lower) || slot_lower.contains(&s_lower)
                    });

                    if found {
                        matching.push(slot.clone());
                    } else {
                        missing.push(slot.clone());
                    }
                }

                let score = if idea.team_slots.is_empty() {
                    0
                } else {
                    ((matching.len() as f32 / idea.team_slots.len() as f32) * 100.0) as i32
                };

                let mut final_score = score;
                if let Some(ref bio) = current_user.bio {
                    let bio_lower = bio.to_lowercase();
                    if bio_lower.contains(&idea.category.to_lowercase()) {
                        final_score = std::cmp::min(100, final_score + 15);
                    }
                }

                idea_matches.push(IdeaMatch {
                    idea,
                    founder_name,
                    match_score: final_score,
                    matching_skills: matching,
                    missing_skills: missing,
                });
            }

            idea_matches.sort_by(|a, b| b.match_score.cmp(&a.match_score));

            Ok(Json(MatchmakerRes {
                builder_matches: None,
                idea_matches: Some(idea_matches),
            }))
        }
        "investor" => {
            let ideas = sqlx::query_as!(
                Idea,
                "SELECT id, founder_id, title, summary, description, category, stage, team_slots, ip_hash, created_at FROM ideas"
            )
            .fetch_all(&pool)
            .await?;

            let bio_lower = current_user.bio.clone().unwrap_or_default().to_lowercase();
            let mut idea_matches = Vec::new();

            for idea in ideas {
                let founder = sqlx::query!("SELECT name FROM users WHERE id = $1", idea.founder_id)
                    .fetch_optional(&pool)
                    .await?;
                let founder_name = founder.map(|f| f.name).unwrap_or_else(|| "Unknown".to_string());

                let cat_lower = idea.category.to_lowercase();
                let has_cat_match = bio_lower.contains(&cat_lower);
                
                let mut score = if has_cat_match { 85 } else { 40 };

                if bio_lower.contains("early") && (idea.stage == "Idea" || idea.stage == "Prototype") {
                    score = std::cmp::min(100, score + 15);
                } else if bio_lower.contains("growth") && (idea.stage == "MVP" || idea.stage == "Scaling") {
                    score = std::cmp::min(100, score + 15);
                }

                let idea_cat = idea.category.clone();
                idea_matches.push(IdeaMatch {
                    idea,
                    founder_name,
                    match_score: score,
                    matching_skills: vec![idea_cat],
                    missing_skills: vec![],
                });
            }

            idea_matches.sort_by(|a, b| b.match_score.cmp(&a.match_score));

            Ok(Json(MatchmakerRes {
                builder_matches: None,
                idea_matches: Some(idea_matches),
            }))
        }
        _ => Err(AppError::BadRequest("Invalid user role for matchmaker".to_string()))
    }
}

// ----------------------------------------
// SECURE CHAT & WEBSOCKETS ROUTES
// ----------------------------------------
use axum::extract::ws::{WebSocketUpgrade, WebSocket, Message};
use std::sync::OnceLock;
use std::sync::Arc;
use tokio::sync::RwLock;
use std::collections::HashMap;
use tokio::sync::mpsc::UnboundedSender;
use jsonwebtoken::{decode, DecodingKey, Validation};
use futures_util::{StreamExt, SinkExt};

pub type TxMap = Arc<RwLock<HashMap<Uuid, UnboundedSender<ChatMessage>>>>;
pub static ACTIVE_PEERS: OnceLock<TxMap> = OnceLock::new();

pub fn get_active_peers() -> &'static TxMap {
    ACTIVE_PEERS.get_or_init(|| Arc::new(RwLock::new(HashMap::new())))
}

#[derive(Debug, Deserialize)]
pub struct WsParams {
    pub token: String,
}

fn validate_token(token: &str) -> Result<Claims, AppError> {
    let jwt_secret = std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "invesa_secret_super_key_12345_secure_key".to_string());

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|err| AppError::Unauthorized(format!("Invalid token: {}", err)))?;

    Ok(token_data.claims)
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Query(params): Query<WsParams>,
    State(pool): State<PgPool>,
) -> Result<axum::response::Response, AppError> {
    let claims = validate_token(&params.token)?;
    Ok(ws.on_upgrade(move |socket| handle_socket(socket, claims.sub, pool)))
}

async fn handle_socket(socket: WebSocket, user_id: Uuid, pool: PgPool) {
    let (mut sender, mut receiver) = socket.split();
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<ChatMessage>();

    // Register sender
    get_active_peers().write().await.insert(user_id, tx);

    // Spawn task to send messages to this client
    let mut send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            let serialized = match serde_json::to_string(&msg) {
                Ok(s) => s,
                Err(e) => {
                    tracing::error!("Failed to serialize chat message: {}", e);
                    continue;
                }
            };
            if sender.send(Message::Text(serialized.into())).await.is_err() {
                break;
            }
        }
    });

    // Handle incoming messages from this client
    let pool_clone = pool.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(result) = receiver.next().await {
            let msg = match result {
                Ok(m) => m,
                Err(e) => {
                    tracing::error!("WebSocket error: {}", e);
                    break;
                }
            };

            match msg {
                Message::Text(text) => {
                    let payload: SendMessagePayload = match serde_json::from_str(&text) {
                        Ok(p) => p,
                        Err(e) => {
                            tracing::error!("Failed to parse message payload: {}", e);
                            continue;
                        }
                    };

                    // Check if receiver_id is a project channel (idea_id)
                    let is_idea = sqlx::query!("SELECT founder_id FROM ideas WHERE id = $1", payload.receiver_id)
                        .fetch_optional(&pool_clone)
                        .await
                        .unwrap_or(None);

                    if is_idea.is_some() {
                        // Access Control: Validate that the sender is on the project team
                        let is_member = sqlx::query!(
                            "SELECT id FROM team_members WHERE idea_id = $1 AND user_id = $2",
                            payload.receiver_id,
                            user_id
                        )
                        .fetch_optional(&pool_clone)
                        .await
                        .unwrap_or(None);

                        if is_member.is_none() {
                            tracing::warn!("Blocked unauthorized user {} attempting to send message to team meeting {}", user_id, payload.receiver_id);
                            continue;
                        }

                        // Save the message in team_messages table
                        let row = match sqlx::query!(
                            r#"
                            INSERT INTO team_messages (idea_id, sender_id, message)
                            VALUES ($1, $2, $3)
                            RETURNING id, idea_id, sender_id, message, created_at
                            "#,
                            payload.receiver_id,
                            user_id,
                            payload.message
                        )
                        .fetch_one(&pool_clone)
                        .await {
                            Ok(r) => r,
                            Err(e) => {
                                tracing::error!("Database insert failed for team message: {}", e);
                                continue;
                            }
                        };

                        let chat_msg = ChatMessage {
                            id: row.id,
                            sender_id: row.sender_id,
                            receiver_id: row.idea_id, // maps to idea_id
                            message: row.message,
                            created_at: row.created_at,
                        };

                        // Broadcast to all team members online
                        let teammates = sqlx::query!(
                            "SELECT user_id FROM team_members WHERE idea_id = $1",
                            payload.receiver_id
                        )
                        .fetch_all(&pool_clone)
                        .await
                        .unwrap_or_default();

                        let peers = get_active_peers().read().await;
                        for tm in teammates {
                            if let Some(peer_tx) = peers.get(&tm.user_id) {
                                let _ = peer_tx.send(chat_msg.clone());
                            }
                        }
                        continue;
                    }

                    // Insert message into database (Standard 1-to-1 DMs logic)
                    let chat_msg = match sqlx::query_as!(
                        ChatMessage,
                        r#"
                        INSERT INTO chat_messages (sender_id, receiver_id, message)
                        VALUES ($1, $2, $3)
                        RETURNING id, sender_id, receiver_id, message, created_at
                        "#,
                        user_id,
                        payload.receiver_id,
                        payload.message
                    )
                    .fetch_one(&pool_clone)
                    .await {
                        Ok(m) => m,
                        Err(e) => {
                            tracing::error!("Database insert failed for chat message: {}", e);
                            continue;
                        }
                    };

                    // Broadcast message to recipient if online
                    let peers = get_active_peers().read().await;
                    if let Some(receiver_tx) = peers.get(&payload.receiver_id) {
                        let _ = receiver_tx.send(chat_msg.clone());
                    }

                    // Echo back to sender
                    if let Some(sender_tx) = peers.get(&user_id) {
                        let _ = sender_tx.send(chat_msg);
                    }
                }
                Message::Close(_) => {
                    break;
                }
                _ => {} // Ignore ping, pong, or binary frames
            }
        }
    });

    // Wait for either task to finish and abort the other
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };

    // Unregister sender on disconnect
    get_active_peers().write().await.remove(&user_id);
}

pub async fn get_chat_history(
    State(pool): State<PgPool>,
    Path(with_user_id): Path<Uuid>,
    auth_user: AuthUser,
) -> Result<Json<Vec<ChatMessage>>, AppError> {
    // Check if with_user_id corresponds to a project channel (idea_id)
    let is_idea = sqlx::query!("SELECT founder_id FROM ideas WHERE id = $1", with_user_id)
        .fetch_optional(&pool)
        .await?;

    if is_idea.is_some() {
        // Access Control: Validate that the authenticated user is on the project team
        let is_member = sqlx::query!(
            "SELECT id FROM team_members WHERE idea_id = $1 AND user_id = $2",
            with_user_id,
            auth_user.id
        )
        .fetch_optional(&pool)
        .await?;

        if is_member.is_none() {
            return Err(AppError::Forbidden("Access Denied: You are not a member of this team project".to_string()));
        }

        // Return group chat messages mapped as ChatMessage objects
        let messages = sqlx::query_as!(
            ChatMessage,
            r#"
            SELECT id, sender_id, idea_id AS receiver_id, message, created_at
            FROM team_messages
            WHERE idea_id = $1
            ORDER BY created_at ASC
            "#,
            with_user_id
        )
        .fetch_all(&pool)
        .await?;

        return Ok(Json(messages));
    }

    // Standard 1-to-1 DMs logic
    let messages = sqlx::query_as!(
        ChatMessage,
        r#"
        SELECT id, sender_id, receiver_id, message, created_at
        FROM chat_messages
        WHERE (sender_id = $1 AND receiver_id = $2)
           OR (sender_id = $2 AND receiver_id = $1)
        ORDER BY created_at ASC
        "#,
        auth_user.id,
        with_user_id
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(messages))
}

pub async fn get_chat_conversations(
    State(pool): State<PgPool>,
    auth_user: AuthUser,
) -> Result<Json<Vec<Conversation>>, AppError> {
    let conversations = sqlx::query_as!(
        Conversation,
        r#"
        WITH last_msgs AS (
            SELECT DISTINCT ON (
                CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END
            )
            id,
            sender_id,
            receiver_id,
            message,
            created_at,
            CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS partner_id
            FROM chat_messages
            WHERE sender_id = $1 OR receiver_id = $1
            ORDER BY partner_id, created_at DESC
        )
        SELECT 
            u.id AS user_id,
            u.name,
            u.role,
            lm.message AS "last_message?",
            lm.created_at AS "last_message_time?"
        FROM last_msgs lm
        JOIN users u ON u.id = lm.partner_id
        ORDER BY lm.created_at DESC
        "#,
        auth_user.id
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(conversations))
}

// ----------------------------------------
// FORGOT & RESET PASSWORD ROUTE HANDLERS
// ----------------------------------------

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ForgotPasswordReq {
    pub email: String,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ForgotPasswordRes {
    pub message: String,
    pub code_for_demo: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResetPasswordReq {
    pub email: String,
    #[serde(rename = "recovery_key_hash")]
    pub recovery_key_hash: String,
    pub new_password_hash: String,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResetPasswordRes {
    pub message: String,
}

pub async fn forgot_password(
    State(pool): State<PgPool>,
    Json(payload): Json<ForgotPasswordReq>,
) -> Result<Json<ForgotPasswordRes>, AppError> {
    let email_lower = payload.email.to_lowercase();
    
    // Check if user exists in database using runtime query
    let user_exists: bool = sqlx::query_scalar::<_, bool>("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)")
        .bind(&email_lower)
        .fetch_one(&pool)
        .await?;

    if !user_exists {
        return Err(AppError::NotFound("No account associated with this email address was found".to_string()));
    }

    Ok(Json(ForgotPasswordRes {
        message: "Email verified. Please paste or upload your recovery key to reset your password.".to_string(),
        code_for_demo: None,
    }))
}

pub async fn reset_password(
    State(pool): State<PgPool>,
    Json(payload): Json<ResetPasswordReq>,
) -> Result<Json<ResetPasswordRes>, AppError> {
    let email_lower = payload.email.to_lowercase();

    // Fetch stored recovery key hash
    let user_row = sqlx::query!("SELECT recovery_key_hash FROM users WHERE email = $1", email_lower)
        .fetch_optional(&pool)
        .await?;

    let user_data = user_row.ok_or_else(|| AppError::NotFound("User not found".to_string()))?;
    
    // Verify recovery key hash match
    if user_data.recovery_key_hash != payload.recovery_key_hash {
        return Err(AppError::BadRequest("Invalid recovery key".to_string()));
    }

    // Hash the new password using bcrypt
    let hashed_pw = hash(&payload.new_password_hash, DEFAULT_COST)
        .map_err(|e| AppError::Internal(format!("Password hashing failed: {}", e)))?;

    // Update database using runtime query
    sqlx::query("UPDATE users SET password_hash = $1 WHERE email = $2")
        .bind(hashed_pw)
        .bind(&email_lower)
        .execute(&pool)
        .await?;

    Ok(Json(ResetPasswordRes {
        message: "Your password has been successfully reset. You can now log in with your new password.".to_string(),
    }))
}

pub async fn get_team_meetings(
    State(pool): State<PgPool>,
    auth_user: AuthUser,
) -> Result<Json<Vec<Conversation>>, AppError> {
    let channels = sqlx::query!(
        r#"
        SELECT i.id AS idea_id, i.title AS name, i.created_at AS last_message_time
        FROM ideas i
        JOIN team_members tm ON i.id = tm.idea_id
        WHERE tm.user_id = $1
        ORDER BY i.created_at DESC
        "#,
        auth_user.id
    )
    .fetch_all(&pool)
    .await?;

    let mut list = Vec::new();
    for c in channels {
        list.push(Conversation {
            user_id: c.idea_id,
            name: c.name,
            role: "channel".to_string(),
            last_message: Some("Project team discussion channel.".to_string()),
            last_message_time: Some(c.last_message_time),
        });
    }

    Ok(Json(list))
}

// ----------------------------------------
// Kanban Board Task Endpoints
// ----------------------------------------

pub async fn get_tasks(
    State(pool): State<PgPool>,
    Path(idea_id): Path<Uuid>,
    auth_user: AuthUser,
) -> Result<Json<Vec<Task>>, AppError> {
    // Access Control: Validate that the authenticated user is on the project team
    let is_member = sqlx::query!(
        "SELECT id FROM team_members WHERE idea_id = $1 AND user_id = $2",
        idea_id,
        auth_user.id
    )
    .fetch_optional(&pool)
    .await?;

    if is_member.is_none() {
        return Err(AppError::Forbidden("Access Denied: You are not a member of this team project".to_string()));
    }

    let tasks = sqlx::query_as!(
        Task,
        r#"
        SELECT id, idea_id, title, description, status, assignee_id, creator_id, due_date, position, created_at, updated_at
        FROM tasks
        WHERE idea_id = $1
        ORDER BY position ASC, created_at ASC
        "#,
        idea_id
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(tasks))
}

pub async fn create_task(
    State(pool): State<PgPool>,
    Path(idea_id): Path<Uuid>,
    auth_user: AuthUser,
    Json(payload): Json<CreateTaskReq>,
) -> Result<Json<Task>, AppError> {
    payload.validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {}", e)))?;

    // Access Control: Validate that the authenticated user is on the project team
    let is_member = sqlx::query!(
        "SELECT id FROM team_members WHERE idea_id = $1 AND user_id = $2",
        idea_id,
        auth_user.id
    )
    .fetch_optional(&pool)
    .await?;

    if is_member.is_none() {
        return Err(AppError::Forbidden("Access Denied: You are not a member of this team project".to_string()));
    }

    let description = payload.description.unwrap_or_default();
    let status = payload.status.unwrap_or_else(|| "todo".to_string());
    let position = payload.position.unwrap_or(0);

    let task = sqlx::query_as!(
        Task,
        r#"
        INSERT INTO tasks (idea_id, title, description, status, assignee_id, creator_id, due_date, position)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, idea_id, title, description, status, assignee_id, creator_id, due_date, position, created_at, updated_at
        "#,
        idea_id,
        payload.title,
        description,
        status,
        payload.assignee_id,
        auth_user.id,
        payload.due_date,
        position
    )
    .fetch_one(&pool)
    .await?;

    // Broadcast tasks update event to online team members
    broadcast_task_event(idea_id, auth_user.id, &pool).await;

    Ok(Json(task))
}

pub async fn update_task(
    State(pool): State<PgPool>,
    Path((idea_id, task_id)): Path<(Uuid, Uuid)>,
    auth_user: AuthUser,
    Json(payload): Json<UpdateTaskReq>,
) -> Result<Json<Task>, AppError> {
    payload.validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {}", e)))?;

    // Access Control: Validate that the authenticated user is on the project team
    let is_member = sqlx::query!(
        "SELECT id FROM team_members WHERE idea_id = $1 AND user_id = $2",
        idea_id,
        auth_user.id
    )
    .fetch_optional(&pool)
    .await?;

    if is_member.is_none() {
        return Err(AppError::Forbidden("Access Denied: You are not a member of this team project".to_string()));
    }

    // Check if task exists and belongs to this idea_id
    let task_exists = sqlx::query!("SELECT id FROM tasks WHERE id = $1 AND idea_id = $2", task_id, idea_id)
        .fetch_optional(&pool)
        .await?;

    if task_exists.is_none() {
        return Err(AppError::NotFound("Task not found".to_string()));
    }

    let description = payload.description.unwrap_or_default();

    let task = sqlx::query_as!(
        Task,
        r#"
        UPDATE tasks
        SET title = $1, description = $2, status = $3, assignee_id = $4, due_date = $5, position = $6, updated_at = CURRENT_TIMESTAMP
        WHERE id = $7 AND idea_id = $8
        RETURNING id, idea_id, title, description, status, assignee_id, creator_id, due_date, position, created_at, updated_at
        "#,
        payload.title,
        description,
        payload.status,
        payload.assignee_id,
        payload.due_date,
        payload.position,
        task_id,
        idea_id
    )
    .fetch_one(&pool)
    .await?;

    // Broadcast tasks update event to online team members
    broadcast_task_event(idea_id, auth_user.id, &pool).await;

    Ok(Json(task))
}

pub async fn delete_task(
    State(pool): State<PgPool>,
    Path((idea_id, task_id)): Path<(Uuid, Uuid)>,
    auth_user: AuthUser,
) -> Result<StatusCode, AppError> {
    // Access Control: Validate that the authenticated user is on the project team
    let is_member = sqlx::query!(
        "SELECT id FROM team_members WHERE idea_id = $1 AND user_id = $2",
        idea_id,
        auth_user.id
    )
    .fetch_optional(&pool)
    .await?;

    if is_member.is_none() {
        return Err(AppError::Forbidden("Access Denied: You are not a member of this team project".to_string()));
    }

    // Check if task exists and belongs to this idea_id
    let task_exists = sqlx::query!("SELECT id FROM tasks WHERE id = $1 AND idea_id = $2", task_id, idea_id)
        .fetch_optional(&pool)
        .await?;

    if task_exists.is_none() {
        return Err(AppError::NotFound("Task not found".to_string()));
    }

    sqlx::query!("DELETE FROM tasks WHERE id = $1 AND idea_id = $2", task_id, idea_id)
        .execute(&pool)
        .await?;

    // Broadcast tasks update event to online team members
    broadcast_task_event(idea_id, auth_user.id, &pool).await;

    Ok(StatusCode::NO_CONTENT)
}

async fn broadcast_task_event(idea_id: Uuid, sender_id: Uuid, pool: &PgPool) {
    let teammates = sqlx::query!(
        "SELECT user_id FROM team_members WHERE idea_id = $1",
        idea_id
    )
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    let event_msg = ChatMessage {
        id: Uuid::new_v4(),
        sender_id,
        receiver_id: idea_id,
        message: format!(r#"{{"event":"tasks_changed","ideaId":"{}"}}"#, idea_id),
        created_at: Utc::now(),
    };

    let peers = get_active_peers().read().await;
    for tm in teammates {
        if let Some(peer_tx) = peers.get(&tm.user_id) {
            let _ = peer_tx.send(event_msg.clone());
        }
    }
}

