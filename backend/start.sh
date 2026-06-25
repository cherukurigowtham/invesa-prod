#!/bin/bash
set -e

echo "🚀 Starting Invesa self-contained environment..."

# Check if DATABASE_URL is already provided (e.g., via Hugging Face Secrets)
if [ -n "$DATABASE_URL" ]; then
    echo "🌐 External database configuration detected. Using external database..."
    export PORT=7860
    # Execute the backend directly
    echo "🛰️ Starting Invesa Axum Web Server..."
    exec ./backend
fi

echo "🗄️ No external DATABASE_URL detected. Initializing local PostgreSQL database..."

# Directory configurations
PGDATA="/tmp/postgres_data"
PGUNIXSOCKETS="/tmp"

# Check if running as root
if [ "$(id -u)" -eq 0 ]; then
    echo "🔑 Running as root. Switching ownership and executing as postgres user..."
    chown -R postgres:postgres "$PGDATA"
    exec su postgres -c "$0"
fi

# 1. Initialize PostgreSQL database cluster if it doesn't exist
if [ ! -d "$PGDATA/base" ]; then
    echo "🗄️ Initializing new PostgreSQL database cluster..."
    initdb -D "$PGDATA" --auth=trust
fi

# 2. Configure PostgreSQL conf
# Clear existing config lines we added to avoid duplicates if restarted
sed -i '/unix_socket_directories/d' "$PGDATA/postgresql.conf" 2>/dev/null || true
sed -i '/listen_addresses/d' "$PGDATA/postgresql.conf" 2>/dev/null || true
echo "unix_socket_directories = '$PGUNIXSOCKETS'" >> "$PGDATA/postgresql.conf"
echo "listen_addresses = '127.0.0.1'" >> "$PGDATA/postgresql.conf"

# 3. Start PostgreSQL using pg_ctl
echo "⚡ Starting PostgreSQL daemon..."
pg_ctl -D "$PGDATA" -l /tmp/postgres.log start

# Wait for database to start
echo "🔍 Waiting for PostgreSQL to be ready..."
until pg_isready -h localhost; do
  sleep 1
done

# 4. Create the 'invesa' database if it doesn't exist
echo "🛠️ Verifying 'invesa' database..."
createdb -h localhost invesa 2>/dev/null || echo "Database invesa already exists or was initialized."

echo "✅ PostgreSQL is online and database is ready!"

# 5. Set run environment
export DATABASE_URL="postgres://127.0.0.1/invesa"
export PORT=7860

# 6. Execute Axum backend
echo "🛰️ Starting Invesa Axum Web Server..."
exec ./backend
