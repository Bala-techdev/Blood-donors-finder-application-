import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./DonorRecommendations.css";

function DonorRecommendations() {

    const navigate = useNavigate();

    const [recommendations, setRecommendations] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [respondingId, setRespondingId] =
        useState(null);


    // ==========================================
    // GET LOGGED-IN USER
    // ==========================================

    const loggedInUser = JSON.parse(
        localStorage.getItem("bloodDonorUser")
    );


    // ==========================================
    // LOAD DONOR RECOMMENDATIONS
    // ==========================================

    const loadRecommendations = async () => {

        try {

            setLoading(true);

            setError("");


            if (!loggedInUser?.id) {

                setError(
                    "Please login to view your recommendations."
                );

                return;
            }


            // --------------------------------------
            // GET DONOR PROFILE USING USER ID
            // --------------------------------------

            const donorResponse =
                await api.get(
                    `/donors/user/${loggedInUser.id}`
                );

            const donor =
                donorResponse.data;


            // --------------------------------------
            // GET RECOMMENDATIONS FOR DONOR
            // --------------------------------------

            const response =
                await api.get(
                    `/request-responses/donor/${donor.id}`
                );


            // Only show pending recommendations

            const pendingRecommendations =
                response.data.filter(
                    (item) =>
                        item.response === "PENDING" &&
                        item.bloodRequest?.status === "PENDING"
                );


            setRecommendations(
                pendingRecommendations
            );

        } catch (err) {

            console.error(
                "Recommendation error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load donor recommendations."
            );

        } finally {

            setLoading(false);

        }

    };


    // ==========================================
    // LOAD ON PAGE OPEN
    // ==========================================

    useEffect(() => {

        loadRecommendations();

    }, []);


    // ==========================================
    // DONOR ACCEPTS REQUEST
    // ==========================================

    const handleAccept = async (
        recommendation
    ) => {

        try {

            setRespondingId(
                recommendation.id
            );


            await api.post(
                `/request-responses/request/${recommendation.bloodRequest.id}/user/${loggedInUser.id}`
            );


            // Remove accepted request from UI

            setRecommendations(
                recommendations.filter(
                    (item) =>
                        item.id !== recommendation.id
                )
            );


            alert(
                "Thank you! Your response has been sent successfully. ❤️"
            );

        } catch (err) {

            console.error(
                "Response error:",
                err
            );

            alert(
                err.response?.data?.message ||
                "Unable to respond to this request."
            );

        } finally {

            setRespondingId(null);

        }

    };


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (

            <div className="donor-recommendations-state">

                🤖 Loading your AI recommendations...

            </div>

        );

    }


    // ==========================================
    // MAIN PAGE
    // ==========================================

    return (

        <div className="donor-recommendations-page">


            {/* HEADER */}

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
                        Our intelligent system has identified
                        blood requests where your donation
                        could help save a life.
                    </p>

                </div>

            </header>


            {/* ERROR */}

            {error && (

                <div className="recommendations-error">

                    {error}

                </div>

            )}


            {/* MAIN */}

            <main className="donor-recommendations-main">


                {/* EMPTY */}

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
                            You currently don't have any
                            AI-recommended blood requests.
                        </p>

                    </div>

                )}


                {/* RECOMMENDATION LIST */}

                {recommendations.length > 0 && (

                    <div className="recommendations-list">

                        {recommendations.map(
                            (recommendation, index) => (

                                <div
                                    className="recommendation-card"
                                    key={recommendation.id}
                                >


                                    {/* AI MATCH */}

                                    <div className="recommendation-rank">

                                        🤖 AI MATCH

                                    </div>


                                    {/* BLOOD GROUP */}

                                    <div className="recommendation-blood-group">

                                        🩸

                                        <strong>

                                            {
                                                recommendation
                                                    .bloodRequest
                                                    .bloodGroup
                                            }

                                        </strong>

                                    </div>


                                    {/* REQUEST INFO */}

                                    <div className="recommendation-info">

                                        <h2>

                                            Emergency Blood Request

                                        </h2>

                                        <p>

                                            👤 Patient:

                                            {" "}

                                            {
                                                recommendation
                                                    .bloodRequest
                                                    .patientName
                                            }

                                        </p>

                                        <p>

                                            🏥

                                            {" "}

                                            {
                                                recommendation
                                                    .bloodRequest
                                                    .hospitalName
                                            }

                                        </p>

                                        <p>

                                            📍

                                            {" "}

                                            {
                                                recommendation
                                                    .bloodRequest
                                                    .location
                                            }

                                        </p>

                                    </div>


                                    {/* MATCH DATA */}

                                    <div className="recommendation-match-data">

                                        <div>

                                            <span>
                                                MATCH SCORE
                                            </span>

                                            <strong>

                                                {
                                                    recommendation
                                                        .matchScore
                                                        ?.toFixed(1)
                                                }

                                                %

                                            </strong>

                                        </div>


                                        <div>

                                            <span>
                                                DISTANCE
                                            </span>

                                            <strong>

                                                {
                                                    recommendation
                                                        .distance
                                                        ?.toFixed(2)
                                                }

                                                KM

                                            </strong>

                                        </div>

                                    </div>


                                    {/* ACTION */}

                                    <div className="recommendation-actions">

                                        <button
                                            className="view-request-button"
                                            onClick={() =>
                                                navigate(
                                                    `/requests/${recommendation.bloodRequest.id}`
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