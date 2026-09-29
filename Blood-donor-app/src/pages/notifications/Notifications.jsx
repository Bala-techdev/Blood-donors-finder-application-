import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Notifications.css";

function Notifications() {

    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // ==========================================
    // LOAD NOTIFICATIONS
    // ==========================================

    useEffect(() => {

        const loadNotifications = async () => {

            try {

                setLoading(true);
                setError("");


                // ==========================================
                // 1. GET LOGGED-IN USER
                // ==========================================

                const storedUser =
                    localStorage.getItem("bloodDonorUser");


                if (!storedUser) {

                    setError(
                        "Please login to view notifications."
                    );

                    return;
                }


                const user = JSON.parse(storedUser);


                // ==========================================
                // 2. GET DONOR PROFILE USING USER ID
                // ==========================================

                const donorResponse =
                    await api.get(
                        `/donors/user/${user.id}`
                    );


                const donor = donorResponse.data;


                // ==========================================
                // 3. GET DONOR RESPONSES
                // ==========================================

                const response =
                    await api.get(
                        `/request-responses/donor/${donor.id}`
                    );


                const donorResponses =
                    response.data || [];


                const generatedNotifications = [];


                // ==========================================
                // 4. CREATE NOTIFICATIONS
                // ==========================================

                donorResponses.forEach((item) => {

                    const request = item.bloodRequest;


                    // Safety check
                    if (!request) {
                        return;
                    }


                    // ==========================================
                    // AI RECOMMENDATION
                    // ==========================================

                    if (item.response === "PENDING") {

                        generatedNotifications.push({

                            id: `recommendation-${item.id}`,

                            requestId: request.id,

                            type: "recommendation",

                            icon: "🩸",

                            title:
                                "Blood Request Recommended",

                            message:
                                `${request.bloodGroup} blood is required for ${request.patientName} at ${request.hospitalName}.`,

                            time: "New",

                            unread: true

                        });

                    }


                    // ==========================================
                    // DONOR ACCEPTED
                    // ==========================================

                    if (item.response === "ACCEPTED") {

                        generatedNotifications.push({

                            id: `accepted-${item.id}`,

                            // IMPORTANT
                            requestId: request.id,

                            type: "response",

                            icon: "❤️",

                            title:
                                "You Accepted a Blood Request",

                            message:
                                `You accepted the request for ${request.patientName} at ${request.hospitalName}.`,

                            time:
                                "Recent",

                            unread:
                                false

                        });

                    }


                    // ==========================================
                    // DONOR DECLINED
                    // ==========================================

                    if (item.response === "DECLINED") {

                        generatedNotifications.push({

                            id: `declined-${item.id}`,

                            // IMPORTANT
                            requestId: request.id,

                            type: "declined",

                            icon: "❌",

                            title:
                                "Blood Request Declined",

                            message:
                                `You declined the blood request for ${request.patientName}.`,

                            time:
                                "Recent",

                            unread:
                                false

                        });

                    }

                });


                // ==========================================
                // 5. SAVE NOTIFICATIONS
                // ==========================================

                setNotifications(
                    generatedNotifications
                );


            } catch (error) {

                console.error(
                    "Notification error:",
                    error
                );


                if (
                    error.response?.status === 404
                ) {

                    setError(
                        "Donor profile not found. Please complete your donor profile first."
                    );

                } else {

                    setError(
                        "Unable to load notifications."
                    );

                }

            } finally {

                setLoading(false);

            }

        };


        loadNotifications();

    }, []);


    // ==========================================
    // MARK ALL AS READ
    // ==========================================

    const markAllRead = () => {

        setNotifications(

            notifications.map(
                (notification) => ({

                    ...notification,

                    unread: false

                })
            )

        );

    };


    // ==========================================
    // CLEAR ALL
    // ==========================================

    const clearNotifications = () => {

        setNotifications([]);

    };


    // ==========================================
    // REMOVE ONE NOTIFICATION
    // ==========================================

    const removeNotification = (notificationId) => {

        setNotifications(

            notifications.filter(
                (item) =>
                    item.id !== notificationId
            )

        );

    };


    // ==========================================
    // OPEN REQUEST DETAILS
    // ==========================================

    const openRequest = (notification) => {

        if (!notification.requestId) {
            return;
        }


        // Mark clicked notification as read
        setNotifications((currentNotifications) =>
            currentNotifications.map((item) =>

                item.id === notification.id

                    ? {
                        ...item,
                        unread: false
                    }

                    : item
            )
        );


        navigate(
            `/requests/${notification.requestId}`
        );

    };


    return (

        <div className="notifications-page">


            {/* ==========================================
                HEADER
            ========================================== */}

            <header className="notifications-header">

                <Link
                    to="/dashboard"
                    className="notifications-back"
                >
                    ← Dashboard
                </Link>


                <div className="notifications-title">

                    <span>
                        UPDATES
                    </span>

                    <h1>
                        Notifications
                    </h1>

                    <p>
                        Stay updated about your blood donation activity.
                    </p>

                </div>

            </header>


            {/* ==========================================
                MAIN
            ========================================== */}

            <main className="notifications-main">


                {/* ==========================================
                    TOOLBAR
                ========================================== */}

                {!loading &&
                    !error && (

                        <div className="notifications-toolbar">

                            <div>

                                <strong>

                                    {
                                        notifications.filter(
                                            (notification) =>
                                                notification.unread
                                        ).length
                                    }

                                </strong>

                                <span>
                                    unread notifications
                                </span>

                            </div>


                            <div className="notification-actions">

                                <button
                                    onClick={markAllRead}
                                >
                                    ✓ Mark all as read
                                </button>


                                <button
                                    onClick={clearNotifications}
                                >
                                    Clear all
                                </button>

                            </div>

                        </div>

                    )}


                {/* ==========================================
                    LOADING
                ========================================== */}

                {loading && (

                    <div className="notification-state">

                        <div>
                            🔔
                        </div>

                        <p>
                            Loading notifications...
                        </p>

                    </div>

                )}


                {/* ==========================================
                    ERROR
                ========================================== */}

                {!loading &&
                    error && (

                        <div className="notification-state">

                            <div>
                                ⚠️
                            </div>

                            <h2>
                                Unable to Load
                            </h2>

                            <p>
                                {error}
                            </p>

                        </div>

                    )}


                {/* ==========================================
                    EMPTY
                ========================================== */}

                {!loading &&
                    !error &&
                    notifications.length === 0 && (

                        <div className="notification-state">

                            <div>
                                🔔
                            </div>

                            <h2>
                                You're all caught up
                            </h2>

                            <p>
                                No blood request notifications right now.
                            </p>

                        </div>

                    )}


                {/* ==========================================
                    NOTIFICATIONS
                ========================================== */}

                {!loading &&
                    !error &&
                    notifications.length > 0 && (

                        <div className="notifications-list">


                            {notifications.map(
                                (notification) => (

                                    <div
                                        key={notification.id}

                                        className={`notification-card ${
                                            notification.unread
                                                ? "unread"
                                                : ""
                                        }`}

                                        onClick={() =>
                                            openRequest(
                                                notification
                                            )
                                        }

                                        style={{
                                            cursor: notification.requestId
                                                ? "pointer"
                                                : "default"
                                        }}
                                    >


                                        {/* ICON */}

                                        <div
                                            className={
                                                `notification-icon ${notification.type}`
                                            }
                                        >

                                            {notification.icon}

                                        </div>


                                        {/* CONTENT */}

                                        <div className="notification-content">


                                            <div className="notification-title-row">

                                                <h3>
                                                    {notification.title}
                                                </h3>


                                                {notification.unread && (

                                                    <span
                                                        className="unread-dot"
                                                    >
                                                    </span>

                                                )}

                                            </div>


                                            <p>
                                                {notification.message}
                                            </p>


                                            <small>
                                                {notification.time}
                                            </small>


                                        </div>


                                        {/* REMOVE BUTTON */}

                                        <button

                                            className="notification-menu"

                                            onClick={(event) => {

                                                // Prevent opening request
                                                event.stopPropagation();

                                                removeNotification(
                                                    notification.id
                                                );

                                            }}

                                        >
                                            ×
                                        </button>


                                    </div>

                                )

                            )}


                        </div>

                    )}


            </main>


        </div>

    );

}


export default Notifications;