import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar/Navbar";
import "./Home.css";

const HOME_COMPATIBILITY = {
    "A+": { donateTo: "A+, AB+", receiveFrom: "A+, A-, O+, O-" },
    "A-": { donateTo: "A+, A-, AB+, AB-", receiveFrom: "A-, O-" },
    "B+": { donateTo: "B+, AB+", receiveFrom: "B+, B-, O+, O-" },
    "B-": { donateTo: "B+, B-, AB+, AB-", receiveFrom: "B-, O-" },
    "AB+": {
        donateTo: "AB+ Only",
        receiveFrom: "All Blood Groups (Universal Recipient)"
    },
    "AB-": { donateTo: "AB+, AB-", receiveFrom: "AB-, A-, B-, O-" },
    "O+": { donateTo: "O+, A+, B+, AB+", receiveFrom: "O+, O-" },
    "O-": {
        donateTo: "All Blood Groups (Universal Donor)",
        receiveFrom: "O- Only"
    }
};

function Home() {
    const navigate = useNavigate();
    const [selectedGroup, setSelectedGroup] = useState("O-");

    const isLoggedIn = Boolean(localStorage.getItem("bloodDonorToken"));

    return (
        <>
            <Navbar />

            <main className="home">
                {/* ================= HERO ================= */}
                <section className="hero-section">
                    <div className="hero-container">
                        <div className="hero-left">
                            <div className="hero-badge">
                                🤖 AI-POWERED BLOOD DONATION & EMERGENCY NETWORK
                            </div>

                            <h1>
                                Find Blood Donors.
                                <br />
                                <span>Save Lives Faster.</span>
                            </h1>

                            <p className="hero-description">
                                SmartBlood connects hospitals and patients with verified nearby blood donors using real-time AI reliability scoring, automated emergency escalation, and GPS matching.
                            </p>

                            <div className="hero-buttons">
                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={() => navigate("/donors")}
                                >
                                    Find Blood Donors →
                                </button>

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                        navigate(
                                            isLoggedIn
                                                ? "/requests/create"
                                                : "/register"
                                        )
                                    }
                                >
                                    {isLoggedIn
                                        ? "🩸 Request Blood Urgently"
                                        : "Become a Donor"}
                                </button>
                            </div>

                            <div className="hero-trust">
                                <div>
                                    <span>✓</span>
                                    AI Donor Ranking
                                </div>

                                <div>
                                    <span>✓</span>
                                    Auto-Escalation Triage
                                </div>

                                <div>
                                    <span>✓</span>
                                    24/7 Emergency Support
                                </div>
                            </div>
                        </div>

                        <div className="hero-right">
                            <div className="blood-illustration">
                                <div className="blood-circle">🩸</div>

                                <div className="heart-icon">♥</div>

                                <div className="floating-card card-one">
                                    🤖
                                    <div>
                                        <strong>SmartBlood ML v1.1</strong>
                                        <small>Real-time donor reliability</small>
                                    </div>
                                </div>

                                <div className="floating-card card-two">
                                    <strong>24/7</strong>
                                    <small>Emergency Triage</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= STATS ================= */}
                <section className="stats-section">
                    <div className="stats-container">
                        <div className="stat-item">
                            <h3>8 Groups</h3>
                            <p>Full Blood Compatibility</p>
                        </div>

                        <div className="stat-item">
                            <h3>AI + GPS</h3>
                            <p>Intelligent Donor Ranking</p>
                        </div>

                        <div className="stat-item">
                            <h3>90-Day</h3>
                            <p>Medical Cooldown Check</p>
                        </div>

                        <div className="stat-item">
                            <h3>24/7</h3>
                            <p>Automated Escalation</p>
                        </div>
                    </div>
                </section>

                {/* ================= HOW IT WORKS ================= */}
                <section className="how-section">
                    <div className="section-heading">
                        <span>HOW SMARTBLOOD WORKS</span>

                        <h2>
                            Save a Life in <span>4 Intelligent Steps</span>
                        </h2>

                        <p>
                            Powered by Spring Boot microservices and FastAPI Machine Learning.
                        </p>
                    </div>

                    <div className="steps-container">
                        <div className="step-card">
                            <div className="step-number">01</div>
                            <div className="step-icon">🚨</div>
                            <h3>Create Request & Triage</h3>
                            <p>
                                Submit a blood request. Our Emergency Priority Engine scores urgency and required units automatically.
                            </p>
                        </div>

                        <div className="step-card">
                            <div className="step-number">02</div>
                            <div className="step-icon">🤖</div>
                            <h3>AI Donor Matching</h3>
                            <p>
                                Our ML model ranks eligible compatible donors by distance, past response rate, and 90-day medical cooldown.
                            </p>
                        </div>

                        <div className="step-card">
                            <div className="step-number">03</div>
                            <div className="step-icon">📲</div>
                            <h3>Smart Outreach & Escalation</h3>
                            <p>
                                Top donors receive instant alerts. Unfulfilled critical requests are automatically escalated.
                            </p>
                        </div>

                        <div className="step-card">
                            <div className="step-number">04</div>
                            <div className="step-icon">❤️</div>
                            <h3>Coordinate & Fulfill</h3>
                            <p>
                                Connect directly with accepted donors via Call or WhatsApp and complete the life-saving donation.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ================= FEATURES ================= */}
                <section className="features-section">
                    <div className="section-heading">
                        <span>KEY PLATFORM CAPABILITIES</span>

                        <h2>
                            Everything You Need to
                            <span> Save Lives</span>
                        </h2>
                    </div>

                    <div className="features-container">
                        <div className="feature-card">
                            <div className="feature-icon">🤖</div>
                            <h3>Explainable AI Matching</h3>
                            <p>
                                Transparent 100-point match breakdown combining blood compatibility, GPS distance, and ML response probability.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🚨</div>
                            <h3>Automated Escalation</h3>
                            <p>
                                Background scheduler monitors critical emergencies and triggers wider donor waves if units remain unfulfilled.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📈</div>
                            <h3>Shortage Risk & Forecasting</h3>
                            <p>
                                Tracks regional blood group demand trends and flags high-risk shortage indicators before crises occur.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🩺</div>
                            <h3>Medical Cooldown Guard</h3>
                            <p>
                                Enforces the 90-day whole-blood recovery period so recently donated members are never over-contacted.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📍</div>
                            <h3>GPS Radius Search</h3>
                            <p>
                                Locate verified donors within 5 km to 50 km of the hospital with 1-click Google Maps integration.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🔒</div>
                            <h3>JWT Security & Privacy</h3>
                            <p>
                                Protected by Spring Security and stateless JWT authentication; phone numbers are shared only on acceptance.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ================= INTERACTIVE BLOOD GROUPS ================= */}
                <section className="blood-groups-section">
                    <div className="section-heading">
                        <span>INTERACTIVE BLOOD GROUPS</span>

                        <h2>
                            Find the Right
                            <span> Blood Match</span>
                        </h2>
                        <p>
                            Click any blood group below to view instant donation compatibility.
                        </p>
                    </div>

                    <div className="blood-groups">
                        {[
                            "A+",
                            "A-",
                            "B+",
                            "B-",
                            "AB+",
                            "AB-",
                            "O+",
                            "O-"
                        ].map((group) => (
                            <div
                                className="blood-group"
                                key={group}
                                onClick={() => setSelectedGroup(group)}
                                style={{
                                    cursor: "pointer",
                                    border:
                                        selectedGroup === group
                                            ? "2px solid #e11d48"
                                            : undefined,
                                    background:
                                        selectedGroup === group
                                            ? "#fff1f2"
                                            : undefined,
                                    transform:
                                        selectedGroup === group
                                            ? "translateY(-4px)"
                                            : undefined
                                }}
                            >
                                🩸
                                <strong>{group}</strong>
                            </div>
                        ))}
                    </div>

                    {selectedGroup && HOME_COMPATIBILITY[selectedGroup] && (
                        <div
                            style={{
                                maxWidth: "680px",
                                margin: "24px auto 0",
                                padding: "18px 24px",
                                background: "#ffffff",
                                borderRadius: "14px",
                                border: "1px solid #fecdd3",
                                boxShadow: "0 8px 24px rgba(225, 29, 72, 0.08)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "16px"
                            }}
                        >
                            <div>
                                <span
                                    style={{
                                        fontSize: "12px",
                                        fontWeight: "800",
                                        color: "#e11d48"
                                    }}
                                >
                                    🩸 SELECTED GROUP: {selectedGroup}
                                </span>
                                <p style={{ margin: "6px 0 4px", fontSize: "14px" }}>
                                    <strong>Can Donate To:</strong>{" "}
                                    {HOME_COMPATIBILITY[selectedGroup].donateTo}
                                </p>
                                <p style={{ margin: 0, fontSize: "14px" }}>
                                    <strong>Can Receive From:</strong>{" "}
                                    {
                                        HOME_COMPATIBILITY[selectedGroup]
                                            .receiveFrom
                                    }
                                </p>
                            </div>

                            <Link
                                to="/donors"
                                style={{
                                    background: "#e11d48",
                                    color: "#ffffff",
                                    padding: "10px 18px",
                                    borderRadius: "8px",
                                    textDecoration: "none",
                                    fontWeight: "700",
                                    fontSize: "14px"
                                }}
                            >
                                Search {selectedGroup} Donors →
                            </Link>
                        </div>
                    )}
                </section>

                {/* ================= CTA ================= */}
                <section className="cta-section">
                    <div className="cta-container">
                        <div>
                            <span>❤️ MAKE A DIFFERENCE</span>

                            <h2>Ready to Save a Life?</h2>

                            <p>
                                Join our intelligent blood donor network and respond when emergencies happen near you.
                            </p>
                        </div>

                        <div className="cta-buttons">
                            <button
                                type="button"
                                className="cta-white-button"
                                onClick={() => navigate("/donors")}
                            >
                                Find Donors
                            </button>

                            <button
                                type="button"
                                className="cta-outline-button"
                                onClick={() =>
                                    navigate(
                                        isLoggedIn ? "/dashboard" : "/register"
                                    )
                                }
                            >
                                {isLoggedIn
                                    ? "Go to Dashboard"
                                    : "Become a Donor"}
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}

export default Home;