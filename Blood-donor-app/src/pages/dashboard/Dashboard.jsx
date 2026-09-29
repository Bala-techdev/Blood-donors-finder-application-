import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../services/api";
import "./Dashboard.css";

function Dashboard() {

    const navigate = useNavigate();

    const [donorCount, setDonorCount] = useState(0);
    const [requests, setRequests] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);

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

        navigate("/login");
    };


    /* =========================
       LOAD DASHBOARD DATA
    ========================= */

    useEffect(() => {

        const loadDashboardData = async () => {

            try {

                setLoadingStats(true);

                const [
                    donorsResponse,
                    requestsResponse
                ] = await Promise.all([
                    api.get("/donors"),
                    api.get("/requests")
                ]);


                setDonorCount(
                    donorsResponse.data.length
                );


                setRequests(
                    requestsResponse.data
                );


            } catch (error) {

                console.error(
                    "Dashboard data error:",
                    error
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

    const pendingRequests =
        requests.filter(
            (request) =>
                request.status === "PENDING"
        ).length;


    const emergencyRequests =
        requests.filter(
            (request) =>
                request.urgency === "EMERGENCY"
        ).length;


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

                            <span></span>

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