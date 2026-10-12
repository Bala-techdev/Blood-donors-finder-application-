import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./BloodRequests.css";

function BloodRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [actionError, setActionError] = useState("");
    const [respondingId, setRespondingId] = useState(null);

    // Filter states for live demo
    const [selectedBloodGroup, setSelectedBloodGroup] = useState("");
    const [selectedUrgency, setSelectedUrgency] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await api.get("/requests/pending");
            setRequests(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Unable to load blood requests:", err);
            setError(
                err.response?.data?.message ||
                    "Unable to load blood requests. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const getUrgencyClass = (urgency) => {
        if (urgency === "EMERGENCY") return "urgency emergency";
        if (urgency === "URGENT") return "urgency urgent";
        return "urgency normal";
    };

    const getStatusClass = (status) => {
        if (status === "FULFILLED") return "request-status fulfilled";
        if (status === "CANCELLED") return "request-status cancelled";
        return "request-status pending";
    };

    const handleHelp = async (requestId) => {
        setActionMessage("");
        setActionError("");

        const confirmed = window.confirm(
            "Are you available and eligible to donate blood for this request?"
        );
        if (!confirmed) return;

        const storedUser = localStorage.getItem("bloodDonorUser");
        if (!storedUser) {
            setActionError("Please login before responding to a blood request.");
            return;
        }

        let user;
        try {
            user = JSON.parse(storedUser);
        } catch {
            setActionError(
                "Your saved login information is invalid. Please log in again."
            );
            return;
        }

        if (!user?.id) {
            setActionError(
                "Unable to identify the logged-in user. Please log in again."
            );
            return;
        }

        try {
            setRespondingId(requestId);
            await api.post(`/request-responses/request/${requestId}/respond`);
            setActionMessage(
                `✅ Thank you! Your willingness to donate for Request #${requestId} has been recorded and sent to the requester.`
            );
            await fetchRequests();
        } catch (err) {
            console.error("Unable to respond to request:", err);
            setActionError(
                err.response?.data?.message ||
                    err.response?.data?.error ||
                    "Unable to respond to this request. Please try again."
            );
        } finally {
            setRespondingId(null);
        }
    };

    // Filtered list sorted with EMERGENCY on top
    const filteredRequests = requests
        .filter((req) => {
            if (
                selectedBloodGroup &&
                req.bloodGroup !== selectedBloodGroup
            ) {
                return false;
            }
            if (
                selectedUrgency !== "ALL" &&
                req.urgency !== selectedUrgency
            ) {
                return false;
            }
            if (searchQuery.trim() !== "") {
                const q = searchQuery.toLowerCase();
                const matchPatient = req.patientName
                    ?.toLowerCase()
                    .includes(q);
                const matchHospital = req.hospitalName
                    ?.toLowerCase()
                    .includes(q);
                const matchLocation = req.location
                    ?.toLowerCase()
                    .includes(q);
                return matchPatient || matchHospital || matchLocation;
            }
            return true;
        })
        .sort((a, b) => {
            const weight = { EMERGENCY: 3, URGENT: 2, NORMAL: 1 };
            return (weight[b.urgency] || 0) - (weight[a.urgency] || 0);
        });

    return (
        <div className="blood-requests-page">
            <header className="requests-page-header">
                <div className="requests-header-top">
                    <Link to="/dashboard" className="requests-back">
                        ← Dashboard
                    </Link>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <Link
                            to="/emergency"
                            className="create-request-button"
                            style={{
                                background: "#fff1f2",
                                color: "#be123c",
                                border: "1px solid #fda4af"
                            }}
                        >
                            🚨 Emergency Triage
                        </Link>
                        <Link
                            to="/requests/create"
                            className="create-request-button"
                        >
                            + Create Request
                        </Link>
                    </div>
                </div>
                <div className="requests-title">
                    <span>BLOOD REQUESTS</span>
                    <h1>People Who Need Blood</h1>
                    <p>
                        Find active blood requests, filter by blood type or urgency, and help save lives.
                    </p>
                </div>
            </header>

            <main className="blood-requests-main">
                {/* SUMMARY CARDS (CLICKABLE TO FILTER) */}
                <div className="request-summary">
                    <div
                        className="summary-card"
                        onClick={() => setSelectedUrgency("ALL")}
                        style={{
                            cursor: "pointer",
                            outline:
                                selectedUrgency === "ALL"
                                    ? "2px solid #dc2626"
                                    : "none"
                        }}
                    >
                        <div className="summary-icon red">🩸</div>
                        <div>
                            <span>All Active Requests</span>
                            <strong>{requests.length}</strong>
                        </div>
                    </div>

                    <div
                        className="summary-card"
                        onClick={() => setSelectedUrgency("EMERGENCY")}
                        style={{
                            cursor: "pointer",
                            outline:
                                selectedUrgency === "EMERGENCY"
                                    ? "2px solid #dc2626"
                                    : "none"
                        }}
                    >
                        <div className="summary-icon orange">🚨</div>
                        <div>
                            <span>Critical Emergencies</span>
                            <strong>
                                {
                                    requests.filter(
                                        (r) => r.urgency === "EMERGENCY"
                                    ).length
                                }
                            </strong>
                        </div>
                    </div>

                    <div
                        className="summary-card"
                        onClick={() => setSelectedUrgency("URGENT")}
                        style={{
                            cursor: "pointer",
                            outline:
                                selectedUrgency === "URGENT"
                                    ? "2px solid #dc2626"
                                    : "none"
                        }}
                    >
                        <div className="summary-icon green">⚡</div>
                        <div>
                            <span>Urgent Requests</span>
                            <strong>
                                {
                                    requests.filter(
                                        (r) => r.urgency === "URGENT"
                                    ).length
                                }
                            </strong>
                        </div>
                    </div>
                </div>

                {/* FILTER & SEARCH BAR */}
                <div
                    style={{
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap",
                        marginBottom: "20px",
                        padding: "14px",
                        background: "#ffffff",
                        borderRadius: "12px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                        border: "1px solid #f1f5f9"
                    }}
                >
                    <input
                        type="text"
                        placeholder="🔍 Search by hospital, city, or patient name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            flex: "2",
                            minWidth: "220px",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "14px"
                        }}
                    />

                    <select
                        value={selectedBloodGroup}
                        onChange={(e) => setSelectedBloodGroup(e.target.value)}
                        style={{
                            flex: "1",
                            minWidth: "150px",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "14px"
                        }}
                    >
                        <option value="">All Blood Groups</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                    </select>

                    {(selectedBloodGroup ||
                        selectedUrgency !== "ALL" ||
                        searchQuery) && (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedBloodGroup("");
                                setSelectedUrgency("ALL");
                                setSearchQuery("");
                            }}
                            style={{
                                padding: "10px 16px",
                                borderRadius: "8px",
                                border: "1px solid #e2e8f0",
                                background: "#f8fafc",
                                color: "#475569",
                                fontWeight: "600",
                                cursor: "pointer"
                            }}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* IN-APP FEEDBACK BANNERS */}
                {actionMessage && (
                    <div
                        style={{
                            padding: "12px 16px",
                            marginBottom: "18px",
                            borderRadius: "10px",
                            background: "#ecfdf5",
                            border: "1px solid #a7f3d0",
                            color: "#065f46",
                            fontWeight: "600"
                        }}
                    >
                        {actionMessage}
                    </div>
                )}

                {actionError && (
                    <div
                        style={{
                            padding: "12px 16px",
                            marginBottom: "18px",
                            borderRadius: "10px",
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#991b1b",
                            fontWeight: "600"
                        }}
                    >
                        ⚠️ {actionError}
                    </div>
                )}

                {loading && (
                    <div className="requests-state">
                        <div>🩸</div>
                        <p>Loading blood requests...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="requests-state error">
                        <div>⚠️</div>
                        <p>{error}</p>
                        <button onClick={fetchRequests}>Try Again</button>
                    </div>
                )}

                {!loading && !error && filteredRequests.length === 0 && (
                    <div className="requests-state">
                        <div>🩸</div>
                        <h2>No Matching Blood Requests</h2>
                        <p>
                            There are currently no pending requests matching your filter criteria.
                        </p>
                        <Link
                            to="/requests/create"
                            className="empty-create-button"
                        >
                            Create Blood Request
                        </Link>
                    </div>
                )}

                {!loading && !error && filteredRequests.length > 0 && (
                    <div className="requests-list">
                        {filteredRequests.map((request) => (
                            <div
                                className="blood-request-card"
                                key={request.id}
                            >
                                <div className="request-card-top">
                                    <div className="request-blood-group">
                                        <span>BLOOD</span>
                                        <strong>
                                            {request.bloodGroup || "N/A"}
                                        </strong>
                                    </div>
                                    <div className="request-card-title">
                                        <h2>
                                            {request.patientName || "Patient"}
                                        </h2>
                                        <p>
                                            🏥{" "}
                                            {request.hospitalName ||
                                                "Hospital not specified"}
                                        </p>
                                        <small>
                                            📍{" "}
                                            {request.location ||
                                                "Location not specified"}
                                        </small>
                                    </div>
                                    <div className="request-card-badges">
                                        <span
                                            className={getUrgencyClass(
                                                request.urgency
                                            )}
                                        >
                                            {request.urgency || "NORMAL"}
                                        </span>
                                        <span
                                            className={getStatusClass(
                                                request.status
                                            )}
                                        >
                                            {request.status || "PENDING"}
                                        </span>
                                    </div>
                                </div>

                                <div className="request-card-details">
                                    <div>
                                        <span>Units Required</span>
                                        <strong>
                                            {request.units ?? 1} Units
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Required Date</span>
                                        <strong>
                                            {request.requiredDate ||
                                                "Immediate"}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Request ID</span>
                                        <strong>#{request.id}</strong>
                                    </div>
                                </div>

                                {request.description && (
                                    <div className="request-description">
                                        <span>Clinical Note</span>
                                        <p>{request.description}</p>
                                    </div>
                                )}

                                <div className="request-card-bottom">
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "10px",
                                            alignItems: "center",
                                            flexWrap: "wrap"
                                        }}
                                    >
                                        {request.hospitalName && (
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                    `${request.hospitalName}${
                                                        request.location || ""
                                                    }`
                                                )}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    fontSize: "12px",
                                                    fontWeight: "700",
                                                    color: "#be123c",
                                                    textDecoration: "none",
                                                    background: "#fff1f2",
                                                    padding: "5px 10px",
                                                    borderRadius: "6px"
                                                }}
                                            >
                                                📍 Hospital Map
                                            </a>
                                        )}
                                        <a
                                            href={`https://wa.me/?text=${encodeURIComponent(
                                                `🚨 URGENT BLOOD REQUEST (#${request.id}):${request.units} unit(s) of ${request.bloodGroup} blood needed for${request.patientName} at ${request.hospitalName},${request.location}. Required by: ${request.requiredDate}.`
                                            )}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: "700",
                                                color: "#15803d",
                                                textDecoration: "none",
                                                background: "#f0fdf4",
                                                padding: "5px 10px",
                                                borderRadius: "6px"
                                            }}
                                        >
                                            💬 Share Alert
                                        </a>
                                    </div>

                                    <div className="request-actions">
                                        <Link
                                            to={`/requests/${request.id}`}
                                            className="view-details-button"
                                        >
                                            View AI Matches & Details
                                        </Link>
                                        <button
                                            className="help-button"
                                            onClick={() =>
                                                handleHelp(request.id)
                                            }
                                            disabled={
                                                respondingId === request.id
                                            }
                                        >
                                            {respondingId === request.id
                                                ? "Submitting..."
                                                : "🩸 I Can Help"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default BloodRequests;