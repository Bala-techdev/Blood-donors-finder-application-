import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../services/api";
import "./Dashboard.css";

const BLOOD_COMPATIBILITY_MAP = {
    "O-": { name: "O Negative (Universal Donor)", donateTo: ["All Blood Groups"], receiveFrom: ["O-"] },
    "O+": { name: "O Positive", donateTo: ["O+", "A+", "B+", "AB+"], receiveFrom: ["O+", "O-"] },
    "A-": { name: "A Negative", donateTo: ["A-", "A+", "AB-", "AB+"], receiveFrom: ["A-", "O-"] },
    "A+": { name: "A Positive", donateTo: ["A+", "AB+"], receiveFrom: ["A+", "A-", "O+", "O-"] },
    "B-": { name: "B Negative", donateTo: ["B-", "B+", "AB-", "AB+"], receiveFrom: ["B-", "O-"] },
    "B+": { name: "B Positive", donateTo: ["B+", "AB+"], receiveFrom: ["B+", "B-", "O+", "O-"] },
    "AB-": { name: "AB Negative", donateTo: ["AB-", "AB+"], receiveFrom: ["AB-", "A-", "B-", "O-"] },
    "AB+": { name: "AB Positive (Universal Recipient)", donateTo: ["AB+"], receiveFrom: ["All Blood Groups"] }
};

