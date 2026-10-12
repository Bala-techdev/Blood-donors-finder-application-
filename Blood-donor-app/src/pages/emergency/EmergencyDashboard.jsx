import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./EmergencyDashboard.css";

function EmergencyDashboard() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filterMode, setFilterMode] = useState("ALL");

    // ==========================================
    // LOAD EMERGENCY REQUESTS (PARALLELIZED)
    // ==========================================
    const loadEmergencyRequests = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/requests");
            const allRequests = response.data || [];

            const emergencyData = await Promise.all(
                allRequests.map(async (request) => {
                    try {
                        const [statusRes, coordinatorRes] = await Promise.allSettled([
                            api.get(`/emergency/${request.id}/status`),
                            api.get(`/emergency/${request.id}/coordinator`)
                        ]);

                        if (statusRes.status !== "fulfilled") {
                            return null;
                        }

                        return {
                            ...request,
                            emergency: statusRes.value.data,
                            coordinator:
                                coordinatorRes.status === "fulfilled"
                                    ? coordinatorRes.value.data
                                    : null
                        };
                    } catch (err) {
                        console.error(
                            `Unable to load emergency status for request ${request.id}`,
                            err
                        );
                        return null;
                    }
                })
            );

            const validRequests = emergencyData.filter((req) => req !== null);

            const emergencyRequests = validRequests.filter((request) => {
                const priority = request.emergency?.priorityLevel;
                const escalation = request.emergency?.escalationStatus;

                return (
                    priority === "CRITICAL" ||
                    priority === "HIGH" ||
                    escalation === "ESCALATED"
                );
            });

            emergencyRequests.sort((a, b) => {
                const scoreA = a.emergency?.priorityScore || 0;
                const scoreB = b.emergency?.priorityScore || 0;
                return scoreB - scoreA;
            });

            setRequests(emergencyRequests);
        } catch (err) {
            console.error("Emergency dashboard error:", err);
            setError(
                err.response?.data?.message || "Unable to load emergency requests."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmergencyRequests();
    }, []);

    const getPriorityClass = (priority) => {
        if (!priority) return "";
        return priority.toLowerCase();
    };

    const getEscalationClass = (status) => {
        if (!status) return "";
        return status.toLowerCase().replace(/_/g, "-");
    };

    const filteredRequests = requests.filter((req) => {
        if (filterMode === "CRITICAL") {
            return req.emergency?.priorityLevel === "CRITICAL";
        }
        if (filterMode === "ESCALATED") {
            return req.emergency?.escalationStatus === "ESCALATED";
        }
        return true;
    });

    if (loading) {
        return (
            <div className="emergency-dashboard-state">
                🚨
                <h2>Loading Emergency Dashboard...</h2>
                <p>Analyzing active blood requests and AI triage priorities.</p>
            </div>
        );
    }

    return (
        <div className="emergency-dashboard-page">
            {/* ======================================
                HEADER
            ====================================== */}
            <header className="emergency-dashboard-header">
                <Link to="/dashboard" className="emergency-back">
                    ← Dashboard
                </Link>

                <div className="emergency-title">
                    <span>🚨 SMARTBLOOD EMERGENCY SYSTEM</span>
                    <h1>Emergency Triage & Escalation Dashboard</h1>
                    <p>
                        Real-time AI priority scoring, automated escalation tracking, and coordinator recommendations.
                    </p>
                </div>

                <button
                    className="refresh-emergency-button"
                    onClick={loadEmergencyRequests}
                >
                    🔄 Refresh
                </button>
            </header>

            {error && <div className="emergency-error">{error}</div>}

            {/* ======================================
                SUMMARY
            ====================================== */}
            <section className="emergency-summary">
                <div
                    className="emergency-summary-card"
                    onClick={() => setFilterMode("ALL")}
                    style={{
                        cursor: "pointer",
                        outline: filterMode === "ALL" ? "2px solid #dc2626" : "none"
                    }}
                >
                    <span>🚨 ALL ACTIVE EMERGENCIES</span>
                    <strong>{requests.length}</strong>
                </div>

                <div
                    className="emergency-summary-card"
                    onClick={() => setFilterMode("CRITICAL")}
                    style={{
                        cursor: "pointer",
                        outline: filterMode === "CRITICAL" ? "2px solid #dc2626" : "none"
                    }}
                >
                    <span>🔴 CRITICAL / HIGH PRIORITY</span>
                    <strong>
                        {
                            requests.filter(
                                (request) =>
                                    request.emergency?.priorityLevel === "CRITICAL" ||
                                    request.emergency?.priorityLevel === "HIGH"
                            ).length
                        }
                    </strong>
                </div>

                <div
                    className="emergency-summary-card"
                    onClick={() => setFilterMode("ESCALATED")}
                    style={{
                        cursor: "pointer",
                        outline: filterMode === "ESCALATED" ? "2px solid #dc2626" : "none"
                    }}
                >
                    <span>⚡ AUTO-ESCALATED</span>
                    <strong>
                        {
                            requests.filter(
                                (request) =>
                                    request.emergency?.escalationStatus === "ESCALATED"
                            ).length
                        }
                    </strong>
                </div>
            </section>

            {/* ======================================
                EMPTY STATE
            ====================================== */}
            {filteredRequests.length === 0 && (
                <div className="emergency-empty">
                    <div>✅</div>
                    <h2>No Matching Emergency Requests</h2>
                    <p>
                        There are currently no high-priority or escalated blood requests matching this filter.
                    </p>
                    {filterMode !== "ALL" && (
                        <button
                            onClick={() => setFilterMode("ALL")}
                            className="refresh-emergency-button"
                            style={{ marginTop: "12px" }}
                        >
                            Show All Emergencies
                        </button>
                    )}
                </div>
            )}

            {/* ======================================
                REQUEST LIST
            ====================================== */}
            {filteredRequests.length > 0 && (
                <main className="emergency-request-list">
                    {filteredRequests.map((request) => {
                        const emergency = request.emergency;
                        const requiredUnits =
                            emergency?.requiredUnits || request.units || 1;
                        const acceptedDonors = emergency?.acceptedDonors || 0;
                        const remainingUnits = emergency?.remainingUnits ?? Math.max(0, requiredUnits - acceptedDonors);
                        const progress = Math.min(
                            100,
                            (acceptedDonors / requiredUnits) * 100
                        );

                        return (
                            <div className="emergency-request-card" key={request.id}>
                                {/* CARD HEADER */}
                                <div className="emergency-card-header">
                                    <div>
                                        <span className="request-number">
                                            Request #{request.id}
                                        </span>
                                        <h2>{request.patientName}</h2>
                                    </div>

                                    <span
                                        className={`priority-badge ${getPriorityClass(
                                            emergency?.priorityLevel
                                        )}`}
                                    >
                                        {emergency?.priorityLevel}
                                    </span>
                                </div>

                                {/* REQUEST INFO */}
                                <div className="emergency-request-info">
                                    <div>
                                        <span>🩸 Blood Group</span>
                                        <strong>{request.bloodGroup}</strong>
                                    </div>

                                    <div>
                                        <span>🏥 Hospital</span>
                                        <strong>{request.hospitalName}</strong>
                                    </div>

                                    <div>
                                        <span>📍 Location</span>
                                        <strong>{request.location || "N/A"}</strong>
                                    </div>

                                    <div>
                                        <span>📅 Required</span>
                                        <strong>{request.requiredDate}</strong>
                                    </div>
                                </div>

                                {/* PRIORITY SCORE */}
                                <div className="priority-score-section">
                                    <div>
                                        <span>AI Priority Score</span>
                                        <strong>
                                            {emergency?.priorityScore?.toFixed(0)}/100
                                        </strong>
                                    </div>
                                    <p>{emergency?.priorityReason}</p>
                                </div>

                                {/* DONATION PROGRESS */}
                                <div className="emergency-progress-section">
                                    <div className="progress-header">
                                        <span>🩸 Donation Fulfillment Progress</span>
                                        <strong>
                                            {acceptedDonors} / {requiredUnits} units
                                        </strong>
                                    </div>

                                    <div className="emergency-progress-bar">
                                        <div
                                            className="emergency-progress-fill"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    <div className="progress-footer">
                                        <span>
                                            {remainingUnits > 0
                                                ? `${remainingUnits} unit${
                                                      remainingUnits !== 1 ? "s" : ""
                                                  } remaining`
                                                : "Requirement fulfilled"}
                                        </span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                </div>

                                {/* ESCALATION STATUS */}
                                <div
                                    className={`escalation-status ${getEscalationClass(
                                        emergency?.escalationStatus
                                    )}`}
                                >
                                    {emergency?.escalationStatus === "FULFILLED" ? (
                                        <>✓ Blood Requirement Fulfilled</>
                                    ) : emergency?.escalationStatus === "ESCALATED" ? (
                                        <>🚨 Emergency Auto-Escalated</>
                                    ) : (
                                        <>⏳ Normal Active Monitoring</>
                                    )}
                                </div>

                                {/* AI COORDINATOR PANEL */}
                                {request.coordinator && (
                                    <section
                                        className="coordinator-panel"
                                        aria-label={`AI coordinator recommendation for request ${request.id}`}
                                    >
                                        <div className="coordinator-heading">
                                            <strong>🤖 AI Coordinator Recommendation</strong>
                                            <span
                                                className={`coordinator-action ${getEscalationClass(
                                                    request.coordinator.recommendedAction
                                                )}`}
                                            >
                                                {request.coordinator.recommendedAction}
                                            </span>
                                        </div>
                                        <p>{request.coordinator.reasons?.[0]}</p>
                                        <div className="coordinator-evidence">
                                            <span>
                                                ✅ {request.coordinator.eligibleAvailableDonors} eligible matches
                                            </span>
                                            <span>
                                                ⏳ {request.coordinator.outstandingResponses} pending responses
                                            </span>
                                            <span>
                                                🚨 {request.coordinator.recentEscalations} escalation(s)
                                            </span>
                                        </div>
                                        <small>
                                            Review recommendation before taking action.
                                            {request.coordinator.mlPredictionsUsed
                                                ? " (SmartBlood ML predictions active)"
                                                : " (Rule-based heuristic active)"}
                                        </small>
                                    </section>
                                )}

                                {/* ACTION */}
                                <div className="emergency-card-action">
                                    <Link
                                        to={`/requests/${request.id}`}
                                        className="view-emergency-request"
                                    >
                                        View Request & AI Matches →
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </main>
            )}
        </div>
    );
}

export default EmergencyDashboard;