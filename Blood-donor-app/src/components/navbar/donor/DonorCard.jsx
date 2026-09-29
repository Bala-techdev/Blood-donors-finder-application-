import { Link } from "react-router-dom";
import "./DonorCard.css";

function DonorCard({ donor, smartMatch = false }) {

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
                SMART MATCH SCORE
            ========================= */}

            {smartMatch && (

                <div className="smart-score-section">

                    <div className="smart-score-label">

                        <span>
                            Smart Match
                        </span>

                        <strong>
                            {donor.matchScore ?? 0}%
                        </strong>

                    </div>


                    <div className="score-bar">

                        <div
                            className="score-progress"
                            style={{
                                width: `${donor.matchScore ?? 0}%`
                            }}
                        />

                    </div>

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