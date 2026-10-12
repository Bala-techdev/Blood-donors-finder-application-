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
    const [outreachPlan, setOutreachPlan] = useState(null);
    const [outreachLoading, setOutreachLoading] = useState(false);

    const [loading, setLoading] = useState(true);

    const [matchingLoading, setMatchingLoading] = useState(false);

    const [error, setError] = useState("");

    const [notifyingDonorId, setNotifyingDonorId] = useState(null);

    const [notificationMessage, setNotificationMessage] = useState("");

    const [helpLoading, setHelpLoading] = useState(false);

    const [helpMessage, setHelpMessage] = useState("");
    const [myResponse, setMyResponse] = useState(null);
    const [declineLoading, setDeclineLoading] = useState(false);

    // ==========================================

    // DONATION PROGRESS

    // ==========================================

    const [acceptedDonorCount, setAcceptedDonorCount] =

        useState(0);

    // Contact details are returned only to the owner of this request.
    const [acceptedDonors, setAcceptedDonors] = useState([]);

    const [responseLoading, setResponseLoading] =

        useState(false);

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

    const [reliabilityLoading, setReliabilityLoading] = useState(false);

    // ==========================================

    // LOAD DONATION PROGRESS

    // ==========================================

    const loadDonationProgress = async () => {
        try {
            setResponseLoading(true);
            // The backend verifies that the logged-in user owns this request.
            const response = await api.get(`/request-responses/request/${id}/accepted`);
            const donors = Array.isArray(response.data) ? response.data : [];
            setAcceptedDonors(donors);
            setAcceptedDonorCount(donors.length);
        } catch (err) {
            console.error("Error loading accepted donors:", err);
            setAcceptedDonors([]);
            setAcceptedDonorCount(0);
        } finally {
            setResponseLoading(false);
        }
    };

    const loadMyResponse = async () => {
        try {
            const response = await api.get("/request-responses/me");
            const responses = Array.isArray(response.data)
                ? response.data
                : [];
            const currentResponse = responses.find(
                (item) => String(item.bloodRequest?.id) === String(id)
            );
            setMyResponse(currentResponse || null);
        } catch (err) {
            console.error("Error loading your request response:", err);
            setMyResponse(null);
        }
    };

    const handleDecline = async () => {
        if (!window.confirm("Are you sure you want to decline this request?")) {
            return;
        }

        try {
            setDeclineLoading(true);
            setError("");
            const response = await api.post(
                `/request-responses/request/${id}/decline`
            );
            setMyResponse(response.data);
            setHelpMessage("Your response was marked as declined.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Unable to decline this request."
            );
        } finally {
            setDeclineLoading(false);
        }
    };

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

        // ==========================================
        // GET LOGGED-IN USER
        // ==========================================

        const storedUser = localStorage.getItem("bloodDonorUser");

        let currentUser = null;
        let donorProfileExists = false;

        if (storedUser) {
            try {
                currentUser = JSON.parse(storedUser);
                setLoggedInUser(currentUser);
            } catch (parseError) {
                console.error("Unable to read logged-in user:", parseError);
                setLoggedInUser(null);
            }
        } else {
            setLoggedInUser(null);
        }

        // ==========================================
        // CHECK DONOR PROFILE
        // ==========================================

        if (currentUser) {
            try {
                const donorResponse = await api.get("/donors/me");

                if (donorResponse.data) {
                    donorProfileExists = true;
                }

                setIsDonor(donorProfileExists);
            } catch (donorError) {
                if (donorError.response?.status === 404) {
                    // A user without a donor profile is valid.
                    donorProfileExists = false;
                    setIsDonor(false);
                } else {
                    console.error(
                        "Error checking donor profile:",
                        donorError
                    );

                    setIsDonor(false);
                }
            }
        } else {
            setIsDonor(false);
        }

        // ==========================================
        // GET BLOOD REQUEST
        // ==========================================

        const requestResponse = await api.get(`/requests/${id}`);
        const request = requestResponse.data;

        setBloodRequest(request);

        // ==========================================
        // CHECK REQUEST OWNERSHIP
        // ==========================================

        const requestOwnerId = request?.requester?.id;
        const currentUserId = currentUser?.id;

        const isRequestOwner =
            requestOwnerId != null &&
            currentUserId != null &&
            String(requestOwnerId) === String(currentUserId);

        // ==========================================
        // LOAD DONATION PROGRESS OR MY RESPONSE
        // ==========================================

        if (isRequestOwner) {
            // Only the request owner can view accepted donor details.
            await loadDonationProgress();
            setMyResponse(null);
        } else {
            setAcceptedDonors([]);
            setAcceptedDonorCount(0);

            if (donorProfileExists) {
                // Only users with donor profiles load their responses.
                await loadMyResponse();
            } else {
                setMyResponse(null);
            }
        }

        // ==========================================
        // LOAD EMERGENCY PRIORITY
        // ==========================================

        if (isRequestOwner) {
            try {
                const priorityResponse = await api.get(
                    `/requests/${id}/priority`
                );

                setPriorityData(priorityResponse.data);
            } catch (priorityError) {
                console.error(
                    "Error loading emergency priority:",
                    priorityError.response?.data?.message ||
                        priorityError.message
                );

                setPriorityData(null);
            }
        } else {
            // The backend restricts this endpoint to the request owner.
            setPriorityData(null);
        }
    } catch (err) {
        console.error(
            "Error loading request details:",
            err.response?.data?.message || err.message
        );

        setError(
            err.response?.data?.message ||
                "Unable to load blood request details."
        );

        setBloodRequest(null);
        setAcceptedDonors([]);
        setAcceptedDonorCount(0);
        setMyResponse(null);
        setPriorityData(null);
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
            Boolean(
                loggedInUser &&
                bloodRequest &&
                bloodRequest.requester?.id != null &&
                loggedInUser.id != null &&
                String(bloodRequest.requester.id) ===
                    String(loggedInUser.id)
            );

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
        setOutreachLoading(true);

        setReliabilityLoading(true);

        setError("");

        // ======================================

        // GET AI MATCHING RESULTS

        // ======================================

        const response = await api.post(

            "/donors/match",

            bloodRequest

        );

        const matches = response.data || [];

        // ======================================

        // GET RELIABILITY FOR EACH DONOR

        // ======================================

        const matchesWithReliability =

            await Promise.all(

                matches.map(async (match) => {

                    try {

                        const reliabilityResponse =

                            await api.get(

                                `/request-responses/donor/${match.donor.id}/reliability`

                            );

                        return {

                            ...match,

                            reliability:

                                reliabilityResponse.data

                        };

                    } catch (reliabilityError) {

                        console.error(

                            `Unable to load reliability for donor ${match.donor.id}:`,

                            reliabilityError

                        );

                        return {

                            ...match,

                            reliability: null

                        };

                    }

                })

            );

        try {
            const outreachResponse = await api.get(
                `/outreach/request/${bloodRequest.id}/recommendations`
            );
            setOutreachPlan(outreachResponse.data);
        } catch (outreachError) {
            console.error("Unable to load outreach optimization:", outreachError);
            setOutreachPlan(null);
        }

        console.log(

            "AI Matching + Reliability:",

            matchesWithReliability

        );

        setMatchingDonors(

            matchesWithReliability

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
        setOutreachLoading(false);

        setReliabilityLoading(false);

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

            if (myResponse?.response === "ACCEPTED") {
                setHelpMessage(
                    "You have already accepted this blood request."
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

            const response = await api.post(

                    `/request-responses/request/${bloodRequest.id}/respond`

                );
            setMyResponse(response.data);

            // ======================================

            // REFRESH DONATION PROGRESS

            // ======================================

            if (isRequester) {
                await loadDonationProgress();
            }

            // ======================================

            // REFRESH REQUEST STATUS

            // ======================================

            const updatedRequest =

                await api.get(

                    `/requests/${bloodRequest.id}`

                );

            setBloodRequest(

                updatedRequest.data

            );

            setHelpMessage(

                "Thank you! You have accepted this blood request. ❤️"

            );

        } catch (err) {

            console.error(

                "Error responding to request:",

                err

            );

            const message = err.response?.data?.message || "";
            if (message.toLowerCase().includes("already accepted")) {
                await loadMyResponse();
                setError("");
                setHelpMessage(
                    "You have already accepted this blood request."
                );
            } else {
                setError(
                    message || "Unable to respond to this blood request."
                );
            }

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

            \====================================== */}

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

            \====================================== */}

            {error && (

                <div className="details-error">

                    {error}

                </div>

            )}

            {/* ======================================

                SUCCESS

            \====================================== */}

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

            \====================================== */}

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

                    DONATION PROGRESS

                \====================================== */}

                <div className="donation-progress-section">

                    <div className="donation-progress-header">

                        <div>

                            <span className="progress-label">

                                🩸 DONATION PROGRESS

                            </span>

                            <h3>

                                Donor Acceptance Status

                            </h3>

                        </div>

                        <strong>

                            {acceptedDonorCount} /{" "}

                            {bloodRequest.units || 1}

                        </strong>

                    </div>

                    {/* PROGRESS BAR */}

                    <div className="donation-progress-bar">

                        <div

                            className="donation-progress-fill"

                            style={{

                                width: `${Math.min(

                                    100,

                                    (

                                        acceptedDonorCount /

                                        (bloodRequest.units || 1)

                                    ) * 100

                                )}%`

                            }}

                        />

                    </div>

                    {/* STATUS MESSAGE */}

                    {bloodRequest.status === "FULFILLED" ? (

                        
                            <div className="donation-completed-message">
                                    <span>✓</span>
                                    <div>
                                        <strong>Blood Requirement Fulfilled</strong>
                                        <p>
                                            The blood donation requirement has been confirmed as fulfilled.
                                        </p>
                                    </div>
                                </div>

                     ) : acceptedDonorCount >= (bloodRequest.units || 1) ? (
                            <div className="donation-pending-message">
                                <span>✓</span>
                                <div>
                                    <strong>Enough Donors Have Accepted</strong>
                                    <p>
                                        The required number of donors has accepted.
                                        Coordinate with the donors to confirm the actual donations.
                                    </p>
                                </div>
                            </div>
                        ) : (

                        <div className="donation-pending-message">

                        <span>⏳</span>
                            <div>
                                <strong>
                                    {Math.max(
                                        0,
                                        (bloodRequest.units || 1) - acceptedDonorCount
                                    )}{" "}
                                    more donor
                                    {(bloodRequest.units || 1) - acceptedDonorCount !== 1
                                        ? "s"
                                        : ""}{" "}
                                    needed
                                </strong>
                                <p>
                                    Waiting for additional donors to accept this request.
                                </p>
                            </div>

                        </div>

                    )}

                </div>

                {isRequester && (
                <section className="accepted-donors-section" aria-labelledby="accepted-donors-title">
                    <div className="accepted-donors-header">
                        <div>
                            <span className="progress-label">📞 DONOR CONTACTS</span>
                            <h3 id="accepted-donors-title">Donors Who Accepted</h3>
                            <p>Contact these donors to coordinate with the hospital.</p>
                        </div>
                        <strong>{acceptedDonorCount} accepted</strong>
                    </div>
                    {responseLoading ? (
                        <p role="status">Loading accepted donors...</p>
                    ) : acceptedDonors.length === 0 ? (
                        <div className="accepted-donors-empty"><p>No donors have accepted this request yet.</p></div>
                    ) : (
                        <div className="accepted-donors-list">
                            {acceptedDonors.map((donor) => (
                                <article className="accepted-donor-card" key={donor.responseId ?? donor.donorId}>
                                    <div className="accepted-donor-main">
                                        <div className="donor-avatar">{(donor.name || "D").charAt(0).toUpperCase()}</div>
                                        <div>
                                            <h4>{donor.name || "Blood Donor"}</h4>
                                            <p>🩸 {donor.bloodGroup || "Blood group unavailable"}{donor.location ? ` · 📍 ${donor.location}` : ""}</p>
                                            <span className={`accepted-donor-status ${(donor.response || "accepted").toLowerCase()}`}>✓ {donor.response || "ACCEPTED"}</span>
                                        </div>
                                    </div>
                                    <div className="accepted-donor-details">
                                        {donor.phone ? <a href={`tel:${donor.phone}`}>📞 {donor.phone}</a> : <span>📞 Phone number unavailable</span>}
                                        {donor.email ? <a href={`mailto:${donor.email}`}>✉️ {donor.email}</a> : null}
                                        <span>{donor.verified ? "✓ Verified donor" : "Not verified"}</span>
                                        {donor.respondedAt ? <small>Accepted: {new Date(donor.respondedAt).toLocaleString()}</small> : null}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* ======================================

                    DONOR ACTION

                \====================================== */}

                {isDonor && !isRequester && (

                    <div className="donor-help-section">

                        <div>

                            <h3>

                                Can You Help Save a Life?

                            </h3>

                            <p>
                                {myResponse
                                    ? `Your response: ${myResponse.response}`
                                    : "If you are available and eligible, you can respond to this blood request."}
                            </p>
                        </div>

                        {(!myResponse || myResponse.response === "PENDING")
                            && bloodRequest.status === "PENDING" && (
                            <button
                                className="can-help-button"
                                onClick={handleCanHelp}
                                disabled={helpLoading}
                            >
                                {helpLoading
                                    ? "Responding..."
                                    : "❤️ I Can Help"}
                            </button>
                        )}

                        {myResponse?.response === "PENDING"
                            && bloodRequest.status === "PENDING" && (
                            <button
                                className="can-help-button"
                                onClick={handleDecline}
                                disabled={declineLoading}
                            >
                                {declineLoading
                                    ? "Declining..."
                                    : "Decline Response"}
                            </button>
                        )}
                    </div>

                )}

            </section>

            {/* ======================================

                EMERGENCY INTELLIGENCE

            \====================================== */}

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

            \====================================== */}

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

                    \================================== */}

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

                    \================================== */}

                    {(matchingDonors.length > 0 || outreachPlan) && (

                        <div className="matching-donors-list">

                            {outreachPlan && (
                                <section className="outreach-optimization-panel">
                                    <div className="outreach-optimization-header">
                                        <div>
                                            <h3>Suggested outreach group</h3>
                                            <p>
                                                {outreachLoading
                                                    ? "Calculating group..."
                                                    : `${outreachPlan.recommendedDonorCount} new donor(s) selected for review.`}
                                            </p>
                                        </div>
                                        {outreachPlan.aggregateResponseLikelihood != null && (
                                            <strong>
                                                Estimated chance of at least one response:{" "}
                                                {outreachPlan.aggregateResponseLikelihood.toFixed(1)}%
                                            </strong>
                                        )}
                                    </div>
                                    <ul>
                                        {(outreachPlan.donors || []).map((donor) => (
                                            <li key={donor.donorId}>
                                                <strong>{donor.donorName}</strong>
                                                {" · "}
                                                {donor.distanceKm >= 999
                                                    ? "distance unavailable"
                                                    : `${donor.distanceKm.toFixed(1)} km`}
                                                {" · "}
                                                {donor.responsePredictionAvailable
                                                    ? `${donor.responseProbability.toFixed(1)}% model estimate`
                                                    : "rule-based ranking"}
                                            </li>
                                        ))}
                                    </ul>
                                    <small>
                                        Recommendations are not invitations or confirmed responses.
                                        {outreachPlan.aggregateUsesIndependenceAssumption
                                            ? " The aggregate estimate assumes independent responses and does not predict completed donation."
                                            : " No aggregate model estimate is available."}
                                    </small>
                                </section>
                            )}

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

                                                \#{index + 1}

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

                                            \================================== */}

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

                                            \================================== */}

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

                                                            {/* ==================================

    DONOR RELIABILITY

\================================== */}

{match.reliability && (

    <div className="donor-reliability-section">

        <div className="reliability-header">

            <div>

                <span className="reliability-label">

                    ⭐ DONOR RELIABILITY

                </span>

                <h4>

                    Response Reliability

                </h4>

            </div>

            <div

                className={`reliability-level ${

                    match.reliability.reliabilityLevel

                        ?.toLowerCase()

                }`}

            >

                {match.reliability.reliabilityLevel}

            </div>

        </div>

        {/* SCORE */}

        <div className="reliability-score-container">

            <div>

                <span>

                    Reliability Score

                </span>

                <strong>

                    {match.reliability.reliabilityScore?.toFixed(0)}

                    <small>/100</small>

                </strong>

            </div>

            <div className="reliability-progress">

                <div

                    className="reliability-progress-fill"

                    style={{

                        width: `${

                            Math.min(

                                100,

                                Math.max(

                                    0,

                                    match.reliability.reliabilityScore

                                )

                            )

                        }%`

                    }}

                />

            </div>

        </div>

        {/* STATISTICS */}

        <div className="reliability-stats">

            <div className="reliability-stat">

                <span>

                    Response Rate

                </span>

                <strong>

                    {match.reliability.responseRate?.toFixed(0)}%

                </strong>

            </div>

            <div className="reliability-stat">

                <span>

                    Acceptance Rate

                </span>

                <strong>

                    {match.reliability.acceptanceRate?.toFixed(0)}%

                </strong>

            </div>

            <div className="reliability-stat">

                <span>

                    Accepted

                </span>

                <strong>

                    {match.reliability.acceptedCount}

                </strong>

            </div>

            <div className="reliability-stat">

                <span>

                    Declined

                </span>

                <strong>

                    {match.reliability.declinedCount}

                </strong>

            </div>

            <div className="reliability-stat">

                <span>

                    Total Responses

                </span>

                <strong>

                    {match.reliability.respondedCount}

                </strong>

            </div>

        </div>

        {/* EXPLANATION */}

        <div className="reliability-explanation">

            <span>

                🧠 Why this reliability score?

            </span>

            <p>

                {match.reliability.explanation}

            </p>

        </div>

    </div>

)}

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