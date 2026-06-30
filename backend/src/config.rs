use dotenvy::dotenv;
use std::env;

#[derive(Clone)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub port: u16,
    pub app_env: String,
    pub frontend_url: String,
    pub max_db_connections: u32,
    pub sentry_dsn: Option<String>,
}

impl Config {
    pub fn from_env() -> Self {
        dotenv().ok();
        
        let app_env = env::var("APP_ENV").unwrap_or_else(|_| "development".to_string());
        let is_prod = app_env == "production";

        let database_url = if is_prod {
            env::var("DATABASE_URL").expect("DATABASE_URL must be set in production environment")
        } else {
            env::var("DATABASE_URL").unwrap_or_else(|_| "postgres://localhost/invesa".to_string())
        };
        
        let jwt_secret = if is_prod {
            let secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set in production environment");
            if secret == "invesa_secret_super_key_12345_secure_key" || secret.len() < 32 {
                panic!("JWT_SECRET must be at least 32 characters long and cannot be the default development key in production environment");
            }
            secret
        } else {
            env::var("JWT_SECRET").unwrap_or_else(|_| "invesa_secret_super_key_12345_secure_key".to_string())
        };
            
        let port = env::var("PORT")
            .unwrap_or_else(|_| "7860".to_string())
            .parse::<u16>()
            .unwrap_or(7860);

        let frontend_url = env::var("FRONTEND_URL")
            .unwrap_or_else(|_| "http://localhost:5173".to_string());

        let max_db_connections = env::var("MAX_DB_CONNECTIONS")
            .unwrap_or_else(|_| "20".to_string())
            .parse::<u32>()
            .unwrap_or(20);

        let sentry_dsn = env::var("SENTRY_DSN").ok();

        Self {
            database_url,
            jwt_secret,
            port,
            app_env,
            frontend_url,
            max_db_connections,
            sentry_dsn,
        }
    }
}
