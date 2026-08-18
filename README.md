# 🩸 Blood Donor Finder Application

A full-stack web application designed to connect people who need blood with available blood donors based on blood group and location.

The application provides a simple platform where users can register, search for donors, create blood requests, manage their profiles, and respond to blood requirements.

> 🚀 This project is developed as a working prototype/demo using React, Spring Boot, and MySQL.

---

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
