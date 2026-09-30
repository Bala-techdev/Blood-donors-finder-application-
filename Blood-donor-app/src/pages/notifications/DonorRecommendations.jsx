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

    // Fetch user safely inside component
    const getUser = () => {
        try {
            const userStr = localStorage.getItem("bloodDonorUser");
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            console.error("Error reading user from localStorage", e);
            return null;
        }
    };

    const loggedInUser = getUser();

    // Wrapped in useCallback to prevent unneeded re-creations
    const loadRecommendations = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            if (!loggedInUser?.id) {
                setError("Please login to view your recommendations.");
                setLoading(false);
                return;
            }

            // Get donor profile using logged-in user ID
            const donorResponse = await api.get(`/donors/user/${loggedInUser.id}`);
            const donor = donorResponse.data;

            if (!donor?.id) {
                setError("Donor profile not found.");
                return;
            }

            // Get recommendations for donor
            const response = await api.get(`/request-responses/donor/${donor.id}`);

            // Filter pending recommendations safely using optional chaining
            const pendingRecommendations = (response.data || []).filter(
                (item) =>
                    item?.response === "PENDING" &&
                    item?.bloodRequest?.status === "PENDING"
            );

            setRecommendations(pendingRecommendations);
        } catch (err) {
            console.error("Recommendation error:", err);
            setError(
                err.response?.data?.message ||
                "Unable to load donor recommendations."
            );
        } finally {
            setLoading(false);
        }
    }, [loggedInUser?.id]);

    useEffect(() => {
        loadRecommendations();
    }, [loadRecommendations]);

    // Donor accepts request handler
    const handleAccept = async (recommendation) => {
        if (!loggedInUser?.id) {
            alert("User session expired. Please log in again.");
            return;
        }

        try {
            setRespondingId(recommendation.id);

            await api.post(
                `/request-responses/request/${recommendation.bloodRequest.id}/user/${loggedInUser.id}`
            );

            // Remove accepted request safely from state
            setRecommendations((prev) =>
                prev.filter((item) => item.id !== recommendation.id)
            );

            alert("Thank you! Your response has been sent successfully. ❤️");
        } catch (err) {
            console.error("Response error:", err);
            alert(
                err.response?.data?.message ||
                "Unable to respond to this request."
            );
        } finally {
            setRespondingId(null);
        }
    };

    if (loading) {
        return (
            <div className="donor-recommendations-state">
                🤖 Loading your AI recommendations...
            </div>
        );
    }

    return (
        <div className="donor-recommendations-page">
            <header className="donor-recommendations-header">
                <Link to="/dashboard" className="recommendations-back">
                    ← Dashboard
                </Link>

                <div className="recommendations-title">
                    <span>🤖 AI DONOR MATCHING</span>
                    <h1>Your Recommended Requests</h1>
                    <p>
                        Our intelligent system has identified blood requests where your
                        donation could help save a life.
                    </p>
                </div>
            </header>

            {error && (
                <div className="recommendations-error">
                    {error}
                </div>
            )}

            <main className="donor-recommendations-main">
                {!error && recommendations.length === 0 && (
                    <div className="recommendations-empty">
                        <div>🩸</div>
                        <h2>No Active Recommendations</h2>
                        <p>
                            You currently don't have any AI-recommended blood requests.
                        </p>
                    </div>
                )}

                {recommendations.length > 0 && (
                    <div className="recommendations-list">
                        {recommendations.map((recommendation) => (
                            <div
                                className="recommendation-card"
                                key={recommendation.id}
                            >
                                <div className="recommendation-rank">🤖 AI MATCH</div>

                                <div className="recommendation-blood-group">
                                    🩸{" "}
                                    <strong>
                                        {recommendation.bloodRequest?.bloodGroup || "N/A"}
                                    </strong>
                                </div>

                                <div className="recommendation-info">
                                    <h2>Blood Donation Request</h2>
                                    <p>
                                        👤 Patient:{" "}
                                        {recommendation.bloodRequest?.patientName || "N/A"}
                                    </p>
                                    <p>
                                        🏥{" "}
                                        {recommendation.bloodRequest?.hospitalName || "N/A"}
                                    </p>
                                    <p>
                                        📍{" "}
                                        {recommendation.bloodRequest?.location ||
                                            "Location unavailable"}
                                    </p>

                                    {recommendation.bloodRequest?.urgency && (
                                        <p>
                                            🚨 Urgency:{" "}
                                            <strong>
                                                {recommendation.bloodRequest.urgency}
                                            </strong>
                                        </p>
                                    )}
                                </div>

                                <div className="recommendation-match-data">
                                    <div className="match-score-box">
                                        <span>🧠 SMARTBLOOD SCORE</span>
                                        <strong>
                                            {recommendation.matchScore != null
                                                ? recommendation.matchScore.toFixed(1)
                                                : "N/A"}
                                            {recommendation.matchScore != null && "/100"}
                                        </strong>
                                    </div>

                                    <div className="ai-probability-box">
                                        <span>🤖 AI RESPONSE PROBABILITY</span>
                                        <strong>
                                            {recommendation.responseProbability != null
                                                ? recommendation.responseProbability.toFixed(1)
                                                : "N/A"}
                                            {recommendation.responseProbability != null && "%"}
                                        </strong>
                                    </div>

                                    <div className="distance-box">
                                        <span>📍 DISTANCE</span>
                                        <strong>
                                            {recommendation.distance != null
                                                ? recommendation.distance.toFixed(2)
                                                : "N/A"}
                                            {recommendation.distance != null && " KM"}
                                        </strong>
                                    </div>
                                </div>

                                <div className="ai-explanation">
                                    <span>✨</span>
                                    <p>
                                        SmartBlood combines donor compatibility, availability,
                                        eligibility, distance, reliability and AI-based response
                                        prediction to generate this recommendation.
                                    </p>
                                </div>

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
                                        onClick={() => handleAccept(recommendation)}
                                        disabled={respondingId === recommendation.id}
                                    >
                                        {respondingId === recommendation.id
                                            ? "Responding..."
                                            : "❤️ I Can Help"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default DonorRecommendations;