import { useState } from "react";
import { Link } from "react-router-dom";
import "./DonorCard.css";

function DonorCard({ donor, smartMatch = false }) {
    const [showExplainableAi, setShowExplainableAi] = useState(false);

    const donorName =
        donor.user?.name || donor.name || "Blood Donor";

    const phone = donor.phone || donor.user?.phone || "";

    return (
        <div className="donor-card">
            {/* =========================
                TOP
            ========================= */}
            <div className="donor-card-top">
                <div className="donor-avatar">
                    {donorName.charAt(0).toUpperCase()}
                </div>

                <div className="donor-main-info">
                    <h3>{donorName}</h3>
                    <p>📍 {donor.location || "Location unavailable"}</p>
                </div>

                {donor.available ? (
                    <span className="available-badge">Available</span>
                ) : (
                    <span
                        className="available-badge"
                        style={{
                            background: "#fee2e2",
                            color: "#b91c1c"
                        }}
                    >
                        Unavailable
                    </span>
                )}
            </div>

            {/* =========================
                SMARTBLOOD SCORE
            ========================= */}
            {smartMatch && (
                <div className="smart-score-section">
                    <div className="smart-score-label">
                        <span>🧠 SmartBlood Match Score</span>
                        <strong>
                            {donor.matchScore != null
                                ? Number(donor.matchScore).toFixed(1)
                                : "N/A"}
                            {donor.matchScore != null && "/100"}
                        </strong>
                    </div>

                    <div className="score-bar">
                        <div
                            className="score-progress"
                            style={{
                                width: `${Math.min(
                                    100,
                                    Math.max(0, Number(donor.matchScore) || 0)
                                )}%`
                            }}
                        />
                    </div>
                </div>
            )}

            {smartMatch && donor.explanation && (
                <p className="match-explanation">{donor.explanation}</p>
            )}

            {/* =========================
                AI RESPONSE PROBABILITY
            ========================= */}
            {smartMatch && donor.responseProbability != null && (
                <div className="ai-response-section">
                    <div className="ai-response-header">
                        <span>🤖 ML Response Likelihood</span>
                        <strong>
                            {Number(donor.responseProbability).toFixed(1)}%
                        </strong>
                    </div>

                    <div className="ai-response-bar">
                        <div
                            className="ai-response-progress"
                            style={{
                                width: `${Math.min(
                                    100,
                                    Math.max(
                                        0,
                                        Number(donor.responseProbability) || 0
                                    )
                                )}%`
                            }}
                        />
                    </div>

                    <small>
                        {donor.responsePredictionAvailable
                            ? "FastAPI ML model estimate"
                            : "ML offline; rule-based fallback active"}
                    </small>
                </div>
            )}

            {/* =========================
                COLLAPSIBLE EXPLAINABLE AI
            ========================= */}
            {smartMatch &&
                (donor.factualReasons?.length > 0 ||
                    donor.predictionReasons?.length > 0) && (
                    <div style={{ marginTop: "10px" }}>
                        <button
                            type="button"
                            onClick={() =>
                                setShowExplainableAi(!showExplainableAi)
                            }
                            style={{
                                width: "100%",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                padding: "6px 10px",
                                fontSize: "12px",
                                fontWeight: "700",
                                color: "#334155",
                                cursor: "pointer"
                            }}
                        >
                            <span>🧠 Why this donor? (Explainable AI)</span>
                            <span>{showExplainableAi ? "▲" : "▼"}</span>
                        </button>

                        {showExplainableAi && (
                            <div className="match-explanation-details">
                                {donor.factualReasons?.length > 0 && (
                                    <div>
                                        <strong>Measured matching facts</strong>
                                        <ul>
                                            {donor.factualReasons.map(
                                                (reason) => (
                                                    <li key={reason}>
                                                        {reason}
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                )}
                                {donor.predictionReasons?.length > 0 && (
                                    <div>
                                        <strong>Prediction context</strong>
                                        <ul>
                                            {donor.predictionReasons.map(
                                                (reason) => (
                                                    <li key={reason}>
                                                        {reason}
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                )}
                                {donor.ruleBasedScore != null && (
                                    <small>
                                        Ranking combines{" "}
                                        {Number(donor.ruleBasedScore).toFixed(1)}
                                        /100 rule score + ML response weight.
                                    </small>
                                )}
                            </div>
                        )}
                    </div>
                )}

            {/* =========================
                DETAILS
            ========================= */}
            <div className="donor-details">
                <div className="donor-detail">
                    <span className="detail-label">Blood Group</span>
                    <strong className="blood-group-badge">
                        {donor.bloodGroup}
                    </strong>
                </div>

                <div className="donor-detail">
                    <span className="detail-label">Donations</span>
                    <strong>{donor.totalDonations || 0}</strong>
                </div>

                <div className="donor-detail">
                    <span className="detail-label">Verified</span>
                    <strong className="verified-text">
                        {donor.verified ? "✓ Verified" : "Pending"}
                    </strong>
                </div>
            </div>

            {/* =========================
                SMART MATCH DISTANCE & STATUS
            ========================= */}
            {smartMatch && (
                <div className="smart-match-details">
                    <div className="match-detail">
                        <span>📏</span>
                        <div>
                            <small>Distance</small>
                            <strong>
                                {donor.distance != null && donor.distance < 999
                                    ? `${Number(donor.distance).toFixed(2)} km`
                                    : "—"}
                            </strong>
                        </div>
                    </div>

                    <div className="match-detail">
                        <span>{donor.available ? "🟢" : "🔴"}</span>
                        <div>
                            <small>Status</small>
                            <strong>
                                {donor.available ? "Available" : "Unavailable"}
                            </strong>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================
                DIRECT OUTREACH BAR (CALL / WHATSAPP / MAP)
            ========================= */}
            <div
                style={{
                    display: "flex",
                    gap: "6px",
                    marginTop: "12px",
                    paddingTop: "10px",
                    borderTop: "1px dashed #e2e8f0"
                }}
            >
                {phone && (
                    <>
                        <a
                            href={`tel:${phone}`}
                            style={{
                                flex: 1,
                                textAlign: "center",
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                padding: "6px 8px",
                                borderRadius: "6px",
                                textDecoration: "none",
                                fontSize: "12px",
                                fontWeight: "700"
                            }}
                        >
                            📞 Call
                        </a>
                        <a
                            href={`https://wa.me/${phone.replace(
                                /[^0-9]/g,
                                ""
                            )}?text=${encodeURIComponent(
                                `🚨 URGENT BLOOD NEED: Hello ${donorName}, we found your${donor.bloodGroup} donor profile on SmartBlood. Are you available to donate?`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                flex: 1,
                                textAlign: "center",
                                background: "#f0fdf4",
                                color: "#15803d",
                                padding: "6px 8px",
                                borderRadius: "6px",
                                textDecoration: "none",
                                fontSize: "12px",
                                fontWeight: "700"
                            }}
                        >
                            💬 WhatsApp
                        </a>
                    </>
                )}

                {donor.location && (
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            donor.location
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            flex: 1,
                            textAlign: "center",
                            background: "#fff1f2",
                            color: "#be123c",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontSize: "12px",
                            fontWeight: "700"
                        }}
                    >
                        📍 Map
                    </a>
                )}
            </div>

            {/* =========================
                BUTTONS
            ========================= */}
            <div className="donor-card-bottom">
                <Link
                    to={`/donors/${donor.id}`}
                    className="view-profile-btn"
                >
                    View Profile
                </Link>

                <Link
                    to="/requests/create"
                    className="request-donor-btn"
                >
                    {smartMatch ? "🩸 Request Donor" : "Request Blood"}
                </Link>
            </div>
        </div>
    );
}

export default DonorCard;