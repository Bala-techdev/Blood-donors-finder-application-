# 🩸 Blood Donor Finder Application

A full-stack web application designed to connect people who need blood with available blood donors based on blood group and location.

The application provides a simple platform where users can register, search for donors, create blood requests, manage their profiles, and respond to blood requirements.

> 🚀 This project is developed as a working prototype/demo using React, Spring Boot, and MySQL.

---

## 🎥 Project Demo

Watch the complete working demo of the Blood Donor Finder Application:

[▶️ Watch Blood Donor Finder Demo]()

## 📌 Project Overview

Finding a suitable blood donor during an emergency can be difficult and time-consuming.

The **Blood Donor Finder Application** provides a centralized platform where users can:

- Register and login
- Search for available blood donors
- Filter donors by blood group and location
- View donor information
- Create blood requests
- View blood requests
- Respond to blood requests
- Manage their profile
- View notifications
- Monitor activities through a dashboard

The application uses a React frontend, Spring Boot backend, and MySQL database.

---

## ✨ Features

### 🔐 User Authentication

- User registration
- User login
- User logout
- User profile management

### 🔍 Find Blood Donors

- Search donors by blood group
- Search donors by location
- Search using both blood group and location
- Display available donors
- View donor details
- Show donor verification status
- Display total donations

### 🩸 Blood Requests

- Create blood requests
- Specify:
  - Patient name
  - Blood group
  - Required units
  - Hospital
  - Location
  - Urgency
  - Required date
  - Description
- View blood requests
- Filter pending requests
- Update request status

### 📊 Dashboard

The dashboard provides:

- Available donor count
- Total blood requests
- Active/pending requests
- Emergency requests
- Recent blood requests
- Quick navigation to major features

### 👤 Donor Profile

Donor profiles contain:

- Blood group
- Gender
- Date of birth
- Location
- Availability
- Last donation date
- Verification status
- Total donations

### 🔔 Notifications

Users can view notifications related to blood donation activities.

---

## 🛠️ Technology Stack

### Frontend

- React.js
- Vite
- JavaScript
- CSS
- React Router
- Axios

### Backend

- Java
- Spring Boot
- Spring Data JPA
- Maven
- REST APIs

### Database

- MySQL

---

## 🏗️ System Architecture

```text
                 ┌─────────────────────┐
                 │       User          │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │   React + Vite      │
                 │     Frontend        │
                 └──────────┬──────────┘
                            │
                         REST API
                            │
                            ▼
                 ┌─────────────────────┐
                 │    Spring Boot      │
                 │      Backend        │
                 └──────────┬──────────┘
                            │
                       Spring Data JPA
                            │
                            ▼
                 ┌─────────────────────┐
                 │       MySQL         │
                 │      Database       │
                 └─────────────────────┘


## 🔗 Main APIs

### Users

```text
POST   /api/users
GET    /api/users
GET    /api/users/{id}
PUT    /api/users/{id}
```

### Donors

```text
POST   /api/donors
GET    /api/donors
GET    /api/donors/{id}
GET    /api/donors/search
```

### Blood Requests

```text
POST   /api/requests
GET    /api/requests
GET    /api/requests/{id}
GET    /api/requests/pending
GET    /api/requests/blood-group/{bloodGroup}
PUT    /api/requests/{id}/status
```

## ⚙️ Setup

### Backend

```bash
cd Blood-donor-app-backend
mvn spring-boot:run
```

Backend:

```text
http://localhost:8080
```

### Frontend

```bash
cd Blood-donor-app
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## 🗄️ Database

Create the MySQL database:

```sql
CREATE DATABASE blood_donor_db;
```

Demo donor and blood request data is available in:

```text
database/demo-data.sql
```

## 🔒 Security

Database credentials are stored using environment variables.

```properties
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
```

Real `.env` files and passwords are excluded from GitHub using `.gitignore`.

## 🎯 Objective

The objective of this project is to provide a simple platform that connects blood donors with people who need blood and makes the donor search and blood request process faster and easier.

## 🚀 Future Enhancements

* GPS-based nearby donor search
* Email/SMS notifications
* OTP verification
* AI-based donor matching
* Real-time notifications
* Admin dashboard
* Mobile application
* Cloud deployment

## 👨‍💻 Developer

**Bala S**

Computer Science & Engineering

---

⭐ Developed as a full-stack educational prototype.

````

After saving:

```bash
git add README.md
git commit -m "Add project README"
git push
````



