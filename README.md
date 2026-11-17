# 🩸 SmartBlood — AI-Powered Blood Donor Finder & Emergency Coordination System

A full-stack, 3-tier intelligent healthcare platform designed to connect patients and hospitals with verified blood donors in real time using **Explainable AI Matching**, **Machine Learning Response Prediction**, **Automated Emergency Escalation**, and **GPS Radius Search**.

> 🚀 Hardened Production Architecture built with **React 19 (Vite)**, **Spring Boot 3/4 (Spring Security + JWT + Refresh Tokens)**, **Python FastAPI (Scikit-Learn ML)**, **MySQL 8.0**, and **Nginx Reverse Proxy**.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Client Tier"]
        Browser["React 19 + Vite Frontend\n(Port: 5173 / HTTPS)"]
    end

    subgraph ReverseProxy["Edge / Reverse Proxy Tier"]
        Nginx["Nginx Reverse Proxy & TLS Termination\n(Port 80 -> 443 HTTPS)\nHSTS, CSP, X-Frame-Options, Rate Limiting"]
    end

    subgraph AppTier["Application Tier"]
        Backend["Spring Boot 3/4 Backend\n(Port: 8080)\nSpring Security + JWT (15 min) + Refresh Cookie (7 days)\nRateLimiter (Login: 5/min, Reg: 3/min, Search: 30/min)\nEmergency Escalation Engine"]
        ML["FastAPI Machine Learning Service\n(Port: 8000)\nCalibrated Random Forest + SHA-256 Model Integrity\nStrict Origin Restriction + Hidden /monitoring (404)"]
    end

    subgraph DataTier["Data Tier"]
        MySQL[("MySQL 8.0 Database\n(blood_donor)\nOptimized Indexes on blood_group, location, available\nrefresh_tokens & users tables")]
    end

    Browser -->|HTTPS / WSS| Nginx
    Nginx -->|/api/ REST + HttpOnly Cookie| Backend
    Nginx -->|SPA Static Assets| Browser
    Backend -->|Internal REST JSON (No Browser CORS)| ML
    Backend -->|Spring Data JPA / HikariCP| MySQL
```

---

## 🔒 Security Hardening & Architecture Audit

The SmartBlood application has undergone a comprehensive full-stack security audit and hardening addressing all 17 prioritized controls:

| # | Security Control | Description & Implementation Details | Status |
| :-: | :--- | :--- | :-: |
| **1** | **JWT Fail-Fast Secret** | `SecurityConfig.validateJwtSecret()` enforces minimum 32-character secret length at startup via `@PostConstruct`. Application fails loudly if secret is empty or absent. | ✅ Resolved |
| **2** | **CORS Wildcard Elimination** | Removed dangerous `*` wildcard origin patterns. Explicit allowed origins read from `cors.allowed-origins` property. `AllowCredentials(true)` restricted strictly to whitelisted domains. | ✅ Resolved |
| **3** | **ML Service CORS Restriction** | FastAPI ML service restricts origins via `ML_ALLOWED_ORIGINS` (default `http://localhost:8080`), disallows wildcards, and enforces `allow_credentials=False` for server-to-server calls. | ✅ Resolved |
| **4** | **Short-Lived Access + Refresh Token** | JWT access tokens shortened to **15 minutes**. Database-backed `refresh_tokens` entity with 7-day expiration, `SameSite=Strict`, `HttpOnly` cookie delivery, and `/api/auth/refresh` rotation. | ✅ Resolved |
| **5** | **Backend Input Validation** | Jakarta Validation (`@Valid`, `@NotBlank`, `@Email`, `@Size`, `@Pattern`) added across DTOs and entities. Custom `@ValidBloodGroup` constraint validator and global `@RestControllerAdvice` error handler. | ✅ Resolved |
| **6** | **Auth Rate Limiting** | Thread-safe in-memory token bucket `RateLimitFilter` configured for 5 req/min on `/api/auth/login`, 3 req/min on registration, and 30 req/min on search. Emits HTTP 429 with `Retry-After: 60`. | ✅ Resolved |
| **7** | **Database Indexes & Migration** | High-performance indexes added for `blood_group`, `location`, `available`, `last_donation_date`, composite `(blood_group, location, available)`, `(latitude, longitude)`, and `refresh_tokens(token)`. `schema.sql` provided. | ✅ Resolved |
| **8** | **Donor Verification & OTP Flow** | Added `emailVerified` boolean flag on users with OTP verification endpoints (`/api/auth/send-verification-otp` and `/api/auth/verify-otp`). Donor search is restricted until verified. | ✅ Resolved |
| **9** | **Secure Token Storage** | Frontend access tokens maintained in memory with transparent session restoration via HttpOnly refresh cookie on application mount. Interceptor strictly restricts token transmission to verified backend origins. | ✅ Resolved |
| **10** | **Environment Variable Hygiene** | All sensitive credentials externalized into `.env.example` templates; root `.gitignore` excludes all `.env` files. Frontend uses `import.meta.env.VITE_API_BASE_URL` with fallback. | ✅ Resolved |
| **11** | **Emergency UX & Quick Action Bar** | High-contrast emergency request button above the fold on `Home.jsx`, prominent 24/7 helpline banner card with one-tap `tel:` links, and persistent bottom action bar on mobile viewports. | ✅ Resolved |
| **12** | **ML Model SHA-256 Integrity** | `smartblood-ml/models/model.sha256` generated. ML loader verifies SHA-256 hash before loading; on mismatch logs `[ML_INTEGRITY_MISMATCH]` and falls back gracefully to rule-based scoring without crashing. | ✅ Resolved |
| **13** | **Secure ML Monitoring Endpoint** | `/monitoring` returns HTTP 404 (Not Found) when `SMARTBLOOD_MONITORING_TOKEN` is unset in the environment, obscuring internal endpoints from unauthorized discovery. | ✅ Resolved |
| **14** | **Production TLS Reverse Proxy** | `deploy/nginx.conf` configured with TLS 1.2/1.3, automatic HTTP-to-HTTPS redirect, proxy forwarding headers (`X-Forwarded-For`, `X-Forwarded-Proto`), HSTS, CSP, and `server.forward-headers-strategy=framework`. | ✅ Resolved |
| **15** | **Production Dockerization** | Multi-stage Dockerfiles for Spring Boot (Eclipse Temurin JRE 21), React (Nginx Alpine), and ML (Python Slim). Unified `docker-compose.yml` with healthchecks and `docker-compose.override.yml`. | ✅ Resolved |
| **16** | **Automated Security Test Suite** | Automated test suites in Java (`SecurityHardeningTests`), Python (`test_main.py`), and JavaScript (`api.test.js`) verifying JWT fail-fast, CORS, rate limiting, and URL isolation. | ✅ Resolved |
| **17** | **Security Documentation** | Comprehensive documentation, architecture diagram, security audit checklist, and deployment guides in `README.md`. | ✅ Resolved |