function Dashboard() {
    const navigate = useNavigate();

    const [donorCount, setDonorCount] = useState(0);
    const [requests, setRequests] = useState([]);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [dashboardError, setDashboardError] = useState("");
    const [loadingStats, setLoadingStats] = useState(true);
    const [demandForecast, setDemandForecast] = useState(null);
    const [shortageRisk, setShortageRisk] = useState(null);
    const [mlMonitoring, setMlMonitoring] = useState(null);
    const [selectedBloodGroup, setSelectedBloodGroup] = useState("O+");

    const storedUser = localStorage.getItem("bloodDonorUser");
    let user = null;
    try {
        user = storedUser ? JSON.parse(storedUser) : null;
    } catch {
        user = null;
    }

    const handleLogout = () => {
        localStorage.removeItem("bloodDonorUser");
        localStorage.removeItem("bloodDonorToken");
        navigate("/login");
    };

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoadingStats(true);
                setDashboardError("");

                const [
                    dashboardResult,
                    demandResult,
                    shortageResult,
                    monitoringResult
                ] = await Promise.allSettled([
                    api.get("/dashboard/me"),
                    api.get("/analytics/demand"),
                    api.get("/analytics/shortage-risk"),
                    api.get("/ml-monitoring")
                ]);

                if (dashboardResult.status === "fulfilled") {
                    const stats = dashboardResult.value.data;
                    setDashboardStats(stats);
                    setDonorCount(stats?.donorCount || 0);
                    setRequests(stats?.requests || []);
                } else {
                    setDashboardError("Unable to load primary dashboard statistics.");
                }

                if (demandResult.status === "fulfilled") {
                    setDemandForecast(demandResult.value.data);
                }

                if (shortageResult.status === "fulfilled") {
                    setShortageRisk(shortageResult.value.data);
                }

                if (monitoringResult.status === "fulfilled") {
                    setMlMonitoring(monitoringResult.value.data);
                }
            } catch (error) {
                console.error("Dashboard data error:", error);
                setDashboardError("Unable to load dashboard data. Please try again.");
            } finally {
                setLoadingStats(false);
            }
        };

        loadDashboardData();
    }, []);

    const pendingRequests = dashboardStats?.pendingRequests || 0;
    const emergencyRequests = requests.filter(
        (request) => request.urgency === "EMERGENCY"
    ).length;
    const fulfilledRequests = dashboardStats?.fulfilledRequests || 0;
    const acceptedResponses = dashboardStats?.acceptedResponses || 0;
    const profileCompletion = dashboardStats?.profileCompletionPercent || 0;
    const recentNotifications = dashboardStats?.recentNotifications || [];
    const nextDemandForecast = demandForecast?.forecasts?.slice(0, 3) || [];
    const highRiskIndicators =
        shortageRisk?.indicators
            ?.filter((indicator) => indicator.riskLevel === "HIGH")
            .slice(0, 3) || [];

    const currentCompatibility = BLOOD_COMPATIBILITY_MAP[selectedBloodGroup];

    return (
        <div className="dashboard-page">
            {/* =====================================================
                SIDEBAR
            ===================================================== */}
            <aside className="dashboard-sidebar">
                <Link to="/" className="dashboard-logo">
                    🩸 Blood<span>Donor</span>
                </Link>

                <nav className="dashboard-nav">
                    <Link to="/dashboard" className="nav-item active">
                        <span>⌂</span>
                        Dashboard
                    </Link>

                    <Link to="/donors" className="nav-item">
                        <span>🔍</span>
                        Find Donors
                    </Link>

                    <Link to="/requests" className="nav-item">
                        <span>🩸</span>
                        Blood Requests
                    </Link>

                    <Link to="/emergency" className="nav-item">
                        <span>🚨</span>
                        Emergency Center
                    </Link>

                    <Link to="/profile" className="nav-item">
                        <span>👤</span>
                        My Profile
                    </Link>

                    <Link to="/notifications" className="nav-item">
                        <span>🔔</span>
                        Notifications
                    </Link>
                </nav>

                <div className="sidebar-bottom">
                    <button className="logout-button" onClick={handleLogout}>
                        <span>↪</span>
                        Logout
                    </button>
                </div>
            </aside>

            {/* =====================================================
                MAIN
            ===================================================== */}
            <main className="dashboard-main">
                {/* LIVE AI STATUS TOP BAR */}
                <div className="ai-command-bar">
                    <div className="ai-command-left">
                        <span
                            className={`ai-pulse-dot ${
                                mlMonitoring ? "online" : "fallback"
                            }`}
                        />
                        <span>
                            {mlMonitoring
                                ? `SmartBlood AI Engine (${mlMonitoring.modelName} · ${mlMonitoring.modelVersion}) • Active`
                                : "SmartBlood AI Engine • Rule-Based Fallback Ready"}
                        </span>
                    </div>
                    <Link to="/emergency" className="ai-command-link">
                        🚨 Open Emergency Command Center →
                    </Link>
                </div>

                {/* HEADER */}
                <header className="dashboard-header">
                    <div>
                        <h1>
                            Good to see you, <span>{user?.name || "Donor"}!</span>
                        </h1>
                        <p>
                            Here's what's happening in your blood donation community.
                        </p>
                    </div>

                    <div className="header-actions">
                        <Link to="/notifications" className="notification-button">
                            🔔
                            {dashboardStats?.unreadNotifications > 0 && <span></span>}
                        </Link>

                        <Link to="/profile" className="user-mini">
                            <div className="user-avatar">
                                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div>
                                <strong>{user?.name || "User"}</strong>
                                <small>{user?.role || "USER"}</small>
                            </div>
                        </Link>
                    </div>
                </header>

                {dashboardError && (
                    <div className="dashboard-error" role="alert">
                        {dashboardError}
                    </div>
                )}

                {/* QUICK ACTIONS */}
                <section className="quick-actions">
                    <Link to="/donors" className="quick-action primary">
                        <div className="quick-icon">🔍</div>
                        <div>
                            <strong>Find a Donor</strong>
                            <span>Search nearby compatible donors</span>
                        </div>
                        <b>→</b>
                    </Link>

                    <Link to="/requests/create" className="quick-action">
                        <div className="quick-icon">🩸</div>
                        <div>
                            <strong>Request Blood</strong>
                            <span>Create an urgent or scheduled request</span>
                        </div>
                        <b>→</b>
                    </Link>

                    <Link to="/emergency" className="quick-action">
                        <div className="quick-icon">🚨</div>
                        <div>
                            <strong>Emergency Triage</strong>
                            <span>Live AI priority & escalation monitor</span>
                        </div>
                        <b>→</b>
                    </Link>
                </section>

                {/* =================================================
                    8-CARD SYMMETRIC STATISTICS GRID (4x2)
                ================================================= */}
                <section className="dashboard-stats">
                    <div className="dashboard-stat-card">
                        <div className="stat-top">
                            <span>Available Donors</span>
                            <div className="stat-icon red">🩸</div>
                        </div>
                        <h2>{loadingStats ? "..." : donorCount}</h2>
                        <p>Registered donors</p>
                    </div>

                    <div className="dashboard-stat-card">
                        <div className="stat-top">
                            <span>Total Requests</span>
                            <div className="stat-icon green">❤️</div>
                        </div>
                        <h2>{loadingStats ? "..." : requests.length}</h2>
                        <p>Blood requests</p>
                    </div>

                    <div className="dashboard-stat-card">
                        <div className="stat-top">
                            <span>Active Requests</span>
                            <div className="stat-icon orange">🚨</div>
                        </div>
                        <h2>{loadingStats ? "..." : pendingRequests}</h2>
                        <p>Currently pending</p>
                    </div>

                    <div className="dashboard-stat-card">
                        <div className="stat-top">
                            <span>Emergency</span>
                            <div className="stat-icon blue">🏆</div>
                        </div>
                        <h2>{loadingStats ? "..." : emergencyRequests}</h2>
                        <p>Urgent blood needs</p>
                    </div>

                    <div className="dashboard-stat-card">
                        <div className="stat-top">
                            <span>Fulfilled Requests</span>
                            <div className="stat-icon green">✅</div>
                        </div>
                        <h2>{loadingStats ? "..." : fulfilledRequests}</h2>
                        <p>Requests completed</p>
                    </div>

                    <div className="dashboard-stat-card">
                        <div className="stat-top">
                            <span>Accepted Responses</span>
                            <div className="stat-icon blue">🤝</div>
                        </div>
                        <h2>{loadingStats ? "..." : acceptedResponses}</h2>
                        <p>Your donor responses</p>
                    </div>

                    <div className="dashboard-stat-card">
                        <div className="stat-top">
                            <span>Profile Completion</span>
                            <div className="stat-icon orange">👤</div>
                        </div>
                        <h2>{loadingStats ? "..." : `${profileCompletion}%`}</h2>
                        <p>Donor profile details</p>
                    </div>

                    <div className="dashboard-stat-card">
                        <div className="stat-top">
                            <span>AI Model Accuracy</span>
                            <div className="stat-icon green">🤖</div>
                        </div>
                        <h2>
                            {mlMonitoring?.offlineEvaluationMetrics?.f1
                                ? `${(
                                      Number(
                                          mlMonitoring.offlineEvaluationMetrics.f1
                                      ) * 100
                                  ).toFixed(1)}%`
                                : "Online"}
                        </h2>
                        <p>
                            {mlMonitoring?.averageLatencyMs
                                ? `Avg latency ${Number(
                                      mlMonitoring.averageLatencyMs
                                  ).toFixed(0)} ms`
                                : "FastAPI ML Engine"}
                        </p>
                    </div>
                </section>

                {/* =================================================
                    3-COLUMN INTELLIGENCE & ANALYTICS GRID
                ================================================= */}
                <section className="intelligence-grid">
                    {/* 1. SHORTAGE RISK INDICATORS */}
                    <div className="dashboard-panel intelligence-card">
                        <div className="panel-header">
                            <div>
                                <span className="intel-tag warning">
                                    PROACTIVE ALERTS
                                </span>
                                <h2>⚠️ Shortage Risk Indicators</h2>
                                <p>Observed signals for donor outreach</p>
                            </div>
                        </div>

                        {highRiskIndicators.length > 0 ? (
                            <div className="intel-badge-list">
                                {highRiskIndicators.map((indicator) => (
                                    <div
                                        className="intel-alert-row high"
                                        key={`${indicator.bloodGroup}-${indicator.location}`}
                                    >
                                        <div className="intel-alert-top">
                                            <span className="intel-blood-pill">
                                                {indicator.bloodGroup}
                                            </span>
                                            <strong className="intel-location">
                                                📍 {indicator.location}
                                            </strong>
                                            <span className="intel-risk-tag">
                                                HIGH RISK
                                            </span>
                                        </div>
                                        <p className="intel-alert-desc">
                                            <b>{indicator.unresolvedRequests}</b>{" "}
                                            unresolved request(s) ·{" "}
                                            <b>
                                                {
                                                    indicator.availableEligibleCompatibleDonors
                                                }
                                            </b>{" "}
                                            eligible compatible donor(s) available
                                        </p>
                                    </div>
                                ))}
                                <small className="intel-footnote">
                                    Observed rule-based indicators for immediate outreach.
                                </small>
                            </div>
                        ) : (
                            <div className="intel-empty-box">
                                <span>✅</span>
                                <strong>Healthy Regional Coverage</strong>
                                <p>
                                    No high-risk blood group shortages detected right now.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 2. AI MODEL MONITORING */}
                    <div className="dashboard-panel intelligence-card">
                        <div className="panel-header">
                            <div>
                                <span className="intel-tag ai">
                                    FASTAPI MICROSERVICE
                                </span>
                                <h2>🤖 AI Model Monitoring</h2>
                                <p>Live telemetry & offline holdout metrics</p>
                            </div>
                        </div>

                        {mlMonitoring ? (
                            <div className="intel-badge-list">
                                <div className="ml-status-box">
                                    <div>
                                        <small>Classifier Model</small>
                                        <strong>{mlMonitoring.modelName}</strong>
                                        <span className="ml-version-pill">
                                            {mlMonitoring.modelVersion}
                                        </span>
                                    </div>
                                    <span className="ml-online-pill">
                                        ● {mlMonitoring.availability}
                                    </span>
                                </div>

                                <div className="ml-metrics-mini-grid">
                                    <div>
                                        <span>Predictions</span>
                                        <strong>
                                            {mlMonitoring.predictionRequests}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Successful</span>
                                        <strong style={{ color: "#16a34a" }}>
                                            {mlMonitoring.successfulPredictions}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>F1 Score</span>
                                        <strong style={{ color: "#2563eb" }}>
                                            {mlMonitoring.offlineEvaluationMetrics
                                                ?.f1 ?? "—"}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>ROC-AUC</span>
                                        <strong style={{ color: "#7c3aed" }}>
                                            {mlMonitoring.offlineEvaluationMetrics
                                                ?.rocAuc ?? "—"}
                                        </strong>
                                    </div>
                                </div>

                                {(mlMonitoring.dataQualityWarnings || []).length >
                                    0 && (
                                    <div className="ml-warnings-box">
                                        <strong>Telemetry Notices:</strong>
                                        <ul>
                                            {mlMonitoring.dataQualityWarnings
                                                .slice(0, 2)
                                                .map((warning) => (
                                                    <li key={warning}>{warning}</li>
                                                ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="intel-empty-box">
                                <span>⚠️</span>
                                <strong>ML Telemetry Offline</strong>
                                <p>
                                    Using rule-based donor scoring fallback.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 3. DEMAND OUTLOOK */}
                    <div className="dashboard-panel intelligence-card">
                        <div className="panel-header">
                            <div>
                                <span className="intel-tag forecast">
                                    TREND ANALYTICS
                                </span>
                                <h2>📈 Demand Outlook</h2>
                                <p>Monthly request volume projections</p>
                            </div>
                        </div>

                        {demandForecast?.dataSufficient &&
                        nextDemandForecast.length > 0 ? (
                            <div className="intel-badge-list">
                                {nextDemandForecast.map((forecast) => (
                                    <div
                                        className="intel-alert-row normal"
                                        key={`${forecast.period}-${forecast.bloodGroup}`}
                                    >
                                        <div className="intel-alert-top">
                                            <span className="intel-blood-pill">
                                                {forecast.bloodGroup}
                                            </span>
                                            <strong>{forecast.period}</strong>
                                        </div>
                                        <p className="intel-alert-desc">
                                            Expected Demand:{" "}
                                            <b>
                                                {Number(
                                                    forecast.predictedRequestCount ||
                                                        0
                                                ).toFixed(1)}{" "}
                                                requests
                                            </b>
                                        </p>
                                    </div>
                                ))}
                                <small className="intel-footnote">
                                    Baseline moving-average projection from historical requests.
                                </small>
                            </div>
                        ) : (
                            <div className="intel-empty-box">
                                <span>📊</span>
                                <strong>Collecting Historical Baseline</strong>
                                <p>
                                    Demand forecasting unlocks automatically once 3+ months of dated request history accumulate.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* =================================================
                    BOTTOM CONTENT (RECENT REQUESTS, COMPATIBILITY, NOTIFICATIONS)
                ================================================= */}
                <section className="dashboard-content">
                    {/* RECENT REQUESTS */}
                    <div className="dashboard-panel">
                        <div className="panel-header">
                            <div>
                                <h2>Recent Blood Requests</h2>
                                <p>Click any request to view AI donor matches</p>
                            </div>
                            <Link to="/requests">View All</Link>
                        </div>

                        <div className="request-list">
                            {loadingStats ? (
                                <div className="dashboard-loading">
                                    🩸
                                    <p>Loading requests...</p>
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="dashboard-empty">
                                    <div>🩸</div>
                                    <strong>No blood requests yet</strong>
                                    <p>New requests will appear here.</p>
                                    <Link to="/requests/create">Create Request</Link>
                                </div>
                            ) : (
                                requests.slice(0, 4).map((request) => (
                                    <Link
                                        to={`/requests/${request.id}`}
                                        className="request-item"
                                        key={request.id}
                                        style={{
                                            textDecoration: "none",
                                            color: "inherit"
                                        }}
                                    >
                                        <div className="blood-badge">
                                            {request.bloodGroup}
                                        </div>
                                        <div className="request-info">
                                            <strong>{request.patientName}</strong>
                                            <span>
                                                🏥 {request.hospitalName} • 📍{" "}
                                                {request.location}
                                            </span>
                                        </div>
                                        <div
                                            className={`request-status ${
                                                request.urgency === "EMERGENCY"
                                                    ? "urgent"
                                                    : ""
                                            }`}
                                        >
                                            {request.urgency}
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* INTERACTIVE BLOOD COMPATIBILITY */}
                    <div className="dashboard-panel compatibility-panel">
                        <div className="panel-header">
                            <div>
                                <h2>Interactive Blood Compatibility</h2>
                                <p>Select a blood group to check compatibility</p>
                            </div>
                        </div>

                        <div className="blood-selector-pills">
                            {Object.keys(BLOOD_COMPATIBILITY_MAP).map((bg) => (
                                <button
                                    key={bg}
                                    type="button"
                                    onClick={() => setSelectedBloodGroup(bg)}
                                    className={`blood-pill-btn ${
                                        selectedBloodGroup === bg ? "active" : ""
                                    }`}
                                >
                                    {bg}
                                </button>
                            ))}
                        </div>

                        <div className="compatibility-content">
                            <div className="large-blood">{selectedBloodGroup}</div>
                            <div>
                                <strong>{currentCompatibility.name}</strong>
                                <p style={{ marginTop: "6px", marginBottom: "4px" }}>
                                    Can donate to:
                                </p>
                                <div className="compatibility-groups">
                                    {currentCompatibility.donateTo.map((group) => (
                                        <span key={`donate-${group}`}>{group}</span>
                                    ))}
                                </div>
                                <p style={{ marginTop: "10px", marginBottom: "4px" }}>
                                    Can receive from:
                                </p>
                                <div className="compatibility-groups">
                                    {currentCompatibility.receiveFrom.map((group) => (
                                        <span key={`receive-${group}`}>{group}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Link to="/donors" className="compatibility-button">
                            Find Compatible Donors →
                        </Link>
                    </div>

                    {/* RECENT NOTIFICATIONS */}
                    <div className="dashboard-panel">
                        <div className="panel-header">
                            <div>
                                <h2>Recent Notifications</h2>
                                <p>
                                    {dashboardStats?.unreadNotifications || 0} unread
                                </p>
                            </div>
                            <Link to="/notifications">View All</Link>
                        </div>

                        {loadingStats ? (
                            <div className="dashboard-loading">
                                <p>Loading notifications...</p>
                            </div>
                        ) : recentNotifications.length === 0 ? (
                            <div className="dashboard-empty">
                                <strong>No recent notifications</strong>
                                <p>Updates about your activity will appear here.</p>
                            </div>
                        ) : (
                            <div className="request-list">
                                {recentNotifications
                                    .slice(0, 3)
                                    .map((notification) => (
                                        <div
                                            className="request-item"
                                            key={notification.id}
                                        >
                                            <div className="blood-badge">
                                                {notification.read ? "✓" : "!"}
                                            </div>
                                            <div className="request-info">
                                                <strong>
                                                    {notification.title}
                                                </strong>
                                                <span>
                                                    {notification.message}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* EMERGENCY BANNER */}
                {emergencyRequests > 0 && (
                    <section className="dashboard-emergency">
                        <div className="emergency-icon">🚨</div>
                        <div>
                            <strong>
                                Emergency blood requests need attention
                            </strong>
                            <p>
                                There are currently {emergencyRequests} emergency
                                request{emergencyRequests > 1 ? "s" : ""} in the
                                system.
                            </p>
                        </div>
                        <Link to="/emergency" className="emergency-button">
                            Open Emergency Triage →
                        </Link>
                    </section>
                )}
            </main>
        </div>
    );
}

export default Dashboard;