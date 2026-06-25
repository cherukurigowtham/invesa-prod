# -----------------------------------------------------------------------------
# Stage 1: Build the Rust backend using SQLx offline metadata
# -----------------------------------------------------------------------------
FROM rust:1.94-slim AS builder

WORKDIR /app

# Install build dependencies (including C compiler build-essential for crates like ring/bcrypt)
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy manifests, src, migrations, and sqlx data
COPY Cargo.toml Cargo.lock ./
COPY src/ ./src/
COPY migrations/ ./migrations/
COPY .sqlx/ ./.sqlx/

# Build release binary using SQLx offline mode
ENV SQLX_OFFLINE=true
RUN cargo build --release

# -----------------------------------------------------------------------------
# Stage 2: Run stage with self-contained PostgreSQL and CA certs
# -----------------------------------------------------------------------------
FROM debian:bookworm-slim

WORKDIR /app

# Prevent services from starting during installation inside the docker build environment
RUN printf '#!/bin/sh\nexit 101' > /usr/sbin/policy-rc.d && \
    chmod +x /usr/sbin/policy-rc.d

# Install PostgreSQL, runtime libraries, and ca-certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql \
    postgresql-client \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Create database directories and grant full permissions to UID 1000
RUN mkdir -p /tmp/postgres_data && \
    chmod 777 /tmp/postgres_data

# Copy built backend binary and migrations from builder
COPY --from=builder /app/target/release/backend ./backend
COPY migrations/ ./migrations/
COPY start.sh ./start.sh

# Ensure execution rights for startup script
RUN chmod +x ./start.sh

# Configure Hugging Face Spaces environment settings
EXPOSE 7860
ENV PORT=7860
ENV PATH="/usr/lib/postgresql/15/bin:/usr/lib/postgresql/16/bin:/usr/lib/postgresql/17/bin:${PATH}"

# Set entrypoint to run PostgreSQL and our Axum backend
CMD ["./start.sh"]
