use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterReq {
    pub name: String,
    pub email: String,
    #[serde(rename = "password_hash")]
    pub password_hash: String, // For simplicity matches client payload
    pub role: String,
    pub bio: Option<String>,
    pub skills: Option<Vec<String>>,
    pub linkedin: Option<Option<String>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginReq {
    pub email: String,
    #[serde(rename = "password_hash")]
    pub password_hash: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthRes {
    pub token: String,
    pub user: PublicUser,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateIdeaReq {
    pub title: String,
    pub summary: String,
    pub description: String,
    pub category: String,
    pub stage: String,
    pub team_slots: Vec<String>,
    pub ip_hash: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JoinRequestReq {
    pub message: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InvestorInterestReq {
    pub note: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JoinRequestStatusReq {
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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePostReq {
    pub post_type: String,
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

