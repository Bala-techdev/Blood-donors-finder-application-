import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./DonorRecommendations.css";

function DonorRecommendations() {
    const navigate = useNavigate();

    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [respondingId, setRespondingId] = useState(null);

    // ==========================================
    // GET LOGGED-IN USER
    // ==========================================

    const getUser = () => {
        try {
            const userStr =
                localStorage.getItem("bloodDonorUser");

            return userStr
                ? JSON.parse(userStr)
                : null;

        } catch (e) {
            console.error(
                "Error reading user from localStorage:",
                e
            );

            return null;
        }
    };

    // ==========================================
    // LOAD AI RECOMMENDATIONS
    // ==========================================

    const loadRecommendations = useCallback(async () => {

        try {

            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("bloodDonorToken");

            const loggedInUser = getUser();

            // ------------------------------------------
            // CHECK LOGIN
            // ------------------------------------------

            if (!token || !loggedInUser) {

                setError(
                    "Please login to view your recommendations."
                );

                setLoading(false);

                return;
            }

            // ------------------------------------------
            // GET MY DONOR PROFILE
            // ------------------------------------------
            // IMPORTANT:
            // Do NOT send user ID from frontend.
            // Backend gets the user from JWT.
            // ------------------------------------------

            const donorResponse =
                await api.get("/donors/me");

            const donor =
                donorResponse.data;

            if (!donor?.id) {

                setError(
                    "Donor profile not found. Please create your donor profile first."
                );

                return;
            }

            // ------------------------------------------
            // GET RECOMMENDATIONS FOR DONOR
            // ------------------------------------------

            const response =
                await api.get(
                    `/request-responses/donor/${donor.id}`
                );

            // ------------------------------------------
            // FILTER PENDING RECOMMENDATIONS
            // ------------------------------------------

            const pendingRecommendations =
                (response.data || []).filter(
                    (item) =>
                        item?.response === "PENDING" &&
                        item?.bloodRequest?.status === "PENDING"
                );

            setRecommendations(
                pendingRecommendations
            );

        } catch (err) {

            console.error(
                "Recommendation error:",
                err
            );

            if (err.response?.status === 401) {

                setError(
                    "Your session has expired. Please login again."
                );

            } else if (err.response?.status === 404) {

                setError(
                    "Donor profile not found. Please create your donor profile first."
                );

            } else {

                setError(
                    err.response?.data?.message ||
                    "Unable to load donor recommendations."
                );
            }

        } finally {

            setLoading(false);
        }

    }, []);

    // ==========================================
    // LOAD ON PAGE OPEN
    // ==========================================

    useEffect(() => {
        loadRecommendations();
    }, [loadRecommendations]);

    // ==========================================
    // DONOR ACCEPTS REQUEST
    // ==========================================

   const handleAccept = async (recommendation) => {

    const loggedInUser = getUser();

    if (!loggedInUser) {
        alert("User session expired. Please log in again.");
        navigate("/login");
        return;
    }

    try {
        setRespondingId(recommendation.id);

        // Secure response endpoint.
        // User ID is NOT sent from the frontend.
        // Backend identifies the logged-in user from JWT.
        await api.post(
            `/request-responses/request/${recommendation.bloodRequest.id}/respond`
        );

        setRecommendations(
            (prev) =>
                prev.filter(
                    (item) =>
                        item.id !== recommendation.id
                )
        );

        alert(
            "Thank you! Your response has been sent successfully. ❤️"
        );

    } catch (err) {
        console.error("Response error:", err);

        if (err.response?.status === 401) {
            alert("Your session has expired. Please login again.");
            navigate("/login");
        } else {
            alert(
                err.response?.data?.message ||
                "Unable to respond to this request."
            );
        }

    } finally {
        setRespondingId(null);
    }
};

    // ==========================================
    // LOADING STATE
    // ==========================================

    if (loading) {

        return (
            <div className="donor-recommendations-state">
                🤖 Loading your AI recommendations...
            </div>
        );
    }

    // ==========================================
    // PAGE
    // ==========================================

    return (
        <div className="donor-recommendations-page">

            {/* ==========================================
                HEADER
            ========================================== */}

            <header className="donor-recommendations-header">

                <Link
                    to="/dashboard"
                    className="recommendations-back"
                >
                    ← Dashboard
                </Link>

                <div className="recommendations-title">

                    <span>
                        🤖 AI DONOR MATCHING
                    </span>

                    <h1>
                        Your Recommended Requests
                    </h1>

                    <p>
                        Our intelligent system has
                        identified blood requests where
                        your donation could help save a life.
                    </p>

                </div>

            </header>

            {/* ==========================================
                ERROR
            ========================================== */}

            {error && (
                <div className="recommendations-error">
                    {error}
                </div>
            )}

            {/* ==========================================
                MAIN
            ========================================== */}

            <main className="donor-recommendations-main">

                {/* ==========================================
                    EMPTY STATE
                ========================================== */}

                {!error &&
                    recommendations.length === 0 && (
                        <div className="recommendations-empty">

                            <div>
                                🩸
                            </div>

                            <h2>
                                No Active Recommendations
                            </h2>

                            <p>
                                You currently don't have
                                any AI-recommended blood
                                requests.
                            </p>

                        </div>
                    )}

                {/* ==========================================
                    RECOMMENDATIONS
                ========================================== */}

                {recommendations.length > 0 && (

                    <div className="recommendations-list">

                        {recommendations.map(
                            (recommendation) => (

                                <div
                                    className="recommendation-card"
                                    key={recommendation.id}
                                >

                                    {/* ==========================================
                                        AI MATCH LABEL
                                    ========================================== */}

                                    <div className="recommendation-rank">
                                        🤖 AI MATCH
                                    </div>

                                    {/* ==========================================
                                        BLOOD GROUP
                                    ========================================== */}

                                    <div className="recommendation-blood-group">

                                        🩸{" "}

                                        <strong>
                                            {
                                                recommendation
                                                    .bloodRequest
                                                    ?.bloodGroup ||
                                                "N/A"
                                            }
                                        </strong>

                                    </div>

                                    {/* ==========================================
                                        REQUEST INFORMATION
                                    ========================================== */}

                                    <div className="recommendation-info">

                                        <h2>
                                            Blood Donation Request
                                        </h2>

                                        <p>
                                            👤 Patient:{" "}
                                            {
                                                recommendation
                                                    .bloodRequest
                                                    ?.patientName ||
                                                "N/A"
                                            }
                                        </p>

                                        <p>
                                            🏥{" "}
                                            {
                                                recommendation
                                                    .bloodRequest
                                                    ?.hospitalName ||
                                                "N/A"
                                            }
                                        </p>

                                        <p>
                                            📍{" "}
                                            {
                                                recommendation
                                                    .bloodRequest
                                                    ?.location ||
                                                "Location unavailable"
                                            }
                                        </p>

                                        {
                                            recommendation
                                                .bloodRequest
                                                ?.urgency && (

                                                <p>
                                                    🚨 Urgency:{" "}

                                                    <strong>
                                                        {
                                                            recommendation
                                                                .bloodRequest
                                                                .urgency
                                                        }
                                                    </strong>
                                                </p>
                                            )
                                        }

                                    </div>

                                    {/* ==========================================
                                        MATCH DATA
                                    ========================================== */}

                                    <div className="recommendation-match-data">

                                        {/* SMARTBLOOD SCORE */}

                                        <div className="match-score-box">

                                            <span>
                                                🧠 SMARTBLOOD SCORE
                                            </span>

                                            <strong>

                                                {
                                                    recommendation
                                                        .matchScore != null
                                                        ? recommendation
                                                            .matchScore
                                                            .toFixed(1)
                                                        : "N/A"
                                                }

                                                {
                                                    recommendation
                                                        .matchScore != null &&
                                                    "/100"
                                                }

                                            </strong>

                                        </div>

                                        {/* AI PROBABILITY */}

                                        <div className="ai-probability-box">

                                            <span>
                                                🤖 AI RESPONSE PROBABILITY
                                            </span>

                                            <strong>

                                                {
                                                    recommendation
                                                        .responseProbability != null
                                                        ? recommendation
                                                            .responseProbability
                                                            .toFixed(1)
                                                        : "N/A"
                                                }

                                                {
                                                    recommendation
                                                        .responseProbability != null &&
                                                    "%"
                                                }

                                            </strong>

                                        </div>

                                        {/* DISTANCE */}

                                        <div className="distance-box">

                                            <span>
                                                📍 DISTANCE
                                            </span>

                                            <strong>

                                                {
                                                    recommendation
                                                        .distance != null
                                                        ? recommendation
                                                            .distance
                                                            .toFixed(2)
                                                        : "N/A"
                                                }

                                                {
                                                    recommendation
                                                        .distance != null &&
                                                    " KM"
                                                }

                                            </strong>

                                        </div>

                                    </div>

                                    {/* ==========================================
                                        AI EXPLANATION
                                    ========================================== */}

                                    <div className="ai-explanation">

                                        <span>
                                            ✨
                                        </span>

                                        <p>
                                            SmartBlood combines
                                            donor compatibility,
                                            availability,
                                            eligibility, distance,
                                            reliability and
                                            AI-based response
                                            prediction to generate
                                            this recommendation.
                                        </p>

                                    </div>

                                    {/* ==========================================
                                        ACTIONS
                                    ========================================== */}

                                    <div className="recommendation-actions">

                                        <button
                                            className="view-request-button"
                                            onClick={() =>
                                                navigate(
                                                    `/requests/${recommendation.bloodRequest?.id}`
                                                )
                                            }
                                        >
                                            View Details
                                        </button>

                                        <button
                                            className="accept-request-button"
                                            onClick={() =>
                                                handleAccept(
                                                    recommendation
                                                )
                                            }
                                            disabled={
                                                respondingId ===
                                                recommendation.id
                                            }
                                        >

                                            {
                                                respondingId ===
                                                recommendation.id
                                                    ? "Responding..."
                                                    : "❤️ I Can Help"
                                            }

                                        </button>

                                    </div>

                                </div>
                            )
                        )}

                    </div>
                )}

            </main>

        </div>
    );
}

export default DonorRecommendations;