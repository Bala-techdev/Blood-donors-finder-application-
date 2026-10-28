# 🩸 SmartBlood — AI-Powered Blood Donor Finder & Emergency Coordination System

A full-stack, 3-tier intelligent healthcare platform designed to connect patients and hospitals with verified blood donors in real time using **Explainable AI Matching**, **Machine Learning Response Prediction**, **Automated Emergency Escalation**, and **GPS Radius Search**.

> 🚀 Built using **React (Vite)**, **Java Spring Boot (Spring Security + JWT)**, **Python FastAPI (Scikit-Learn)**, and **MySQL**.

---

https://drive.google.com/file/d/1etFdjByajSXdenzMpUKvkh_bagkFN7-_/view?usp=drivesdk

## 🎥 Project Demo

Watch the complete working demo of the SmartBlood Application:

[▶️ Watch Blood Donor Finder Demo](https://drive.google.com/file/d/12vplcjqpw1jlRYFuP2fPRAGcQs90oIA6/view?usp=drive_link)
[▶️ Watch Blood Donor Finder Demo](https://drive.google.com/file/d/11hWJO5lZVVmBxpoqPvJAO6q7mByaIrHD/view?usp=drive_link)

[Blood Donor Finder images](https://drive.google.com/drive/folders/18meG4c-26Tfk-0fz1aDDGKFfQCWLrT1y?usp=sharing)

---

## 📌 Project Overview

Traditional blood donor platforms operate as static directories where patients and families must manually call listed phone numbers one by one during critical hospital emergencies—often encountering unavailable or medically ineligible donors.

**SmartBlood** transforms passive donor searching into an active, AI-driven emergency response system where users can:

- **Authenticate Securely:** Role-based registration and stateless JWT login (`USER` / `DONOR`).
- **AI-Powered Donor Matching:** Rank compatible donors using a transparent **100-point Explainable AI score** combined with a calibrated **Random Forest ML classifier (`response-rf-calibrated-v1`)** that predicts donor response likelihood.
- **GPS Radius Search:** Discover nearby available donors within **5 km to 50 km** of the hospital.
- **Emergency Triage & Auto-Escalation:** Automatically score request priority (`/100`), track unit fulfillment progress, and trigger scheduled background escalations for unfulfilled critical requests.
- **Outreach Wave Optimization:** Calculate the mathematical likelihood of at least one positive response from a suggested outreach wave to prevent donor alert fatigue.
- **Proactive Analytics:** Monitor regional **Shortage Risk Indicators**, **Monthly Demand Forecasts**, and live **AI Model Telemetry (F1, ROC-AUC, Latency)** from a unified Command Center.
- **One-Click Multi-Channel Coordination:** Contact accepted or recommended donors via **Direct Call**, **Pre-filled Emergency WhatsApp Alerts**, and **Google Maps Hospital Navigation**.

---

## ✨ Key Features

### 🤖 1. Intelligent Donor Matching & Explainable AI
- **100-Point Multi-Factor Scoring:**
  - 🩸 **Blood Compatibility:** 40 pts
  - 📍 **GPS Location & Distance:** 15 pts
  - 🩺 **90-Day Medical Eligibility:** 15 pts
  - 🟢 **Current Availability:** 10 pts
  - ✅ **Profile Verification:** 10 pts
  - 🏆 **Past Donation Experience:** 10 pts
- **ML Response Probability:** Integrates with the Python FastAPI microservice to predict each donor's likelihood of responding.
- **Donor Reliability Analytics:** Tracks historical response rate, acceptance rate, and reliability tier (`/100`).

### 🚨 2. Emergency Command Center & Automated Escalation
- **Dynamic Priority Scoring (`EmergencyPriorityService`):** Evaluates urgency (`NORMAL`, `URGENT`, `EMERGENCY`), required units, and date proximity.
- **Background Escalation Scheduler (`EmergencyEscalationScheduler`):** Automatically monitors unfulfilled high-priority requests, logs escalation events, and generates **AI Coordinator Recommendations**.
- **Auto-Cleanup (`FulfilledRequestCleanupService`):** Automatically archives completed requests to keep emergency queues clean.

### 📈 3. Demand Forecasting & Shortage Risk Analytics
- **Shortage Risk Engine (`BloodShortageRiskService`):** Flags high-risk regional blood group shortages by comparing unresolved requests against currently eligible compatible donors.
- **Monthly Demand Outlook (`DemandForecastService`):** Projects upcoming blood group demand based on historical request trends.
- **Live ML Telemetry (`MlMonitoringController`):** Displays model availability, request counts, fallback rates, average inference latency (`ms`), and offline holdout metrics (`F1: 0.9912`, `ROC-AUC: 0.9653`).

### 🩺 4. Donor Safety & 90-Day Cooldown Guard
- **Medical Cooldown Enforcement (`DonationEligibilityService`):** Automatically calculates days elapsed since `lastDonationDate` and protects donors within the 90-day whole-blood recovery period.
- **1-Click Availability Toggle:** Donors can pause or activate their availability directly from their profile.
- **Interactive Blood Compatibility Explorer:** Instant donor and recipient compatibility reference across all 8 blood groups (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`).

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React.js, Vite, React Router DOM, Axios (JWT Interceptors), CSS3 |
| **Backend** | Java, Spring Boot, Spring Security, Spring Data JPA (Hibernate), Maven |
| **Security** | Stateless JWT Authentication (`JwtService`), BCrypt Password Encryption |
| **AI / ML Service** | Python, FastAPI, Uvicorn, Scikit-Learn, Pandas, NumPy, Joblib |
| **Database** | MySQL |
| **Testing** | JUnit 5, Mockito (Spring Boot), Pytest (FastAPI ML Service) |

---

## 🏗️ System Architecture

```text
                   ┌──────────────────────────────┐
                   │      User / Hospital         │
                   └──────────────┬───────────────┘
                                  │
                                  ▼
                   ┌──────────────────────────────┐
                   │     React + Vite Frontend    │
                   │      (Port: 5173)            │
                   └──────────────┬───────────────┘
                                  │
                        REST API + JWT Bearer
                                  │
                                  ▼
                   ┌──────────────────────────────┐        REST API (/predict, /monitoring)       ┌──────────────────────────────┐
                   │     Spring Boot Backend      │ ◄───────────────────────────────────────────► │   FastAPI ML Microservice    │
                   │      (Port: 8080)            │   (Graceful Rule-Based Fallback if Offline)   │   smartblood-ml (Port: 8000) │
                   └──────────────┬───────────────┘                                               └──────────────────────────────┘
                                  │
                           Spring Data JPA
                                  │
                                  ▼
                   ┌──────────────────────────────┐
                   │        MySQL Database        │
                   │       (blood_donor_db)       │
                   └──────────────────────────────┘
```

---

## 🔗 Core API Endpoints

### 🔐 Authentication & Users
```text
POST   /api/auth/login                                  - Authenticate user & return JWT
POST   /api/users                                       - Register new user / donor account
GET    /api/users/me                                    - Get logged-in user profile
PUT    /api/users/me                                    - Update personal account info
```

### 🩸 Donors & AI Matching
```text
POST   /api/donors                                      - Create donor profile
GET    /api/donors/me                                   - Get current user's donor profile
PUT    /api/donors/me                                   - Update donor profile & availability
GET    /api/donors/{id}                                 - Get donor profile by ID
GET    /api/donors/search                               - Search donors by blood group & city
GET    /api/donors/nearby                               - GPS radius donor search (lat, lng, radius)
POST   /api/donors/match                                - Run Explainable AI + ML donor matching
GET    /api/eligibility/check/{donorId}                 - Check 90-day medical donation eligibility
```

### 🚨 Blood Requests & Emergency Triage
```text
POST   /api/requests                                    - Create a blood request
GET    /api/requests                                    - List all blood requests
GET    /api/requests/pending                            - List active pending requests
GET    /api/requests/{id}                               - Get blood request details
GET    /api/requests/{id}/priority                      - Get AI emergency priority score (/100)
GET    /api/emergency/{id}/status                       - Get emergency fulfillment & escalation status
GET    /api/emergency/{id}/coordinator                  - Get AI coordinator recommendation
GET    /api/outreach/request/{id}/recommendations       - Get optimized donor outreach wave
```

### 🤝 Donor Responses, Notifications & Analytics
```text
POST   /api/request-responses/request/{id}/respond      - Accept a blood request
POST   /api/request-responses/request/{id}/decline      - Decline a blood request
GET    /api/request-responses/request/{id}/accepted     - List accepted donors (Request Owner only)
GET    /api/request-responses/donor/{id}/reliability    - Get donor response reliability metrics
GET    /api/dashboard/me                                - Get personalized dashboard KPIs
GET    /api/analytics/demand                            - Get monthly blood demand forecast
GET    /api/analytics/shortage-risk                     - Get regional blood shortage risk signals
GET    /api/ml-monitoring                               - Get live ML microservice telemetry
GET    /api/notifications/me/page                       - Get paginated user notifications
PUT    /api/notifications/me/read-all                   - Mark all notifications as read
```

### 🧠 FastAPI ML Microservice (`smartblood-ml` - Port 8000)
```text
GET    /                                                - ML service health check
POST   /predict                                         - Predict donor response probability
GET    /monitoring                                      - Model telemetry & offline evaluation metrics
GET    /response-time/status                            - Timestamp data readiness check
```

---

## ⚙️ Local Setup & Installation

### 1. Database Setup (MySQL)
Create the MySQL database:
```sql
CREATE DATABASE blood_donor_db;
```

### 2. Start the Python ML Microservice (`smartblood-ml`)
```bash
cd smartblood-ml
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
- **ML Swagger UI Docs:** `http://localhost:8000/docs`

### 3. Start the Spring Boot Backend (`Blood-donor-app-backend`)
```bash
cd Blood-donor-app-backend/demo
./mvnw spring-boot:run
```
- **Backend Server:** `http://localhost:8080`

### 4. Start the React Frontend (`Blood-donor-app`)
```bash
cd Blood-donor-app
npm install
npm run dev
```
- **Frontend App:** `http://localhost:5173`

---

## 🧪 Running Automated Tests

### Backend Unit & Controller Tests (JUnit 5 / Mockito)
```bash
cd Blood-donor-app-backend/demo
./mvnw test
```

### ML Service Tests (Pytest)
```bash
cd smartblood-ml
pytest
```

---

## 🔒 Security & Privacy

- **Stateless JWT Authentication:** Protected API routes verified via `JwtService` and `SecurityConfig`.
- **Password Hashing:** BCrypt encryption for all stored credentials.
- **Contact Privacy:** Donor phone numbers and email addresses are hidden from public listings and only shared with the verified owner of an accepted blood request.
- **Environment Variables:** Database credentials and secrets are externalized and excluded via `.gitignore`:
  ```properties
  spring.datasource.url=${DB_URL}
  spring.datasource.username=${DB_USERNAME}
  spring.datasource.password=${DB_PASSWORD}
  ```

---

## 🚀 Future Roadmap (v2.0)

- **Closed-Loop Online ML Retraining:** Automatically feed live donor acceptance/decline timestamps back into the FastAPI training pipeline to transition from synthetic data to real-world ground-truth learning.
- **Twilio SMS & WhatsApp Cloud API Gateway:** Dispatch automated SMS alerts when `EmergencyEscalationScheduler` triggers so offline donors are reached immediately.
- **Hospital Blood Bank Inventory Sync (e-RaktKosh / HL7 FHIR):** Query regional hospital blood bank stock before paging external community donors.
- **Real-Time WebSocket Push Notifications:** Instant browser and mobile push alerts via Spring WebSockets (STOMP).

---

## 👨‍💻 Developers

- **Bala S**
- **Aadesh R S**
- **Arrshan J S**
- **Adith K**
- **Dharshan K**

*Department of Computer Science & Engineering*
