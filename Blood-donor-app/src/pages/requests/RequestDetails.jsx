import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import "./RequestDetails.css";

function RequestDetails() {

    const { id } = useParams();

    // ==========================================
    // STATES
    // ==========================================

    const [bloodRequest, setBloodRequest] = useState(null);

    const [matchingDonors, setMatchingDonors] = useState([]);

    const [loading, setLoading] = useState(true);

    const [matchingLoading, setMatchingLoading] = useState(false);

    const [error, setError] = useState("");

    const [notifyingDonorId, setNotifyingDonorId] = useState(null);

    const [notificationMessage, setNotificationMessage] = useState("");

    const [helpLoading, setHelpLoading] = useState(false);

    const [helpMessage, setHelpMessage] = useState("");

    // ==========================================
    // EMERGENCY PRIORITY
    // ==========================================

    const [priorityData, setPriorityData] = useState(null);

    const [priorityLoading, setPriorityLoading] = useState(false);

    // ==========================================
    // LOGGED-IN USER
    // ==========================================

    const [loggedInUser, setLoggedInUser] = useState(null);

    const [isDonor, setIsDonor] = useState(false);

    const [userLoading, setUserLoading] = useState(true);

    // ==========================================
    // EXPLANATION EXPANSION
    // ==========================================

    const [expandedDonorId, setExpandedDonorId] = useState(null);


    // ==========================================
    // LOAD PAGE
    // ==========================================

    useEffect(() => {

        loadPageData();

    }, [id]);


    // ==========================================
    // LOAD REQUEST + USER + PRIORITY
    // ==========================================

    const loadPageData = async () => {

        try {

            setLoading(true);

            setUserLoading(true);

            setPriorityLoading(true);

            setError("");

            // ======================================
            // GET LOGGED-IN USER
            // ======================================

            const storedUser =
                localStorage.getItem("bloodDonorUser");

            if (storedUser) {

                const user = JSON.parse(storedUser);

                setLoggedInUser(user);

                // ==================================
                // CHECK DONOR PROFILE
                // ==================================

                try {

                    const donorResponse =
                        await api.get(
                            `/donors/user/${user.id}`
                        );

                    if (donorResponse.data) {

                        setIsDonor(true);

                    }

                } catch (donorError) {

                    if (
                        donorError.response?.status === 404
                    ) {

                        setIsDonor(false);

                    } else {

                        console.error(
                            "Error checking donor profile:",
                            donorError
                        );

                    }
                }

            } else {

                setLoggedInUser(null);

                setIsDonor(false);

            }


            // ======================================
            // GET BLOOD REQUEST
            // ======================================

            const response =
                await api.get(
                    `/requests/${id}`
                );

            setBloodRequest(response.data);


            // ======================================
            // GET EMERGENCY PRIORITY
            // ======================================

            try {

                const priorityResponse =
                    await api.get(
                        `/requests/${id}/priority`
                    );

                setPriorityData(
                    priorityResponse.data
                );

            } catch (priorityError) {

                console.error(
                    "Error loading emergency priority:",
                    priorityError
                );

                setPriorityData(null);

            }

        } catch (err) {

            console.error(
                "Error loading page:",
                err
            );

            setError(
                "Unable to load blood request details."
            );

        } finally {

            setLoading(false);

            setUserLoading(false);

            setPriorityLoading(false);

        }

    };


    // ==========================================
    // CHECK REQUESTER
    // ==========================================

    const isRequester =
        loggedInUser &&
        bloodRequest &&
        bloodRequest.requester?.id ===
        loggedInUser.id;


    // ==========================================
    // PRIORITY CLASS
    // ==========================================

    const getPriorityClass = () => {

        if (!priorityData?.priorityLevel) {
            return "";
        }

        return priorityData.priorityLevel
            .toLowerCase();

    };


    // ==========================================
    // FIND AI MATCHING DONORS
    // ==========================================

    const findMatchingDonors = async () => {

        if (!bloodRequest) {
            return;
        }

        try {

            setMatchingLoading(true);

            setError("");

            const response =
                await api.post(
                    "/donors/match",
                    bloodRequest
                );

            console.log(
                "AI Matching Results:",
                response.data
            );

            setMatchingDonors(
                response.data
            );

        } catch (err) {

            console.error(
                "Matching error:",
                err
            );

            setError(
                "Unable to find matching donors."
            );

        } finally {

            setMatchingLoading(false);

        }

    };


    // ==========================================
    // TOGGLE EXPLANATION
    // ==========================================

    const toggleExplanation = (donorId) => {

        if (expandedDonorId === donorId) {

            setExpandedDonorId(null);

        } else {

            setExpandedDonorId(donorId);

        }

    };


    // ==========================================
    // NOTIFY DONOR
    // ==========================================

    const notifyDonor = async (match) => {

        try {

            setNotifyingDonorId(
                match.donor.id
            );

            setNotificationMessage("");

            setError("");

            await api.post(

                `/request-responses/recommend/request/${bloodRequest.id}/donor/${match.donor.id}`,

                null,

                {
                    params: {

                        matchScore:
                            match.score,

                        distance:
                            match.distance

                    }
                }

            );

            setNotificationMessage(

                `${match.donor.user?.name || "Donor"} has been notified successfully!`

            );

        } catch (err) {

            console.error(
                "Error notifying donor:",
                err
            );

            setError(

                err.response?.data?.message ||
                "Unable to notify donor."

            );

        } finally {

            setNotifyingDonorId(null);

        }

    };


    // ==========================================
    // DONOR → I CAN HELP
    // ==========================================

    const handleCanHelp = async () => {

        try {

            setHelpLoading(true);

            setHelpMessage("");

            setError("");


            // LOGIN CHECK

            if (!loggedInUser) {

                setError(
                    "Please login before responding to this request."
                );

                return;

            }


            // DONOR CHECK

            if (!isDonor) {

                setError(
                    "Only registered donors can respond to blood requests."
                );

                return;

            }


            // REQUESTER CHECK

            if (isRequester) {

                setError(
                    "You cannot respond to your own blood request."
                );

                return;

            }


            // STATUS CHECK

            if (
                bloodRequest.status !== "PENDING"
            ) {

                setError(
                    "This blood request is no longer accepting responses."
                );

                return;

            }


            // API

            await api.post(

                `/request-responses/request/${bloodRequest.id}/user/${loggedInUser.id}`

            );


            setHelpMessage(

                "Thank you! You have accepted this blood request. ❤️"

            );

        } catch (err) {

            console.error(
                "Error responding to request:",
                err
            );

            setError(

                err.response?.data?.message ||
                "Unable to respond to this blood request."

            );

        } finally {

            setHelpLoading(false);

        }

    };


    // ==========================================
    // LOADING
    // ==========================================

    if (loading || userLoading) {

        return (

            <div className="request-details-loading">

                Loading blood request...

            </div>

        );

    }


    // ==========================================
    // ERROR
    // ==========================================

    if (error && !bloodRequest) {

        return (

            <div className="request-details-error-page">

                <h2>
                    Something went wrong
                </h2>

                <p>
                    {error}
                </p>

                <Link to="/requests">

                    ← Back to Requests

                </Link>

            </div>

        );

    }


    // ==========================================
    // MAIN UI
    // ==========================================

    return (

        <div className="request-details-page">


            {/* ======================================
                HEADER
            ====================================== */}

            <header className="request-details-header">

                <Link
                    to="/requests"
                    className="back-to-requests"
                >

                    ← Back to Requests

                </Link>


                <div className="request-details-title">

                    <span className="details-label">

                        BLOOD REQUEST

                    </span>

                    <h1>

                        Blood Requirement Details

                    </h1>

                    <p>

                        View blood request details and
                        intelligent donor recommendations.

                    </p>

                </div>

            </header>


            {/* ======================================
                ERROR
            ====================================== */}

            {error && (

                <div className="details-error">

                    {error}

                </div>

            )}


            {/* ======================================
                SUCCESS
            ====================================== */}

            {notificationMessage && (

                <div className="notification-success">

                    ✅ {notificationMessage}

                </div>

            )}


            {helpMessage && (

                <div className="help-success">

                    ❤️ {helpMessage}

                </div>

            )}


            {/* ======================================
                REQUEST DETAILS
            ====================================== */}

            <section className="request-information-card">


                <div className="request-card-header">

                    <div>

                        <h2>

                            🩸 Blood Request Details

                        </h2>

                        <p>

                            Request ID: #{bloodRequest.id}

                        </p>

                    </div>


                    <span
                        className={`request-status ${
                            bloodRequest.status?.toLowerCase()
                        }`}
                    >

                        {bloodRequest.status}

                    </span>

                </div>


                {/* DETAILS GRID */}

                <div className="request-details-grid">


                    <div className="detail-item">

                        <span>
                            👤 Patient Name
                        </span>

                        <strong>
                            {bloodRequest.patientName}
                        </strong>

                    </div>


                    <div className="detail-item">

                        <span>
                            🩸 Blood Group
                        </span>

                        <strong className="blood-group-value">

                            {bloodRequest.bloodGroup}

                        </strong>

                    </div>


                    <div className="detail-item">

                        <span>
                            🏥 Hospital
                        </span>

                        <strong>

                            {bloodRequest.hospitalName}

                        </strong>

                    </div>


                    <div className="detail-item">

                        <span>
                            📍 Location
                        </span>

                        <strong>

                            {bloodRequest.location}

                        </strong>

                    </div>


                    <div className="detail-item">

                        <span>
                            🩸 Units Required
                        </span>

                        <strong>

                            {bloodRequest.units}

                        </strong>

                    </div>


                    <div className="detail-item">

                        <span>
                            ⚡ Urgency
                        </span>

                        <strong
                            className={`urgency ${
                                bloodRequest.urgency?.toLowerCase()
                            }`}
                        >

                            {bloodRequest.urgency}

                        </strong>

                    </div>


                    <div className="detail-item">

                        <span>
                            📅 Required Date
                        </span>

                        <strong>

                            {bloodRequest.requiredDate}

                        </strong>

                    </div>


                    <div className="detail-item">

                        <span>
                            📋 Description
                        </span>

                        <strong>

                            {bloodRequest.description ||
                                "No additional information"}

                        </strong>

                    </div>


                </div>


                {/* ======================================
                    DONOR ACTION
                ====================================== */}

                {isDonor && !isRequester && (

                    <div className="donor-help-section">

                        <div>

                            <h3>

                                Can You Help Save a Life?

                            </h3>

                            <p>

                                If you are available and eligible,
                                you can respond to this blood request.

                            </p>

                        </div>


                        <button
                            className="can-help-button"

                            onClick={handleCanHelp}

                            disabled={
                                helpLoading ||
                                bloodRequest.status !== "PENDING"
                            }
                        >

                            {helpLoading
                                ? "Responding..."
                                : "❤️ I Can Help"}

                        </button>

                    </div>

                )}

            </section>


            {/* ======================================
                EMERGENCY INTELLIGENCE
            ====================================== */}

            {priorityLoading && (

                <section className="emergency-priority-loading">

                    <div className="priority-loading-icon">

                        🤖

                    </div>

                    <div>

                        <strong>

                            Calculating emergency priority...

                        </strong>

                        <p>

                            Analyzing urgency, required date,
                            and blood unit requirements.

                        </p>

                    </div>

                </section>

            )}


            {priorityData && !priorityLoading && (

                <section
                    className={`emergency-priority-card ${getPriorityClass()}`}
                >

                    <div className="priority-header">

                        <div>

                            <span className="priority-label">

                                🚨 EMERGENCY INTELLIGENCE

                            </span>

                            <h2>

                                Emergency Priority Assessment

                            </h2>

                            <p>

                                System-generated priority based on
                                the urgency and requirements of this request.

                            </p>

                        </div>


                        <div className="priority-level">

                            {priorityData.priorityLevel}

                        </div>

                    </div>


                    <div className="priority-content">

                        <div className="priority-score">

                            <span>

                                Priority Score

                            </span>

                            <strong>

                                {priorityData.priorityScore?.toFixed(0)}

                                <small>/100</small>

                            </strong>

                        </div>


                        <div className="priority-reason">

                            <span>

                                Why this request received this priority

                            </span>

                            <p>

                                {priorityData.reason}

                            </p>

                        </div>

                    </div>

                </section>

            )}


            {/* ======================================
                AI MATCHING
                REQUESTER ONLY
            ====================================== */}

            {isRequester && (

                <section className="ai-matching-section">


                    {/* AI HEADER */}

                    <div className="ai-section-header">


                        <div>

                            <span className="ai-label">

                                🤖 INTELLIGENT MATCHING SYSTEM

                            </span>


                            <h2>

                                AI Recommended Donors

                            </h2>


                            <p>

                                Donors are ranked using blood
                                compatibility, availability,
                                verification, donation experience,
                                distance, and eligibility.

                            </p>

                        </div>


                        <button
                            className="find-donors-button"

                            onClick={findMatchingDonors}

                            disabled={matchingLoading}
                        >

                            {matchingLoading

                                ? "🤖 Analyzing Donors..."

                                : "🤖 Find Best Donors"

                            }

                        </button>

                    </div>


                    {/* ==================================
                        NO RESULTS
                    ================================== */}

                    {matchingDonors.length === 0 &&
                        !matchingLoading && (

                        <div className="no-matching-results">

                            <div className="ai-icon">

                                🤖

                            </div>


                            <h3>

                                Find Intelligent Matches

                            </h3>


                            <p>

                                Click "Find Best Donors"
                                to analyze and rank
                                available blood donors.

                            </p>

                        </div>

                    )}


                    {/* ==================================
                        MATCHING DONORS
                    ================================== */}

                    {matchingDonors.length > 0 && (

                        <div className="matching-donors-list">


                            {matchingDonors.map(
                                (match, index) => {

                                    const breakdown =
                                        match.scoreBreakdown;

                                    const donorId =
                                        match.donor.id;

                                    const isExpanded =
                                        expandedDonorId === donorId;


                                    return (

                                        <div
                                            className="matching-donor-card"
                                            key={donorId}
                                        >


                                            {/* RANK */}

                                            <div className="donor-rank">

                                                #{index + 1}

                                            </div>


                                            {/* DONOR INFO */}

                                            <div className="matching-donor-info">


                                                <div className="donor-avatar">

                                                    {match.donor.user?.name
                                                        ?.charAt(0)
                                                        ?.toUpperCase()
                                                        || "D"}

                                                </div>


                                                <div>

                                                    <h3>

                                                        {match.donor.user?.name ||
                                                            "Unknown Donor"}

                                                    </h3>


                                                    <p>

                                                        🩸 {match.donor.bloodGroup}

                                                        {" • "}

                                                        📍 {match.donor.location}

                                                    </p>

                                                </div>

                                            </div>


                                            {/* ==================================
                                                SCORE
                                            ================================== */}

                                            <div className="match-score-box">

                                                <span>

                                                    AI MATCH SCORE

                                                </span>

                                                <strong>

                                                    {match.score?.toFixed(0)}%

                                                </strong>

                                            </div>


                                            {/* DISTANCE */}

                                            <div className="match-distance">

                                                <span>

                                                    📍 Distance

                                                </span>

                                                <strong>

                                                    {match.distance >= 999

                                                        ? "Location unavailable"

                                                        : `${match.distance?.toFixed(2)} KM`

                                                    }

                                                </strong>

                                            </div>


                                            {/* ELIGIBILITY */}

                                            <div className="match-eligibility">

                                                {match.eligible ? (

                                                    <span className="eligible">

                                                        ✅ Eligible

                                                    </span>

                                                ) : (

                                                    <span className="not-eligible">

                                                        ❌ Not Eligible

                                                    </span>

                                                )}

                                            </div>


                                            {/* DONATION DAYS */}

                                            <div className="donation-days">

                                                <span>

                                                    Last Donation

                                                </span>

                                                <strong>

                                                    {match.daysSinceLastDonation}

                                                    {" "}days ago

                                                </strong>

                                            </div>


                                            {/* ==================================
                                                WHY THIS DONOR
                                            ================================== */}

                                            {breakdown && (

                                                <div className="explainable-match-section">


                                                    <button
                                                        className="explain-match-button"

                                                        onClick={() =>
                                                            toggleExplanation(
                                                                donorId
                                                            )
                                                        }
                                                    >

                                                        <span>

                                                            🧠 Why this donor?

                                                        </span>

                                                        <span>

                                                            {isExpanded
                                                                ? "▲"
                                                                : "▼"}

                                                        </span>

                                                    </button>


                                                    {isExpanded && (

                                                        <div className="match-breakdown">


                                                            <div className="breakdown-header">

                                                                <div>

                                                                    <span>

                                                                        EXPLAINABLE AI

                                                                    </span>

                                                                    <h4>

                                                                        Match Score Breakdown

                                                                    </h4>

                                                                </div>


                                                                <strong>

                                                                    {breakdown.totalScore?.toFixed(0)}
                                                                    /100

                                                                </strong>

                                                            </div>


                                                            {/* BLOOD */}

                                                            <ScoreRow
                                                                icon="🩸"
                                                                label="Blood Compatibility"
                                                                score={breakdown.compatibilityScore}
                                                                max={40}
                                                            />


                                                            {/* AVAILABILITY */}

                                                            <ScoreRow
                                                                icon="🟢"
                                                                label="Availability"
                                                                score={breakdown.availabilityScore}
                                                                max={10}
                                                            />


                                                            {/* VERIFICATION */}

                                                            <ScoreRow
                                                                icon="✅"
                                                                label="Verification"
                                                                score={breakdown.verificationScore}
                                                                max={10}
                                                            />


                                                            {/* EXPERIENCE */}

                                                            <ScoreRow
                                                                icon="🏆"
                                                                label="Donation Experience"
                                                                score={breakdown.experienceScore}
                                                                max={10}
                                                            />


                                                            {/* DISTANCE */}

                                                            <ScoreRow
                                                                icon="📍"
                                                                label="Location / Distance"
                                                                score={breakdown.distanceScore}
                                                                max={15}
                                                            />


                                                            {/* ELIGIBILITY */}

                                                            <ScoreRow
                                                                icon="🩺"
                                                                label="Donation Eligibility"
                                                                score={breakdown.eligibilityScore}
                                                                max={15}
                                                            />


                                                            <div className="breakdown-total">

                                                                <span>

                                                                    AI MATCH SCORE

                                                                </span>

                                                                <strong>

                                                                    {breakdown.totalScore?.toFixed(0)}
                                                                    /100

                                                                </strong>

                                                            </div>

                                                        </div>

                                                    )}

                                                </div>

                                            )}


                                            {/* NOTIFY */}

                                            <button
                                                className="notify-donor-button"

                                                onClick={() =>
                                                    notifyDonor(match)
                                                }

                                                disabled={
                                                    notifyingDonorId ===
                                                    donorId
                                                }
                                            >

                                                {notifyingDonorId ===
                                                    donorId

                                                    ? "Sending..."

                                                    : "🚨 Notify Donor"

                                                }

                                            </button>


                                        </div>

                                    );

                                }

                            )}

                        </div>

                    )}

                </section>

            )}

        </div>

    );

}


// ==========================================
// SCORE ROW COMPONENT
// ==========================================

function ScoreRow({
    icon,
    label,
    score,
    max
}) {

    const safeScore =
        Number(score || 0);

    const safeMax =
        Number(max || 1);

    const percentage =
        Math.min(
            100,
            Math.max(
                0,
                (safeScore / safeMax) * 100
            )
        );


    return (

        <div className="score-breakdown-row">

            <div className="score-row-top">

                <span className="score-row-label">

                    {icon} {label}

                </span>

                <strong>

                    {safeScore.toFixed(0)}/{safeMax}

                </strong>

            </div>


            <div className="score-progress">

                <div
                    className="score-progress-fill"

                    style={{
                        width: `${percentage}%`
                    }}
                />

            </div>

        </div>

    );

}


export default RequestDetails;