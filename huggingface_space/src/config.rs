use dotenvy::dotenv;
use std::env;

#[derive(Clone)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub port: u16,
}

impl Config {
    pub fn from_env() -> Self {
        dotenv().ok();
        
        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgres://localhost/invesa".to_string());
        
        let jwt_secret = env::var("JWT_SECRET")
            .unwrap_or_else(|_| "invesa_secret_super_key_12345_secure_key".to_string());
            
        let port = env::var("PORT")
            .unwrap_or_else(|_| "7860".to_string())
            .parse::<u16>()
            .unwrap_or(7860);

        Self {
            database_url,
            jwt_secret,
            port,
        }
    }
}
