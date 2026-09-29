import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import "./RequestDetails.css";

function RequestDetails() {

    // ==========================================
    // GET REQUEST ID FROM URL
    // ==========================================

    const { id } = useParams();


    // ==========================================
    // STATES
    // ==========================================

    const [bloodRequest, setBloodRequest] =
        useState(null);

    const [matchingDonors, setMatchingDonors] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [matchingLoading, setMatchingLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [notifyingDonorId, setNotifyingDonorId] =
        useState(null);

    const [notificationMessage, setNotificationMessage] =
        useState("");

    const [helpLoading, setHelpLoading] =
        useState(false);

    const [helpMessage, setHelpMessage] =
        useState("");


    // ==========================================
    // LOGGED-IN USER STATES
    // ==========================================

    const [loggedInUser, setLoggedInUser] =
        useState(null);

    const [isDonor, setIsDonor] =
        useState(false);

    const [userLoading, setUserLoading] =
        useState(true);


    // ==========================================
    // LOAD DATA
    // ==========================================

    useEffect(() => {

        loadPageData();

    }, [id]);


    // ==========================================
    // LOAD REQUEST + CHECK USER
    // ==========================================

    const loadPageData = async () => {

        try {

            setLoading(true);

            setUserLoading(true);

            setError("");


            // ======================================
            // GET LOGGED-IN USER
            // ======================================

            const storedUser =
                localStorage.getItem(
                    "bloodDonorUser"
                );


            if (storedUser) {

                const user =
                    JSON.parse(storedUser);

                setLoggedInUser(user);


                // ==================================
                // CHECK IF USER HAS DONOR PROFILE
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

                    // 404 means user is not a donor

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

            setBloodRequest(
                response.data
            );


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

        }

    };


    // ==========================================
    // CHECK IF LOGGED-IN USER IS REQUESTER
    // ==========================================

    const isRequester =
        loggedInUser &&
        bloodRequest &&
        bloodRequest.requester?.id ===
        loggedInUser.id;


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

            const response = await api.post(
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
    // NOTIFY RECOMMENDED DONOR
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


            // ======================================
            // LOGIN CHECK
            // ======================================

            if (!loggedInUser) {

                setError(
                    "Please login before responding to this request."
                );

                return;

            }


            // ======================================
            // DONOR CHECK
            // ======================================

            if (!isDonor) {

                setError(
                    "Only registered donors can respond to blood requests."
                );

                return;

            }


            // ======================================
            // PREVENT REQUESTER
            // ======================================

            if (isRequester) {

                setError(
                    "You cannot respond to your own blood request."
                );

                return;

            }


            // ======================================
            // CHECK REQUEST STATUS
            // ======================================

            if (
                bloodRequest.status !== "PENDING"
            ) {

                setError(
                    "This blood request is no longer accepting responses."
                );

                return;

            }


            // ======================================
            // CALL BACKEND API
            // ======================================

            await api.post(

                `/request-responses/request/${bloodRequest.id}/user/${loggedInUser.id}`

            );


            // ======================================
            // SUCCESS
            // ======================================

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
                        available donor actions.

                    </p>

                </div>

            </header>


            {/* ======================================
                ERROR MESSAGE
            ====================================== */}

            {error && (

                <div className="details-error">

                    {error}

                </div>

            )}


            {/* ======================================
                NOTIFICATION SUCCESS MESSAGE
            ====================================== */}

            {notificationMessage && (

                <div className="notification-success">

                    ✅ {notificationMessage}

                </div>

            )}


            {/* ======================================
                DONOR HELP SUCCESS MESSAGE
            ====================================== */}

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
                AI MATCHING SECTION
                ONLY REQUESTER CAN SEE
            ====================================== */}

            {isRequester && (

                <section className="ai-matching-section">


                    <div className="ai-section-header">


                        <div>

                            <span className="ai-label">

                                🤖 INTELLIGENT MATCHING SYSTEM

                            </span>


                            <h2>

                                AI Recommended Donors

                            </h2>


                            <p>

                                Our intelligent matching system ranks
                                suitable donors based on compatibility,
                                availability, eligibility, and distance.

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


                    {/* NO RESULTS */}

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


                    {/* MATCHING DONORS */}

                    {matchingDonors.length > 0 && (

                        <div className="matching-donors-list">


                            {matchingDonors.map(
                                (match, index) => (

                                    <div
                                        className="matching-donor-card"

                                        key={match.donor.id}
                                    >


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


                                        {/* MATCH SCORE */}

                                        <div className="match-score-box">

                                            <span>

                                                AI MATCH SCORE

                                            </span>

                                            <strong>

                                                {match.score?.toFixed(1)}%

                                            </strong>

                                        </div>


                                        {/* DISTANCE */}

                                        <div className="match-distance">

                                            <span>

                                                📍 Distance

                                            </span>

                                            <strong>

                                                {match.distance?.toFixed(2)} KM

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
                                                {" "} days ago

                                            </strong>

                                        </div>


                                        {/* NOTIFY DONOR */}

                                        <button
                                            className="notify-donor-button"

                                            onClick={() =>
                                                notifyDonor(match)
                                            }

                                            disabled={
                                                notifyingDonorId ===
                                                match.donor.id
                                            }
                                        >

                                            {notifyingDonorId ===
                                                match.donor.id

                                                ? "Sending..."

                                                : "🚨 Notify Donor"

                                            }

                                        </button>


                                    </div>

                                )

                            )}


                        </div>

                    )}


                </section>

            )}


        </div>

    );

}

export default RequestDetails;