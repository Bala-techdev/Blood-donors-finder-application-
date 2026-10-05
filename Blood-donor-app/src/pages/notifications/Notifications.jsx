import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Notifications.css";

function Notifications() {

    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [userId, setUserId] = useState(null);

    // ==========================================
    // GET ICON BASED ON NOTIFICATION TYPE
    // ==========================================

    const getNotificationIcon = (type) => {

        switch (type) {

            case "DONOR_RECOMMENDATION":
                return "🩸";

            case "DONOR_ACCEPTED":
                return "❤️";

            case "DONOR_DECLINED":
                return "❌";

            case "REQUEST_FULFILLED":
                return "✅";

            default:
                return "🔔";
        }
    };


    // ==========================================
    // GET CSS TYPE
    // ==========================================

    const getNotificationType = (type) => {

        switch (type) {

            case "DONOR_RECOMMENDATION":
                return "recommendation";

            case "DONOR_ACCEPTED":
                return "response";

            case "DONOR_DECLINED":
                return "declined";

            case "REQUEST_FULFILLED":
                return "fulfilled";

            default:
                return "general";
        }
    };


    // ==========================================
    // FORMAT DATE/TIME
    // ==========================================

    const formatTime = (createdAt) => {

        if (!createdAt) {
            return "Recently";
        }

        const notificationDate = new Date(createdAt);

        if (Number.isNaN(notificationDate.getTime())) {
            return "Recently";
        }

        const now = new Date();

        const difference =
            Math.floor(
                (now.getTime() - notificationDate.getTime()) / 1000
            );

        if (difference < 60) {
            return "Just now";
        }

        if (difference < 3600) {

            const minutes =
                Math.floor(difference / 60);

            return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
        }

        if (difference < 86400) {

            const hours =
                Math.floor(difference / 3600);

            return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
        }

        if (difference < 604800) {

            const days =
                Math.floor(difference / 86400);

            return `${days} day${days !== 1 ? "s" : ""} ago`;
        }

        return notificationDate.toLocaleDateString();
    };


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

                    setLoading(false);

                    return;
                }


                const user =
                    JSON.parse(storedUser);


                if (!user?.id) {

                    setError(
                        "Invalid user information. Please login again."
                    );

                    setLoading(false);

                    return;
                }


                setUserId(user.id);


                // ==========================================
                // 2. GET PERSISTENT NOTIFICATIONS
                // ==========================================

                const response =
                    await api.get(
                        `/notifications/user/${user.id}`
                    );


                const backendNotifications =
                    response.data || [];


                // ==========================================
                // 3. CONVERT BACKEND DATA TO UI FORMAT
                // ==========================================

                const formattedNotifications =
                    backendNotifications.map(
                        (notification) => ({

                            id: notification.id,

                            requestId:
                                notification.requestId,

                            type:
                                getNotificationType(
                                    notification.type
                                ),

                            backendType:
                                notification.type,

                            icon:
                                getNotificationIcon(
                                    notification.type
                                ),

                            title:
                                notification.title,

                            message:
                                notification.message,

                            time:
                                formatTime(
                                    notification.createdAt
                                ),

                            unread:
                                !notification.read,

                            createdAt:
                                notification.createdAt

                        })
                    );


                setNotifications(
                    formattedNotifications
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
                        "Notification service was not found. Please make sure the backend is running."
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
    // MARK ONE NOTIFICATION AS READ
    // ==========================================

    const markAsRead = async (notificationId) => {

        try {

            await api.put(
                `/notifications/${notificationId}/read`
            );


            setNotifications(
                (currentNotifications) =>
                    currentNotifications.map(
                        (notification) =>
                            notification.id === notificationId
                                ? {
                                    ...notification,
                                    unread: false
                                }
                                : notification
                    )
            );

        } catch (error) {

            console.error(
                "Failed to mark notification as read:",
                error
            );
        }
    };


    // ==========================================
    // MARK ALL AS READ
    // ==========================================

    const markAllRead = async () => {

        if (!userId) {
            return;
        }


        try {

            await api.put(
                `/notifications/user/${userId}/read-all`
            );


            setNotifications(
                (currentNotifications) =>
                    currentNotifications.map(
                        (notification) => ({
                            ...notification,
                            unread: false
                        })
                    )
            );

        } catch (error) {

            console.error(
                "Failed to mark all notifications as read:",
                error
            );
        }
    };


    // ==========================================
    // CLEAR ALL
    // ==========================================

    const clearNotifications = async () => {

        if (!userId) {
            return;
        }


        const confirmed =
            window.confirm(
                "Are you sure you want to clear all notifications?"
            );


        if (!confirmed) {
            return;
        }


        try {

            await api.delete(
                `/notifications/user/${userId}`
            );


            setNotifications([]);

        } catch (error) {

            console.error(
                "Failed to clear notifications:",
                error
            );
        }
    };


    // ==========================================
    // REMOVE ONE NOTIFICATION
    // ==========================================

    const removeNotification = async (
        notificationId
    ) => {

        try {

            await api.delete(
                `/notifications/${notificationId}`
            );


            setNotifications(
                (currentNotifications) =>
                    currentNotifications.filter(
                        (notification) =>
                            notification.id !== notificationId
                    )
            );

        } catch (error) {

            console.error(
                "Failed to delete notification:",
                error
            );
        }
    };


    // ==========================================
    // OPEN REQUEST DETAILS
    // ==========================================

    const openRequest = async (notification) => {

        // ------------------------------------------
        // MARK AS READ
        // ------------------------------------------

        if (notification.unread) {

            await markAsRead(
                notification.id
            );
        }


        // ------------------------------------------
        // OPEN REQUEST
        // ------------------------------------------

        if (!notification.requestId) {
            return;
        }


        navigate(
            `/requests/${notification.requestId}`
        );
    };


    // ==========================================
    // UNREAD COUNT
    // ==========================================

    const unreadCount =
        notifications.filter(
            (notification) =>
                notification.unread
        ).length;


    // ==========================================
    // UI
    // ==========================================

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
                                    {unreadCount}
                                </strong>

                                <span>
                                    unread notifications
                                </span>

                            </div>


                            <div className="notification-actions">

                                <button
                                    onClick={markAllRead}
                                    disabled={unreadCount === 0}
                                >
                                    ✓ Mark all as read
                                </button>


                                <button
                                    onClick={clearNotifications}
                                    disabled={
                                        notifications.length === 0
                                    }
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
                                            cursor:
                                                notification.requestId
                                                    ? "pointer"
                                                    : "default"
                                        }}
                                    >


                                        {/* ==========================================
                                            ICON
                                        ========================================== */}

                                        <div
                                            className={
                                                `notification-icon ${notification.type}`
                                            }
                                        >
                                            {notification.icon}
                                        </div>


                                        {/* ==========================================
                                            CONTENT
                                        ========================================== */}

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


                                        {/* ==========================================
                                            REMOVE BUTTON
                                        ========================================== */}

                                        <button
                                            className="notification-menu"

                                            onClick={(event) => {

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