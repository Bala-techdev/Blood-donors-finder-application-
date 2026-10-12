import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Notifications.css";

function Notifications() {
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionFeedback, setActionFeedback] = useState("");
    const [respondingRequestId, setRespondingRequestId] = useState(null);
    const [activeFilter, setActiveFilter] = useState("ALL");

    // ==========================================
    // GET ICON BASED ON NOTIFICATION TYPE
    // ==========================================
    const getNotificationIcon = (type) => {
        switch (type) {
            case "DONOR_RECOMMENDATION":
                return "🩸";
            case "EMERGENCY_ESCALATION":
                return "🚨";
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
            case "EMERGENCY_ESCALATION":
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
        if (!createdAt) return "Recently";

        const notificationDate = new Date(createdAt);
        if (Number.isNaN(notificationDate.getTime())) return "Recently";

        const now = new Date();
        const difference = Math.floor(
            (now.getTime() - notificationDate.getTime()) / 1000
        );

        if (difference < 60) return "Just now";

        if (difference < 3600) {
            const minutes = Math.floor(difference / 60);
            return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
        }

        if (difference < 86400) {
            const hours = Math.floor(difference / 3600);
            return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
        }

        if (difference < 604800) {
            const days = Math.floor(difference / 86400);
            return `${days} day${days !== 1 ? "s" : ""} ago`;
        }

        return notificationDate.toLocaleDateString();
    };

    // ==========================================
    // LOAD NOTIFICATIONS
    // ==========================================
    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const storedToken = localStorage.getItem("bloodDonorToken");
            const storedUser = localStorage.getItem("bloodDonorUser");

            if (!storedToken || !storedUser) {
                setError("Please login to view notifications.");
                setLoading(false);
                return;
            }

            try {
                JSON.parse(storedUser);
            } catch (e) {
                console.error("Invalid stored user information:", e);
                setError("Invalid user information. Please login again.");
                setLoading(false);
                return;
            }

            const response = await api.get("/notifications/me/page", {
                params: {
                    page: 0,
                    size: 30
                }
            });

            const backendNotifications = response.data?.content || [];

            const formattedNotifications = backendNotifications.map(
                (notification) => ({
                    id: notification.id,
                    requestId: notification.requestId,
                    type: getNotificationType(notification.type),
                    backendType: notification.type,
                    icon: getNotificationIcon(notification.type),
                    title: notification.title,
                    message: notification.message,
                    time: formatTime(notification.createdAt),
                    unread: !notification.read,
                    createdAt: notification.createdAt
                })
            );

            setNotifications(formattedNotifications);
        } catch (err) {
            console.error("Notification error:", err);

            if (err.response?.status === 401) {
                setError("Your session has expired. Please login again.");
            } else if (err.response?.status === 404) {
                setError(
                    "Notification service was not found. Please make sure the backend is running."
                );
            } else {
                setError("Unable to load notifications.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    // ==========================================
    // MARK ONE NOTIFICATION AS READ
    // ==========================================
    const markAsRead = async (notificationId) => {
        try {
            await api.put(`/notifications/${notificationId}/read`);
            setNotifications((currentNotifications) =>
                currentNotifications.map((notification) =>
                    notification.id === notificationId
                        ? { ...notification, unread: false }
                        : notification
                )
            );
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    };

    // ==========================================
    // MARK ALL AS READ
    // ==========================================
    const markAllRead = async () => {
        try {
            await api.put("/notifications/me/read-all");
            setNotifications((currentNotifications) =>
                currentNotifications.map((notification) => ({
                    ...notification,
                    unread: false
                }))
            );
            setActionFeedback("All notifications marked as read.");
        } catch (err) {
            console.error("Failed to mark all notifications as read:", err);
        }
    };

    // ==========================================
    // CLEAR ALL
    // ==========================================
    const clearNotifications = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to clear all notifications?"
        );
        if (!confirmed) return;

        try {
            await api.delete("/notifications/me");
            setNotifications([]);
            setActionFeedback("All notifications cleared.");
        } catch (err) {
            console.error("Failed to clear notifications:", err);
        }
    };

    // ==========================================
    // REMOVE ONE NOTIFICATION
    // ==========================================
    const removeNotification = async (notificationId) => {
        try {
            await api.delete(`/notifications/${notificationId}`);
            setNotifications((currentNotifications) =>
                currentNotifications.filter(
                    (notification) => notification.id !== notificationId
                )
            );
        } catch (err) {
            console.error("Failed to delete notification:", err);
        }
    };

    // ==========================================
    // QUICK ACCEPT DIRECTLY FROM NOTIFICATION
    // ==========================================
    const handleQuickAccept = async (event, notification) => {
        event.stopPropagation();
        if (!notification.requestId) return;

        try {
            setRespondingRequestId(notification.requestId);
            setActionFeedback("");
            await api.post(
                `/request-responses/request/${notification.requestId}/respond`
            );
            if (notification.unread) {
                await markAsRead(notification.id);
            }
            setActionFeedback(
                `❤️ Thank you! You have accepted Blood Request #${notification.requestId}.`
            );
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                "Unable to respond right now. Opening request details...";
            setActionFeedback(`ℹ️ ${msg}`);
        } finally {
            setRespondingRequestId(null);
        }
    };

    // ==========================================
    // OPEN REQUEST DETAILS
    // ==========================================
    const openRequest = async (notification) => {
        if (notification.unread) {
            await markAsRead(notification.id);
        }

        if (!notification.requestId) return;
        navigate(`/requests/${notification.requestId}`);
    };

    const unreadCount = notifications.filter((n) => n.unread).length;

    const filteredNotifications = notifications.filter((n) => {
        if (activeFilter === "UNREAD") return n.unread;
        if (activeFilter === "RECOMMENDATIONS") {
            return (
                n.backendType === "DONOR_RECOMMENDATION" ||
                n.backendType === "EMERGENCY_ESCALATION"
            );
        }
        if (activeFilter === "RESPONSES") {
            return (
                n.backendType === "DONOR_ACCEPTED" ||
                n.backendType === "DONOR_DECLINED" ||
                n.backendType === "REQUEST_FULFILLED"
            );
        }
        return true;
    });

    return (
        <div className="notifications-page">
            {/* ==========================================
                HEADER
            ========================================== */}
            <header className="notifications-header">
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "10px"
                    }}
                >
                    <Link to="/dashboard" className="notifications-back">
                        ← Dashboard
                    </Link>

                    <button
                        type="button"
                        onClick={loadNotifications}
                        style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            padding: "7px 14px",
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: "pointer",
                            color: "#334155"
                        }}
                    >
                        🔄 Refresh
                    </button>
                </div>

                <div className="notifications-title">
                    <span>REAL-TIME ALERTS & AI OUTREACH</span>
                    <h1>Notifications Center</h1>
                    <p>
                        Stay updated on AI donor recommendations, emergency escalations, and donor responses.
                    </p>
                </div>
            </header>

            {/* ==========================================
                MAIN
            ========================================== */}
            <main className="notifications-main">
                {/* ACTION FEEDBACK BANNER */}
                {actionFeedback && (
                    <div
                        style={{
                            padding: "12px 16px",
                            marginBottom: "16px",
                            borderRadius: "10px",
                            background: "#ecfdf5",
                            border: "1px solid #a7f3d0",
                            color: "#065f46",
                            fontWeight: "600",
                            fontSize: "14px"
                        }}
                    >
                        {actionFeedback}
                    </div>
                )}

                {/* ==========================================
                    FILTER TABS & TOOLBAR
                ========================================== */}
                {!loading && !error && (
                    <>
                        <div
                            style={{
                                display: "flex",
                                gap: "8px",
                                flexWrap: "wrap",
                                marginBottom: "14px"
                            }}
                        >
                            {[
                                { key: "ALL", label: `All (${notifications.length})` },
                                { key: "UNREAD", label: `Unread (${unreadCount})` },
                                { key: "RECOMMENDATIONS", label: "🩸 AI Matches & Alerts" },
                                { key: "RESPONSES", label: "❤️ Donor Responses" }
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveFilter(tab.key)}
                                    style={{
                                        padding: "7px 14px",
                                        borderRadius: "999px",
                                        border:
                                            activeFilter === tab.key
                                                ? "1px solid #e11d48"
                                                : "1px solid #e2e8f0",
                                        background:
                                            activeFilter === tab.key
                                                ? "#ffe4e6"
                                                : "#ffffff",
                                        color:
                                            activeFilter === tab.key
                                                ? "#be123c"
                                                : "#475569",
                                        fontWeight: "700",
                                        fontSize: "12px",
                                        cursor: "pointer"
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="notifications-toolbar">
                            <div>
                                <strong>{unreadCount}</strong>{" "}
                                <span>unread notifications</span>
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
                                    disabled={notifications.length === 0}
                                >
                                    Clear all
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ==========================================
                    LOADING
                ========================================== */}
                {loading && (
                    <div className="notification-state">
                        <div>🔔</div>
                        <p>Loading notifications...</p>
                    </div>
                )}

                {/* ==========================================
                    ERROR
                ========================================== */}
                {!loading && error && (
                    <div className="notification-state">
                        <div>⚠️</div>
                        <h2>Unable to Load</h2>
                        <p>{error}</p>
                    </div>
                )}

                {/* ==========================================
                    EMPTY
                ========================================== */}
                {!loading && !error && filteredNotifications.length === 0 && (
                    <div className="notification-state">
                        <div>🔔</div>
                        <h2>You're all caught up</h2>
                        <p>
                            No notifications match this filter right now.
                        </p>
                    </div>
                )}

                {/* ==========================================
                    NOTIFICATIONS LIST
                ========================================== */}
                {!loading && !error && filteredNotifications.length > 0 && (
                    <div className="notifications-list">
                        {filteredNotifications.map((notification) => {
                            const isRecommendation =
                                notification.backendType ===
                                    "DONOR_RECOMMENDATION" ||
                                notification.backendType ===
                                    "EMERGENCY_ESCALATION";

                            return (
                                <div
                                    key={notification.id}
                                    className={`notification-card ${
                                        notification.unread ? "unread" : ""
                                    }`}
                                    onClick={() => openRequest(notification)}
                                    style={{
                                        cursor: notification.requestId
                                            ? "pointer"
                                            : "default"
                                    }}
                                >
                                    {/* ICON */}
                                    <div
                                        className={`notification-icon ${notification.type}`}
                                    >
                                        {notification.icon}
                                    </div>

                                    {/* CONTENT */}
                                    <div className="notification-content">
                                        <div className="notification-title-row">
                                            <h3>{notification.title}</h3>
                                            {notification.unread && (
                                                <span className="unread-dot"></span>
                                            )}
                                        </div>

                                        <p>{notification.message}</p>

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                flexWrap: "wrap",
                                                gap: "10px",
                                                marginTop: "8px"
                                            }}
                                        >
                                            <small>{notification.time}</small>

                                            {/* QUICK ACTION BUTTONS FOR DEMO */}
                                            {notification.requestId && (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: "8px",
                                                        flexWrap: "wrap"
                                                    }}
                                                >
                                                    {isRecommendation && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) =>
                                                                handleQuickAccept(
                                                                    e,
                                                                    notification
                                                                )
                                                            }
                                                            disabled={
                                                                respondingRequestId ===
                                                                notification.requestId
                                                            }
                                                            style={{
                                                                background:
                                                                    "#e11d48",
                                                                color: "#fff",
                                                                border: "none",
                                                                padding:
                                                                    "5px 12px",
                                                                borderRadius:
                                                                    "6px",
                                                                fontSize:
                                                                    "12px",
                                                                fontWeight:
                                                                    "700",
                                                                cursor: "pointer"
                                                            }}
                                                        >
                                                            {respondingRequestId ===
                                                            notification.requestId
                                                                ? "Accepting..."
                                                                : "❤️ Accept & Help"}
                                                        </button>
                                                    )}

                                                    <span
                                                        style={{
                                                            fontSize: "12px",
                                                            fontWeight: "700",
                                                            color: "#2563eb",
                                                            padding: "5px 8px"
                                                        }}
                                                    >
                                                        View Request #
                                                        {notification.requestId}{" "}
                                                        →
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* REMOVE BUTTON */}
                                    <button
                                        className="notification-menu"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            removeNotification(notification.id);
                                        }}
                                        title="Dismiss notification"
                                    >
                                        ×
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}

export default Notifications;