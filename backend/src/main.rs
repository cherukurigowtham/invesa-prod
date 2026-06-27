use axum::{
    routing::{get, post, patch, put, delete},
    Router,
};
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

mod config;
mod errors;
mod middleware;
mod models;
mod routes;

use config::Config;
use routes::*;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Initialize logging
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber)?;

    info!("🚀 Initializing Invesa Secure Backend...");

    // 2. Load Configuration
    let config = Config::from_env();

    // 3. Connect to PostgreSQL Pool
    info!("🗄️ Connecting to PostgreSQL Database...");
    let pool = PgPoolOptions::new()
        .max_connections(config.max_db_connections)
        .connect(&config.database_url)
        .await?;

    // 4. Run database migrations automatically
    info!("🔄 Running database migrations...");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;
    info!("✅ Migrations completed successfully!");

    // 5. Setup CORS Middleware Policy
    let cors = if config.app_env == "production" {
        let origin_val = config.frontend_url.parse::<axum::http::HeaderValue>()
            .expect("FRONTEND_URL must be a valid HeaderValue for CORS origin");
        info!("🔒 CORS restricted to production origin: {}", config.frontend_url);
        CorsLayer::new()
            .allow_origin(origin_val)
            .allow_headers(Any)
            .allow_methods(Any)
    } else {
        info!("🔓 CORS running in development mode (Allow Any origin)");
        CorsLayer::new()
            .allow_origin(Any)
            .allow_headers(Any)
            .allow_methods(Any)
    };

    // 6. Define API Router Layout
    let app = Router::new()
        // Auth API
        .route("/v1/auth/register", post(register))
        .route("/v1/auth/login", post(login))
        .route("/v1/auth/forgot-password", post(forgot_password))
        .route("/v1/auth/reset-password", post(reset_password))
        // Ideas API
        .route("/v1/ideas", get(get_ideas).post(create_idea))
        .route("/v1/ideas/{id}", get(get_idea_by_id))
        .route("/v1/ideas/{id}/posts", get(get_idea_posts).post(create_idea_post))
        // Feed API
        .route("/v1/feed", get(get_feed))
        .route("/v1/posts/{id}/like", post(toggle_post_like))
        // Builder & Investor actions
        .route("/v1/ideas/{id}/join", post(join_request))
        .route("/v1/ideas/{id}/interest", post(express_interest))
        .route("/v1/ideas/{idea_id}/requests/{request_id}", patch(handle_join_request))
        // AI Analysis & Rating API
        .route("/v1/ideas/{id}/analysis", get(get_idea_analysis).post(analyze_idea))
        // Dashboards & Profiles
        .route("/v1/dashboard", get(get_dashboard))
        .route("/v1/profile/{user_id}", get(get_profile))
        // Matchmaker API
        .route("/v1/matchmaker", get(get_matchmaker))
        // Simulations API
        .route("/v1/simulations", get(get_simulations).post(save_simulation))
        .route("/v1/simulations/{id}", delete(delete_simulation))
        .route("/v1/simulations/idea/{idea_id}", get(get_simulation_by_idea))
        // Chat & WebSockets API
        .route("/v1/chat/ws", get(ws_handler))
        .route("/v1/chat/history/{with_user_id}", get(get_chat_history))
        .route("/v1/chat/conversations", get(get_chat_conversations))
        .route("/v1/team-meetings", get(get_team_meetings))
        .route("/v1/ideas/{idea_id}/tasks", get(get_tasks).post(create_task))
        .route("/v1/ideas/{idea_id}/tasks/{task_id}", put(update_task).delete(delete_task))
        .layer(cors)
        .with_state(pool);

    // 7. Bind and Start Axum Listener
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    info!("🛡️  Invesa Core Server ONLINE on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
