use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use validator::Validate;

// ----------------------------------------
// Database entity models
// ----------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    #[serde(rename = "password_hash")]
    pub password_hash: String,
    pub role: String, // 'founder', 'builder', 'investor'
    pub bio: Option<String>,
    pub skills: Option<Vec<String>>,
    pub linkedin: Option<String>,
    #[serde(rename = "recovery_key_hash")]
    pub recovery_key_hash: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicUser {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub role: String,
    pub bio: Option<String>,
    pub skills: Option<Vec<String>>,
    pub linkedin: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl From<User> for PublicUser {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            bio: user.bio,
            skills: user.skills,
            linkedin: user.linkedin,
            created_at: user.created_at,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct TeamMember {
    pub id: Uuid,
    pub idea_id: Uuid,
    pub user_id: Uuid,
    pub role_title: String,
    pub joined_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TeamMemberDetail {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub role_title: String,
    pub joined_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct JoinRequest {
    pub id: Uuid,
    pub idea_id: Uuid,
    pub builder_id: Uuid,
    pub message: String,
    pub status: String, // 'pending', 'accepted', 'rejected'
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JoinRequestDetail {
    pub id: Uuid,
    pub idea_id: Uuid,
    pub builder_id: Uuid,
    pub builder_name: String,
    pub builder_skills: Vec<String>,
    pub message: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub idea_title: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct InvestorInterest {
    pub id: Uuid,
    pub idea_id: Uuid,
    pub investor_id: Uuid,
    pub note: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InvestorInterestDetail {
    pub id: Uuid,
    pub idea_id: Uuid,
    pub investor_id: Uuid,
    pub investor_name: String,
    pub note: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Idea {
    pub id: Uuid,
    pub founder_id: Uuid,
    pub title: String,
    pub summary: String,
    pub description: String,
    pub category: String,
    pub stage: String,
    pub team_slots: Vec<String>,
    pub ip_hash: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IdeaDetail {
    pub id: Uuid,
    pub founder_id: Uuid,
    pub founder_name: String,
    pub title: String,
    pub summary: String,
    pub description: String,
    pub category: String,
    pub stage: String,
    pub team_slots: Vec<String>,
    pub ip_hash: String,
    pub created_at: DateTime<Utc>,
    pub team_members: Vec<TeamMemberDetail>,
    pub join_requests: Vec<JoinRequestDetail>,
    pub investor_interests: Vec<InvestorInterestDetail>,
}

// ----------------------------------------
// Request / Response payloads
// ----------------------------------------

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct RegisterReq {
    #[validate(length(min = 2, max = 100, message = "Name must be between 2 and 100 characters"))]
    pub name: String,
    #[validate(email(message = "Invalid email address format"))]
    pub email: String,
    #[serde(rename = "password_hash")]
    #[validate(length(min = 6, max = 256, message = "Password must be at least 6 characters"))]
    pub password_hash: String, // For simplicity matches client payload
    #[validate(length(min = 1, max = 50, message = "Role must be between 1 and 50 characters"))]
    pub role: String,
    #[validate(length(max = 1000, message = "Bio must not exceed 1000 characters"))]
    pub bio: Option<String>,
    pub skills: Option<Vec<String>>,
    pub linkedin: Option<Option<String>>,
    #[serde(rename = "recovery_key_hash")]
    #[validate(length(min = 1, max = 256, message = "Recovery key hash is required"))]
    pub recovery_key_hash: String,
}

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct LoginReq {
    #[validate(email(message = "Invalid email address format"))]
    pub email: String,
    #[serde(rename = "password_hash")]
    #[validate(length(min = 1, max = 256, message = "Password is required"))]
    pub password_hash: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthRes {
    pub token: String,
    pub user: PublicUser,
}

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct CreateIdeaReq {
    #[validate(length(min = 3, max = 200, message = "Title must be between 3 and 200 characters"))]
    pub title: String,
    #[validate(length(min = 10, max = 400, message = "Summary must be between 10 and 400 characters"))]
    pub summary: String,
    #[validate(length(min = 20, max = 10000, message = "Description must be between 20 and 10000 characters"))]
    pub description: String,
    #[validate(length(min = 2, max = 100, message = "Category must be between 2 and 100 characters"))]
    pub category: String,
    #[validate(length(min = 2, max = 50, message = "Stage must be between 2 and 50 characters"))]
    pub stage: String,
    #[validate(length(max = 20, message = "Too many team slots specified (max 20)"))]
    pub team_slots: Vec<String>,
    #[validate(length(min = 64, max = 64, message = "IP hash must be a valid 64-character SHA-256 hash"))]
    pub ip_hash: String,
}

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct JoinRequestReq {
    #[validate(length(min = 10, max = 2000, message = "Message must be between 10 and 2000 characters"))]
    pub message: String,
}

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct InvestorInterestReq {
    #[validate(length(min = 5, max = 2000, message = "Note must be between 5 and 2000 characters"))]
    pub note: String,
}

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct JoinRequestStatusReq {
    #[validate(length(min = 1, max = 20, message = "Status is required"))]
    pub status: String, // 'accepted', 'rejected'
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct IdeaAnalysis {
    pub id: Uuid,
    pub idea_id: Uuid,
    pub overall_score: i32,
    pub market_fit_rating: i32,
    pub viability_rating: i32,
    pub innovation_rating: i32,
    pub strengths: Vec<String>,
    pub weaknesses: Vec<String>,
    pub opportunities: Vec<String>,
    pub threats: Vec<String>,
    pub recommendations: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct IdeaPost {
    pub id: Uuid,
    pub idea_id: Uuid,
    pub idea_title: String,
    pub author_id: Uuid,
    pub author_name: String,
    pub post_type: String,
    pub content: String,
    pub media_url: Option<String>,
    pub likes: i32,
    pub liked_by: Vec<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct CreatePostReq {
    #[validate(length(min = 2, max = 100, message = "Post type must be between 2 and 100 characters"))]
    pub post_type: String,
    #[validate(length(min = 1, max = 5000, message = "Content must be between 1 and 5000 characters"))]
    pub content: String,
    pub media_url: Option<String>
}

// ----------------------------------------
// Interactive Valuation & Dilution Models
// ----------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct SavedSimulation {
    pub id: Uuid,
    pub user_id: Uuid,
    pub idea_id: Option<Uuid>,
    pub title: String,
    pub pre_money_valuation: f64,
    pub raise_amount: f64,
    pub option_pool_percent: f64,
    pub co_founder_percent: f64,
    pub series_a_valuation: f64,
    pub series_a_raise: f64,
    pub series_a_option_pool: f64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSimulationReq {
    pub idea_id: Option<Uuid>,
    pub title: String,
    pub pre_money_valuation: f64,
    pub raise_amount: f64,
    pub option_pool_percent: f64,
    pub co_founder_percent: f64,
    pub series_a_valuation: Option<f64>,
    pub series_a_raise: Option<f64>,
    pub series_a_option_pool: Option<f64>,
}

// ----------------------------------------
// Matchmaking Engine Models
// ----------------------------------------

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BuilderMatch {
    pub builder: PublicUser,
    pub match_score: i32,
    pub matching_skills: Vec<String>,
    pub missing_skills: Vec<String>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IdeaMatch {
    pub idea: Idea,
    pub founder_name: String,
    pub match_score: i32,
    pub matching_skills: Vec<String>,
    pub missing_skills: Vec<String>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MatchmakerRes {
    pub builder_matches: Option<Vec<BuilderMatch>>,
    pub idea_matches: Option<Vec<IdeaMatch>>,
}

// ----------------------------------------
// Chat & WebSockets Models
// ----------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessage {
    pub id: Uuid,
    pub sender_id: Uuid,
    pub receiver_id: Uuid,
    pub message: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Conversation {
    pub user_id: Uuid,
    pub name: String,
    pub role: String,
    pub last_message: Option<String>,
    pub last_message_time: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SendMessagePayload {
    pub receiver_id: Uuid,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TeamMessage {
    pub id: Uuid,
    pub idea_id: Uuid,
    pub sender_id: Uuid,
    pub sender_name: String,
    pub message: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TeamMeetingChannel {
    pub idea_id: Uuid,
    pub idea_title: String,
}

// ----------------------------------------
// Kanban Board Task Models
// ----------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: Uuid,
    pub idea_id: Uuid,
    pub title: String,
    pub description: String,
    pub status: String,
    pub assignee_id: Option<Uuid>,
    pub creator_id: Uuid,
    pub due_date: Option<DateTime<Utc>>,
    pub position: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskReq {
    #[validate(length(min = 1, max = 255, message = "Title must be between 1 and 255 characters"))]
    pub title: String,
    pub description: Option<String>,
    pub status: Option<String>,
    pub assignee_id: Option<Uuid>,
    pub due_date: Option<DateTime<Utc>>,
    pub position: Option<i32>,
}

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTaskReq {
    #[validate(length(min = 1, max = 255, message = "Title must be between 1 and 255 characters"))]
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub assignee_id: Option<Uuid>,
    pub due_date: Option<DateTime<Utc>>,
    pub position: i32,
}


