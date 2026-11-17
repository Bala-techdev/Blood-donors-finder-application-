-- ========================================================
-- SmartBlood Database Schema & Index Migration Script
-- Production-ready DDL for MySQL 8.0+
-- ========================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_otp VARCHAR(6) NULL,
    otp_expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Case-insensitive unique email index (MySQL 8.0+ functional index)
CREATE UNIQUE INDEX idx_users_email_lower ON users ((LOWER(email)));

-- 2. Refresh Tokens Table (Item 4 & Item 7)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(128) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_refresh_token_token (token),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Donor Profiles Table with Optimized Search Indexes (Item 7)
CREATE TABLE IF NOT EXISTS donor_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    blood_group VARCHAR(10) NOT NULL,
    gender VARCHAR(20) NULL,
    date_of_birth DATE NULL,
    location VARCHAR(255) NOT NULL,
    latitude DOUBLE NULL,
    longitude DOUBLE NULL,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    last_donation_date DATE NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    total_donations INT NOT NULL DEFAULT 0,
    -- Fast single-column lookups
    INDEX idx_donor_blood_group (blood_group),
    INDEX idx_donor_location (location),
    INDEX idx_donor_available (available),
    INDEX idx_donor_last_donation (last_donation_date),
    -- High-throughput composite index for matching queries: (blood_group, location, available)
    INDEX idx_donor_search_composite (blood_group, location, available),
    -- Geospatial B-tree index for bounding-box/radius lookups
    INDEX idx_donor_lat_long (latitude, longitude),
    CONSTRAINT fk_donor_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Blood Requests Table
CREATE TABLE IF NOT EXISTS blood_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    requester_id BIGINT NOT NULL,
    patient_name VARCHAR(100) NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    units INT NOT NULL,
    hospital_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DOUBLE NULL,
    longitude DOUBLE NULL,
    urgency VARCHAR(20) NOT NULL,
    required_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fulfilled_at TIMESTAMP NULL,
    INDEX idx_request_status_date (status, required_date),
    INDEX idx_request_blood_group (blood_group),
    INDEX idx_request_location (location),
    CONSTRAINT fk_blood_requests_user FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