### 📧 Email Case-Insensitive Normalization & Whitespace Trimming
- **Registration (`POST /api/users`):** Emails are automatically stripped of surrounding whitespace and converted to lowercase using `Locale.ROOT` before uniqueness validation and database persistence (`UserService.createUser`).
- **Login (`POST /api/auth/login`):** Login queries normalize input email and perform case-insensitive lookups via `UserRepository.findByEmailIgnoreCase()`, with security warnings logged on bad credentials or unknown accounts.
- **Database Constraint:** MySQL 8.0+ functional index `CREATE UNIQUE INDEX idx_users_email_lower ON users ((LOWER(email)))` prevents duplicate accounts across case variations.
- **Frontend Safeguards:** React `Login.jsx` and `Register.jsx` trim whitespace and lowercase email inputs before dispatching API requests.

---

## 🔑 Environment Variables Reference

### Backend (`Blood-donor-app-backend/demo/.env`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://localhost:3306/blood_donor` | MySQL connection string |
| `DB_USERNAME` | `root` | Database username |
| `DB_PASSWORD` | `your_mysql_password` | Database password |
| `JWT_SECRET` | *Must be >= 32 characters* | HMAC-SHA256 signature secret key |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Comma-separated allowed frontend origins |
| `RATE_LIMIT_LOGIN_PER_MINUTE` | `5` | Maximum login attempts per IP per minute |
| `RATE_LIMIT_REGISTER_PER_MINUTE`| `3` | Maximum user registration requests per minute |
| `RATE_LIMIT_SEARCH_PER_MINUTE` | `30` | Maximum donor search requests per minute |
| `MAIL_ENABLED` | `false` | Enable live SMTP mail delivery (logs OTP to console if false) |
| `SMARTBLOOD_ML_URL` | `http://localhost:8000/predict` | Internal URL for ML service |

### Frontend (`Blood-donor-app/.env`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Spring Boot backend REST endpoint |

### ML Microservice (`smartblood-ml/.env`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `ML_ALLOWED_ORIGINS` | `http://localhost:8080` | Allowed upstream caller origins |
| `SMARTBLOOD_MONITORING_TOKEN` | *(empty)* | Secret key for `/monitoring` access (endpoint returns 404 if unset) |
| `SMARTBLOOD_MODEL_DIR` | `models` | Directory containing serialized `.joblib` models |

---

## 🐳 Docker Compose Quickstart

Run the complete 3-tier SmartBlood stack with a single command:

```bash
# 1. Clone repository
git clone https://github.com/Bala-techdev/Blood-donors-finder-application-.git
cd Blood-donors-finder-application-

# 2. Configure environment credentials
cp Blood-donor-app-backend/demo/.env.example Blood-donor-app-backend/demo/.env
cp Blood-donor-app/.env.example Blood-donor-app/.env

# 3. Launch stack using Docker Compose
docker compose up --build -d

# 4. View running services
docker compose ps
```

Services will be accessible at:
- **Web Application:** `http://localhost:5173`
- **Backend API:** `http://localhost:8080/swagger-ui/index.html`
- **ML Service Health:** `http://localhost:8000/health`
- **Reverse Proxy:** `http://localhost:80` (redirects to HTTPS on `:443`)

---

## 🧪 Verification & Security Test Suite

Run the automated verification tests for each tier:

### 1. Backend Security Controls (JUnit 5)
```bash
cd Blood-donor-app-backend/demo
./mvnw test -Dtest=SecurityHardeningTests
```
*Verifies JWT fail-fast startup, CORS origin rejection, rate limiting (HTTP 429), blood group validation, and refresh token lifecycle.*

### 2. Machine Learning Security & Fallback (Python Unittest)
```bash
cd smartblood-ml
venv/bin/python test_main.py
```
*Verifies SHA-256 model integrity validation, `[ML_INTEGRITY_MISMATCH]` rule-based fallback, and `/monitoring` 404/401/200 authorization behavior.*

### 3. Frontend Interceptor Domain Isolation (Node Test Runner)
```bash
cd Blood-donor-app
npm test
```
*Verifies that Bearer access tokens are never leaked to external third-party origins (e.g. OpenStreetMap / Google Maps).*

---

## 👨‍💻 Developers

- **Bala S**
- **Aadesh R S**
- **Arrshan J S**
- **Adith K**
- **Dharshan K**

*Department of Computer Science & Engineering*
