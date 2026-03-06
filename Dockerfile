FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM golang:1.25-alpine AS backend-build
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /app/bin/invesa ./cmd/api

FROM alpine:3.21
WORKDIR /app
RUN adduser -D -u 10001 appuser
COPY --from=backend-build /app/bin/invesa /app/invesa
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist
ENV PORT=10000
ENV APP_ENV=production
ENV COOKIE_SECURE=true
ENV STATIC_DIR=/app/frontend/dist
EXPOSE 10000
USER appuser
CMD ["/app/invesa"]
