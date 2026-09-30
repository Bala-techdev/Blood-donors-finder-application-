import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./EmergencyDashboard.css";

function EmergencyDashboard() {

    const [requests, setRequests] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // ==========================================
    // LOAD EMERGENCY REQUESTS
    // ==========================================

    const loadEmergencyRequests = async () => {

        try {

            setLoading(true);

            setError("");


            // Get all blood requests

            const response =
                await api.get("/requests");

            const allRequests =
                response.data || [];


            // Get emergency status for every request

            const emergencyData =
                await Promise.all(

                    allRequests.map(
                        async (request) => {

                            try {

                                const statusResponse =
                                    await api.get(
                                        `/emergency/${request.id}/status`
                                    );

                                return {
                                    ...request,
                                    emergency:
                                        statusResponse.data
                                };

                            } catch (err) {

                                console.error(
                                    `Unable to load emergency status for request ${request.id}`,
                                    err
                                );

                                return null;
                            }

                        }
                    )

                );


            // Remove failed requests

            const validRequests =
                emergencyData.filter(
                    (request) =>
                        request !== null
                );


            // Show only emergency/high/critical
            // or escalated requests

            const emergencyRequests =
                validRequests.filter(
                    (request) => {

                        const priority =
                            request.emergency
                                ?.priorityLevel;

                        const escalation =
                            request.emergency
                                ?.escalationStatus;

                        return (
                            priority === "CRITICAL" ||
                            priority === "HIGH" ||
                            escalation === "ESCALATED"
                        );

                    }
                );


            // Critical first

            emergencyRequests.sort(
                (a, b) => {

                    const scoreA =
                        a.emergency
                            ?.priorityScore || 0;

                    const scoreB =
                        b.emergency
                            ?.priorityScore || 0;

                    return scoreB - scoreA;

                }
            );


            setRequests(
                emergencyRequests
            );

        } catch (err) {

            console.error(
                "Emergency dashboard error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load emergency requests."
            );

        } finally {

            setLoading(false);

        }

    };


    // ==========================================
    // LOAD PAGE
    // ==========================================

    useEffect(() => {

        loadEmergencyRequests();

    }, []);


    // ==========================================
    // PRIORITY CLASS
    // ==========================================

    const getPriorityClass =
        (priority) => {

            if (!priority) {
                return "";
            }

            return priority.toLowerCase();

        };


    // ==========================================
    // ESCALATION CLASS
    // ==========================================

    const getEscalationClass =
        (status) => {

            if (!status) {
                return "";
            }

            return status
                .toLowerCase()
                .replace(
                    /_/g,
                    "-"
                );

        };


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (

            <div className="emergency-dashboard-state">

                🚨

                <h2>
                    Loading Emergency Dashboard...
                </h2>

                <p>
                    Analyzing active blood requests.
                </p>

            </div>

        );

    }


    // ==========================================
    // MAIN UI
    // ==========================================

    return (

        <div className="emergency-dashboard-page">


            {/* ======================================
                HEADER
            ====================================== */}

            <header className="emergency-dashboard-header">

                <Link
                    to="/dashboard"
                    className="emergency-back"
                >
                    ← Dashboard
                </Link>


                <div className="emergency-title">

                    <span>
                        🚨 SMARTBLOOD EMERGENCY SYSTEM
                    </span>

                    <h1>
                        Emergency Dashboard
                    </h1>

                    <p>
                        Monitor high-priority blood
                        requests and donor fulfillment.
                    </p>

                </div>


                <button
                    className="refresh-emergency-button"
                    onClick={
                        loadEmergencyRequests
                    }
                >

                    🔄 Refresh

                </button>

            </header>


            {/* ======================================
                ERROR
            ====================================== */}

            {error && (

                <div className="emergency-error">

                    {error}

                </div>

            )}


            {/* ======================================
                SUMMARY
            ====================================== */}

            <section className="emergency-summary">


                <div className="emergency-summary-card">

                    <span>
                        🚨 ACTIVE EMERGENCIES
                    </span>

                    <strong>
                        {requests.length}
                    </strong>

                </div>


                <div className="emergency-summary-card">

                    <span>
                        🔴 CRITICAL / HIGH
                    </span>

                    <strong>

                        {
                            requests.filter(
                                (request) =>
                                    request.emergency
                                        ?.priorityLevel ===
                                    "CRITICAL" ||
                                    request.emergency
                                        ?.priorityLevel ===
                                    "HIGH"
                            ).length
                        }

                    </strong>

                </div>


                <div className="emergency-summary-card">

                    <span>
                        🚨 ESCALATED
                    </span>

                    <strong>

                        {
                            requests.filter(
                                (request) =>
                                    request.emergency
                                        ?.escalationStatus ===
                                    "ESCALATED"
                            ).length
                        }

                    </strong>

                </div>

            </section>


            {/* ======================================
                EMPTY
            ====================================== */}

            {requests.length === 0 && (

                <div className="emergency-empty">

                    <div>
                        ✅
                    </div>

                    <h2>
                        No Active Emergency Requests
                    </h2>

                    <p>
                        There are currently no high-priority
                        or escalated blood requests.
                    </p>

                </div>

            )}


            {/* ======================================
                REQUEST LIST
            ====================================== */}

            {requests.length > 0 && (

                <main className="emergency-request-list">

                    {requests.map(
                        (request) => {

                            const emergency =
                                request.emergency;


                            const requiredUnits =
                                emergency
                                    ?.requiredUnits ||
                                request.units ||
                                1;


                            const acceptedDonors =
                                emergency
                                    ?.acceptedDonors ||
                                0;


                            const remainingUnits =
                                emergency
                                    ?.remainingUnits ||
                                0;


                            const progress =
                                Math.min(
                                    100,
                                    (
                                        acceptedDonors /
                                        requiredUnits
                                    ) * 100
                                );


                            return (

                                <div
                                    className="emergency-request-card"
                                    key={request.id}
                                >


                                    {/* ==================================
                                        CARD HEADER
                                    ================================== */}

                                    <div className="emergency-card-header">

                                        <div>

                                            <span className="request-number">

                                                Request #{request.id}

                                            </span>

                                            <h2>

                                                {request.patientName}

                                            </h2>

                                        </div>


                                        <span
                                            className={`priority-badge ${getPriorityClass(
                                                emergency?.priorityLevel
                                            )}`}
                                        >

                                            {emergency?.priorityLevel}

                                        </span>

                                    </div>


                                    {/* ==================================
                                        REQUEST INFO
                                    ================================== */}

                                    <div className="emergency-request-info">


                                        <div>

                                            <span>
                                                🩸 Blood Group
                                            </span>

                                            <strong>
                                                {request.bloodGroup}
                                            </strong>

                                        </div>


                                        <div>

                                            <span>
                                                🏥 Hospital
                                            </span>

                                            <strong>
                                                {request.hospitalName}
                                            </strong>

                                        </div>


                                        <div>

                                            <span>
                                                ⚡ Urgency
                                            </span>

                                            <strong>
                                                {request.urgency}
                                            </strong>

                                        </div>


                                        <div>

                                            <span>
                                                📅 Required
                                            </span>

                                            <strong>
                                                {request.requiredDate}
                                            </strong>

                                        </div>

                                    </div>


                                    {/* ==================================
                                        PRIORITY
                                    ================================== */}

                                    <div className="priority-score-section">

                                        <div>

                                            <span>
                                                Priority Score
                                            </span>

                                            <strong>

                                                {
                                                    emergency
                                                        ?.priorityScore
                                                        ?.toFixed(0)
                                                }

                                                /100

                                            </strong>

                                        </div>


                                        <p>

                                            {
                                                emergency
                                                    ?.priorityReason
                                            }

                                        </p>

                                    </div>


                                    {/* ==================================
                                        DONATION PROGRESS
                                    ================================== */}

                                    <div className="emergency-progress-section">

                                        <div className="progress-header">

                                            <span>
                                                🩸 Donation Progress
                                            </span>

                                            <strong>

                                                {acceptedDonors} /{" "}
                                                {requiredUnits}

                                            </strong>

                                        </div>


                                        <div className="emergency-progress-bar">

                                            <div
                                                className="emergency-progress-fill"
                                                style={{
                                                    width:
                                                        `${progress}%`
                                                }}
                                            />

                                        </div>


                                        <div className="progress-footer">

                                            <span>

                                                {remainingUnits > 0
                                                    ? `${remainingUnits} unit${
                                                        remainingUnits !== 1
                                                            ? "s"
                                                            : ""
                                                    } remaining`
                                                    : "Requirement fulfilled"
                                                }

                                            </span>

                                            <span>

                                                {Math.round(
                                                    progress
                                                )}%

                                            </span>

                                        </div>

                                    </div>


                                    {/* ==================================
                                        ESCALATION
                                    ================================== */}

                                    <div
                                        className={`escalation-status ${getEscalationClass(
                                            emergency?.escalationStatus
                                        )}`}
                                    >

                                        {emergency
                                            ?.escalationStatus ===
                                            "FULFILLED" ? (

                                            <>
                                                ✓
                                                Blood Requirement
                                                Fulfilled
                                            </>

                                        ) : emergency
                                            ?.escalationStatus ===
                                            "ESCALATED" ? (

                                            <>
                                                🚨
                                                Emergency Escalated
                                            </>

                                        ) : (

                                            <>
                                                ⏳
                                                Normal Monitoring
                                            </>

                                        )}

                                    </div>


                                    {/* ==================================
                                        ACTION
                                    ================================== */}

                                    <div className="emergency-card-action">

                                        <Link
                                            to={`/requests/${request.id}`}
                                            className="view-emergency-request"
                                        >

                                            View Request Details →

                                        </Link>

                                    </div>

                                </div>

                            );

                        }
                    )}

                </main>

            )}

        </div>

    );

}

export default EmergencyDashboard;