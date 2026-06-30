use axum::{
    extract::FromRequestParts,
    http::request::Parts,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::errors::AppError;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,
    pub role: String,
    pub exp: u64,
}

#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: Uuid,
    pub role: String,
}

impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        // Retrieve Auth header
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .ok_or_else(|| AppError::Unauthorized("Missing Authorization header".to_string()))?;

        if !auth_header.starts_with("Bearer ") {
            return Err(AppError::Unauthorized("Invalid Authorization header format".to_string()));
        }

        let token = &auth_header[7..];

        // Decode JWT
        let jwt_secret = std::env::var("JWT_SECRET")
            .unwrap_or_else(|_| "invesa_secret_super_key_12345_secure_key".to_string());

        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(jwt_secret.as_bytes()),
            &Validation::default(),
        )
        .map_err(|err| AppError::Unauthorized(format!("Invalid token: {}", err)))?;

        Ok(AuthUser {
            id: token_data.claims.sub,
            role: token_data.claims.role,
        })
    }
}

// ----------------------------------------
// IP-BASED RATE LIMITING MIDDLEWARE
// ----------------------------------------

use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use std::time::{Instant, Duration};
use std::net::{IpAddr, SocketAddr};
use axum::{
    extract::{ConnectInfo, Request},
    middleware::Next,
    response::{IntoResponse, Response},
    http::StatusCode,
};

pub struct IpRateLimiter {
    requests: Mutex<HashMap<IpAddr, Vec<Instant>>>,
    max_requests: usize,
    window: Duration,
}

impl IpRateLimiter {
    pub fn new(max_requests: usize, window: Duration) -> Self {
        Self {
            requests: Mutex::new(HashMap::new()),
            max_requests,
            window,
        }
    }

    pub fn check_limit(&self, ip: IpAddr) -> bool {
        let mut map = self.requests.lock().unwrap();
        let now = Instant::now();
        let times = map.entry(ip).or_default();
        
        // Retain only requests within the current window
        times.retain(|&t| now.duration_since(t) < self.window);
        
        if times.len() >= self.max_requests {
            false
        } else {
            times.push(now);
            true
        }
    }
}

static RATE_LIMITER: OnceLock<IpRateLimiter> = OnceLock::new();

pub fn get_rate_limiter() -> &'static IpRateLimiter {
    RATE_LIMITER.get_or_init(|| IpRateLimiter::new(100, Duration::from_secs(60))) // 100 requests per minute
}

pub async fn rate_limit_middleware(
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    req: Request,
    next: Next,
) -> Result<Response, Response> {
    let limiter = get_rate_limiter();
    if !limiter.check_limit(addr.ip()) {
        tracing::warn!("Rate limit exceeded for IP: {}", addr.ip());
        return Err((
            StatusCode::TOO_MANY_REQUESTS,
            "Too many requests. Please try again later.",
        ).into_response());
    }
    Ok(next.run(req).await)
}
