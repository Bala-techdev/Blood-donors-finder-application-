import { Link } from "react-router-dom";
import "./DonorCard.css";

function DonorCard({
    donor,
    smartMatch = false
}) {

    const donorName =
        donor.user?.name ||
        donor.name ||
        "Blood Donor";

    return (

        <div className="donor-card">

            {/* =========================
                TOP
            ========================= */}

            <div className="donor-card-top">

                <div className="donor-avatar">

                    {donorName
                        .charAt(0)
                        .toUpperCase()}

                </div>


                <div className="donor-main-info">

                    <h3>
                        {donorName}
                    </h3>

                    <p>
                        📍{" "}
                        {donor.location ||
                            "Location unavailable"}
                    </p>

                </div>


                {donor.available && (

                    <span className="available-badge">
                        Available
                    </span>

                )}

            </div>


            {/* =========================
                SMARTBLOOD SCORE
            ========================= */}

            {smartMatch && (

                <div className="smart-score-section">

                    <div className="smart-score-label">

                        <span>
                            🧠 SmartBlood Score
                        </span>

                        <strong>

                            {donor.matchScore != null
                                ? Number(
                                    donor.matchScore
                                ).toFixed(1)
                                : "N/A"}

                            {donor.matchScore != null &&
                                "/100"}

                        </strong>

                    </div>


                    <div className="score-bar">

                        <div
                            className="score-progress"
                            style={{
                                width: `${Math.min(
                                    100,
                                    Math.max(
                                        0,
                                        Number(
                                            donor.matchScore
                                        ) || 0
                                    )
                                )}%`
                            }}
                        />

                    </div>

                </div>

            )}


            {/* =========================
                AI RESPONSE PROBABILITY
            ========================= */}

            {smartMatch &&
                donor.responseProbability != null && (

                <div className="ai-response-section">

                    <div className="ai-response-header">

                        <span>
                            🤖 AI Response Probability
                        </span>

                        <strong>

                            {Number(
                                donor.responseProbability
                            ).toFixed(1)}

                            %

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
                                        Number(
                                            donor.responseProbability
                                        ) || 0
                                    )
                                )}%`
                            }}
                        />

                    </div>


                    <small>
                        Estimated likelihood of donor response
                    </small>

                </div>

            )}


            {/* =========================
                DETAILS
            ========================= */}

            <div className="donor-details">

                <div className="donor-detail">

                    <span className="detail-label">
                        Blood Group
                    </span>

                    <strong className="blood-group-badge">

                        {donor.bloodGroup}

                    </strong>

                </div>


                <div className="donor-detail">

                    <span className="detail-label">
                        Donations
                    </span>

                    <strong>

                        {donor.totalDonations || 0}

                    </strong>

                </div>


                <div className="donor-detail">

                    <span className="detail-label">
                        Verified
                    </span>

                    <strong className="verified-text">

                        {donor.verified
                            ? "✓ Verified"
                            : "Pending"
                        }

                    </strong>

                </div>

            </div>


            {/* =========================
                SMART MATCH DETAILS
            ========================= */}

            {smartMatch && (

                <div className="smart-match-details">

                    {/* DISTANCE */}

                    <div className="match-detail">

                        <span>
                            📏
                        </span>

                        <div>

                            <small>
                                Distance
                            </small>

                            <strong>

                                {donor.distance != null
                                    ? Number(
                                        donor.distance
                                    ).toFixed(2)
                                    : "—"
                                } km

                            </strong>

                        </div>

                    </div>


                    {/* STATUS */}

                    <div className="match-detail">

                        <span>

                            {donor.available
                                ? "🟢"
                                : "🔴"
                            }

                        </span>

                        <div>

                            <small>
                                Status
                            </small>

                            <strong>

                                {donor.available
                                    ? "Available"
                                    : "Unavailable"
                                }

                            </strong>

                        </div>

                    </div>

                </div>

            )}


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


                {smartMatch ? (

                    <Link
                        to="/requests/create"
                        className="request-donor-btn"
                    >
                        I Can Help
                    </Link>

                ) : (

                    <Link
                        to="/requests/create"
                        className="request-donor-btn"
                    >
                        Request Blood
                    </Link>

                )}

            </div>

        </div>

    );
}

export default DonorCard;