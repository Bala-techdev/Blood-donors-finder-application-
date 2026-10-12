import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../services/api";
import "./Dashboard.css";

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

    const storedUser =
        localStorage.getItem("bloodDonorUser");

    const user = storedUser
        ? JSON.parse(storedUser)
        : null;


    /* =========================
       LOGOUT
    ========================= */
        const handleLogout = () => {
            localStorage.removeItem("bloodDonorUser");
            localStorage.removeItem("bloodDonorToken");
            navigate("/login");
        };


    /* =========================
       LOAD DASHBOARD DATA
    ========================= */

    useEffect(() => {

        const loadDashboardData = async () => {

            try {

                setLoadingStats(true);

                setDashboardError("");
                const [dashboardResponse, demandResponse, shortageResponse, monitoringResponse] = await Promise.all([
                    api.get("/dashboard/me"),
                    api.get("/analytics/demand"),
                    api.get("/analytics/shortage-risk"),
                    api.get("/ml-monitoring")
                ]);
                const stats = dashboardResponse.data;
                setDashboardStats(stats);
                setDonorCount(stats.donorCount || 0);
                setRequests(stats.requests || []);
                setDemandForecast(demandResponse.data);
                setShortageRisk(shortageResponse.data);
                setMlMonitoring(monitoringResponse.data);


            } catch (error) {

                console.error(
                    "Dashboard data error:",
                    error
                );
                setDashboardError(
                    "Unable to load dashboard data. Please try again."
                );

            } finally {

                setLoadingStats(false);

            }

        };


        loadDashboardData();

    }, []);


    /* =========================
       STATISTICS
    ========================= */

    const pendingRequests = dashboardStats?.pendingRequests || 0;


    const emergencyRequests =
        requests.filter(
            (request) =>
                request.urgency === "EMERGENCY"
        ).length;

    const fulfilledRequests = dashboardStats?.fulfilledRequests || 0;
    const acceptedResponses = dashboardStats?.acceptedResponses || 0;
    const profileCompletion =
        dashboardStats?.profileCompletionPercent || 0;
    const recentNotifications =
        dashboardStats?.recentNotifications || [];
    const nextDemandForecast =
        demandForecast?.forecasts?.slice(0, 3) || [];
    const highRiskIndicators =
        shortageRisk?.indicators?.filter(
            (indicator) => indicator.riskLevel === "HIGH"
        ).slice(0, 3) || [];


    return (

        <div className="dashboard-page">


            {/* =====================================================
                SIDEBAR
            ===================================================== */}

            <aside className="dashboard-sidebar">


                {/* LOGO */}

                <Link
                    to="/"
                    className="dashboard-logo"
                >
                    🩸 Blood<span>Donor</span>
                </Link>


                {/* NAVIGATION */}

                <nav className="dashboard-nav">


                    <Link
                        to="/dashboard"
                        className="nav-item active"
                    >
                        <span>⌂</span>
                        Dashboard
                    </Link>


                    <Link
                        to="/donors"
                        className="nav-item"
                    >
                        <span>🔍</span>
                        Find Donors
                    </Link>


                    <Link
                        to="/requests"
                        className="nav-item"
                    >
                        <span>🩸</span>
                        Blood Requests
                    </Link>


                    <Link
                        to="/profile"
                        className="nav-item"
                    >
                        <span>👤</span>
                        My Profile
                    </Link>


                    <Link
                        to="/notifications"
                        className="nav-item"
                    >
                        <span>🔔</span>
                        Notifications
                    </Link>


                </nav>


                {/* SIDEBAR BOTTOM */}

                <div className="sidebar-bottom">


                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        <span>↪</span>
                        Logout
                    </button>


                </div>


            </aside>


            {/* =====================================================
                MAIN
            ===================================================== */}

            <main className="dashboard-main">


                {/* =================================================
                    HEADER
                ================================================= */}

                <header className="dashboard-header">


                    <div>

                        <h1>
                            Good to see you,{" "}

                            <span>
                                {user?.name || "Donor"}!
                            </span>
                        </h1>


                        <p>
                            Here's what's happening in your
                            blood donation community.
                        </p>

                    </div>


                    <div className="header-actions">


                        {/* NOTIFICATIONS */}

                        <Link
                            to="/notifications"
                            className="notification-button"
                        >
                            🔔

                            {dashboardStats?.unreadNotifications > 0 && (
                                <span></span>
                            )}

                        </Link>


                        {/* USER */}

                        <Link
                            to="/profile"
                            className="user-mini"
                        >

                            <div className="user-avatar">

                                {user?.name
                                    ? user.name
                                        .charAt(0)
                                        .toUpperCase()
                                    : "U"}

                            </div>


                            <div>

                                <strong>
                                    {user?.name || "User"}
                                </strong>

                                <small>
                                    {user?.role || "USER"}
                                </small>

                            </div>

                        </Link>


                    </div>


                </header>

                {dashboardError && (
                    <div className="dashboard-error" role="alert">
                        {dashboardError}
                    </div>
                )}


                {/* =================================================
                    QUICK ACTIONS
                ================================================= */}

                <section className="quick-actions">


                    {/* FIND DONOR */}

                    <Link
                        to="/donors"
                        className="quick-action primary"
                    >

                        <div className="quick-icon">
                            🔍
                        </div>


                        <div>

                            <strong>
                                Find a Donor
                            </strong>

                            <span>
                                Search nearby donors
                            </span>

                        </div>


                        <b>
                            →
                        </b>

                    </Link>


                    {/* REQUEST BLOOD */}

                    <Link
                        to="/requests/create"
                        className="quick-action"
                    >

                        <div className="quick-icon">
                            🩸
                        </div>


                        <div>

                            <strong>
                                Request Blood
                            </strong>

                            <span>
                                Create a blood request
                            </span>

                        </div>


                        <b>
                            →
                        </b>

                    </Link>


                    {/* PROFILE */}

                    <Link
                        to="/profile"
                        className="quick-action"
                    >

                        <div className="quick-icon">
                            👤
                        </div>


                        <div>

                            <strong>
                                Update Profile
                            </strong>

                            <span>
                                Keep your details updated
                            </span>

                        </div>


                        <b>
                            →
                        </b>

                    </Link>


                </section>


                {/* =================================================
                    STATISTICS
                ================================================= */}

                <section className="dashboard-stats">


                    {/* AVAILABLE DONORS */}

                    <div className="dashboard-stat-card">

                        <div className="stat-top">

                            <span>
                                Available Donors
                            </span>

                            <div className="stat-icon red">
                                🩸
                            </div>

                        </div>


                        <h2>
                            {loadingStats
                                ? "..."
                                : donorCount}
                        </h2>


                        <p>
                            Registered donors
                        </p>

                    </div>


                    {/* TOTAL REQUESTS */}

                    <div className="dashboard-stat-card">

                        <div className="stat-top">

                            <span>
                                Total Requests
                            </span>

                            <div className="stat-icon green">
                                ❤️
                            </div>

                        </div>


                        <h2>
                            {loadingStats
                                ? "..."
                                : requests.length}
                        </h2>


                        <p>
                            Blood requests
                        </p>

                    </div>


                    {/* ACTIVE REQUESTS */}

                    <div className="dashboard-stat-card">

                        <div className="stat-top">

                            <span>
                                Active Requests
                            </span>

                            <div className="stat-icon orange">
                                🚨
                            </div>

                        </div>


                        <h2>
                            {loadingStats
                                ? "..."
                                : pendingRequests}
                        </h2>


                        <p>
                            Currently pending
                        </p>

                    </div>


                    {/* EMERGENCY */}

                    <div className="dashboard-stat-card">

                        <div className="stat-top">

                            <span>
                                Emergency
                            </span>

                            <div className="stat-icon blue">
                                🏆
                            </div>

                        </div>


                        <h2>
                            {loadingStats
                                ? "..."
                                : emergencyRequests}
                        </h2>


                        <p>
                            Urgent blood needs
                        </p>

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


                </section>

                <section className="dashboard-panel demand-forecast-panel">
                    <div className="panel-header">
                        <div>
                            <h2>Demand outlook</h2>
                            <p>
                                Aggregate monthly request counts by blood group.
                            </p>
                        </div>
                    </div>
                    {demandForecast?.dataSufficient && nextDemandForecast.length > 0 ? (
                        <div className="demand-forecast-list">
                            {nextDemandForecast.map((forecast) => (
                                <div
                                    className="demand-forecast-item"
                                    key={`${forecast.period}-${forecast.bloodGroup}`}
                                >
                                    <strong>
                                        {forecast.bloodGroup}
                                    </strong>
                                    <span>
                                        {forecast.predictedRequestCount.toFixed(1)}
                                        {" "}requests expected in {forecast.period}
                                    </span>
                                </div>
                            ))}
                            <small>
                                Baseline forecast only; not validated demand or a
                                guarantee of blood availability.
                            </small>
                        </div>
                    ) : (
                        <p className="dashboard-empty-state">
                            Demand forecasting needs at least three months of
                            dated request history. No estimate is shown yet.
                        </p>
                    )}
                </section>

                <section className="dashboard-panel">
                    <div className="panel-header">
                        <div>
                            <h2>Shortage risk indicators</h2>
                            <p>
                                Observed rule-based signals for donor outreach.
                            </p>
                        </div>
                    </div>
                    {highRiskIndicators.length > 0 ? (
                        <div className="demand-forecast-list">
                            {highRiskIndicators.map((indicator) => (
                                <div
                                    className="demand-forecast-item"
                                    key={`${indicator.bloodGroup}-${indicator.location}`}
                                >
                                    <strong>
                                        {indicator.bloodGroup} · {indicator.location}
                                    </strong>
                                    <span>
                                        High risk: {indicator.unresolvedRequests}
                                        {" "}unresolved request(s),{" "}
                                        {indicator.availableEligibleCompatibleDonors}
                                        {" "}currently eligible compatible donor(s).
                                    </span>
                                </div>
                            ))}
                            <small>
                                These are observed indicators, not a trained
                                prediction or guaranteed shortage.
                            </small>
                        </div>
                    ) : (
                        <p className="dashboard-empty-state">
                            No high-risk observed indicators are currently
                            available.
                        </p>
                    )}
                </section>

                <section className="dashboard-panel ml-monitoring-panel">
                    <div className="panel-header">
                        <div>
                            <h2>AI model monitoring</h2>
                            <p>Live integration measurements and verified offline evaluation.</p>
                        </div>
                    </div>
                    {mlMonitoring ? (
                        <>
                            <div className="demand-forecast-list">
                                <div className="demand-forecast-item">
                                    <strong>{mlMonitoring.modelName}</strong>
                                    <span>
                                        Version {mlMonitoring.modelVersion} · availability: {mlMonitoring.availability}
                                    </span>
                                </div>
                                <div className="demand-forecast-item">
                                    <span>
                                        {mlMonitoring.predictionRequests} requests ·{" "}
                                        {mlMonitoring.successfulPredictions} successful ·{" "}
                                        {mlMonitoring.failedPredictions} failed ·{" "}
                                        {mlMonitoring.fallbackPredictions} fallbacks
                                    </span>
                                    <span>
                                        Average latency: {mlMonitoring.averageLatencyMs.toFixed(1)} ms
                                    </span>
                                </div>
                            </div>
                            <small>
                                Offline metrics: F1 {mlMonitoring.offlineEvaluationMetrics.f1},
                                {" "}ROC-AUC {mlMonitoring.offlineEvaluationMetrics.rocAuc}.
                                {" "}{mlMonitoring.evaluationNotice}
                                {" "}Live predictions are not labelled correct or incorrect.
                            </small>
                            <ul className="monitoring-warning-list">
                            {(mlMonitoring.dataQualityWarnings || []).map((warning) => (
                                <li key={warning}>{warning}</li>
                            ))}
                            </ul>
                        </>
                    ) : (
                        <p className="dashboard-empty-state">
                            Monitoring data is unavailable; the ML service may be offline.
                        </p>
                    )}
                </section>


                {/* =================================================
                    CONTENT
                ================================================= */}

                <section className="dashboard-content">


                    {/* =================================================
                        RECENT REQUESTS
                    ================================================= */}

                    <div className="dashboard-panel">


                        <div className="panel-header">

                            <div>

                                <h2>
                                    Recent Blood Requests
                                </h2>

                                <p>
                                    People who currently need help
                                </p>

                            </div>


                            <Link
                                to="/requests"
                            >
                                View All
                            </Link>

                        </div>


                        <div className="request-list">


                            {loadingStats ? (

                                <div className="dashboard-loading">

                                    🩸

                                    <p>
                                        Loading requests...
                                    </p>

                                </div>


                            ) : requests.length === 0 ? (

                                <div className="dashboard-empty">

                                    <div>
                                        🩸
                                    </div>

                                    <strong>
                                        No blood requests yet
                                    </strong>

                                    <p>
                                        New requests will appear here.
                                    </p>

                                    <Link
                                        to="/requests/create"
                                    >
                                        Create Request
                                    </Link>

                                </div>


                            ) : (

                                requests
                                    .slice(0, 3)
                                    .map((request) => (

                                        <div
                                            className="request-item"
                                            key={request.id}
                                        >


                                            {/* BLOOD GROUP */}

                                            <div className="blood-badge">

                                                {request.bloodGroup}

                                            </div>


                                            {/* REQUEST INFO */}

                                            <div className="request-info">

                                                <strong>

                                                    {request.patientName}

                                                </strong>


                                                <span>

                                                    🏥{" "}

                                                    {request.hospitalName}

                                                    {" • "}

                                                    📍{" "}

                                                    {request.location}

                                                </span>

                                            </div>


                                            {/* URGENCY */}

                                            <div
                                                className={`request-status ${
                                                    request.urgency ===
                                                    "EMERGENCY"
                                                        ? "urgent"
                                                        : ""
                                                }`}
                                            >

                                                {request.urgency}

                                            </div>


                                        </div>

                                    ))

                            )}

                        </div>


                    </div>


                    {/* =================================================
                        BLOOD COMPATIBILITY
                    ================================================= */}

                    <div className="dashboard-panel compatibility-panel">


                        <div className="panel-header">

                            <div>

                                <h2>
                                    Blood Compatibility
                                </h2>

                                <p>
                                    Quick reference
                                </p>

                            </div>

                        </div>


                        <div className="compatibility-content">


                            <div className="large-blood">
                                O+
                            </div>


                            <div>

                                <strong>
                                    O Positive
                                </strong>


                                <p>
                                    Can donate to:
                                </p>


                                <div className="compatibility-groups">

                                    <span>
                                        O+
                                    </span>

                                    <span>
                                        A+
                                    </span>

                                    <span>
                                        B+
                                    </span>

                                    <span>
                                        AB+
                                    </span>

                                </div>

                            </div>


                        </div>


                        <Link
                            to="/donors"
                            className="compatibility-button"
                        >
                            Find Compatible Donors →
                        </Link>


                    </div>

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
                                {recentNotifications.slice(0, 3).map((notification) => (
                                    <div className="request-item" key={notification.id}>
                                        <div className="blood-badge">
                                            {notification.read ? "✓" : "!"}
                                        </div>
                                        <div className="request-info">
                                            <strong>{notification.title}</strong>
                                            <span>{notification.message}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </section>


                {/* =================================================
                    EMERGENCY BANNER
                ================================================= */}

                {emergencyRequests > 0 && (

                    <section className="dashboard-emergency">

                        <div className="emergency-icon">
                            🚨
                        </div>


                        <div>

                            <strong>
                                Emergency blood requests need attention
                            </strong>

                            <p>
                                There are currently{" "}
                                {emergencyRequests} emergency
                                request
                                {emergencyRequests > 1
                                    ? "s"
                                    : ""}{" "}
                                in the system.
                            </p>

                        </div>


                        <Link
                            to="/requests"
                            className="emergency-button"
                        >
                            View Requests →
                        </Link>

                    </section>

                )}


            </main>

        </div>

    );
}

export default Dashboard;