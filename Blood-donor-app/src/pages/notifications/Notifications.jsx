import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./Notifications.css";

function Notifications() {

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const loadNotifications = async () => {

            try {

                const response = await api.get("/requests");

                const requests = response.data || [];

                const generatedNotifications = [];

                requests.forEach((request) => {

                    if (request.urgency === "EMERGENCY") {

                        generatedNotifications.push({
                            id: `emergency-${request.id}`,
                            type: "emergency",
                            icon: "🚨",
                            title: "Emergency Blood Request",
                            message:
                                `${request.bloodGroup} blood is urgently required at ${request.hospitalName}.`,
                            time: "Recent",
                            unread: true
                        });

                    } else {

                        generatedNotifications.push({
                            id: `request-${request.id}`,
                            type: "request",
                            icon: "🩸",
                            title: "New Blood Request",
                            message:
                                `${request.bloodGroup} blood requested for ${request.patientName}.`,
                            time: "Recent",
                            unread: false
                        });

                    }


                    if (
                        request.status === "DONOR_RESPONDED"
                    ) {

                        generatedNotifications.push({
                            id: `response-${request.id}`,
                            type: "response",
                            icon: "❤️",
                            title: "Donor Response Received",
                            message:
                                `A donor has responded to request #${request.id}.`,
                            time: "Recent",
                            unread: true
                        });

                    }

                });


                setNotifications(
                    generatedNotifications
                );

            } catch (error) {

                console.error(
                    "Notification error:",
                    error
                );

            } finally {

                setLoading(false);

            }

        };

        loadNotifications();

    }, []);


    const markAllRead = () => {

        setNotifications(
            notifications.map((notification) => ({
                ...notification,
                unread: false
            }))
        );

    };


    const clearNotifications = () => {

        setNotifications([]);

    };


    return (
        <div className="notifications-page">

            {/* HEADER */}

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
                        Stay updated about blood requests and donor activity.
                    </p>

                </div>

            </header>


            {/* MAIN */}

            <main className="notifications-main">

                <div className="notifications-toolbar">

                    <div>

                        <strong>
                            {notifications.filter(
                                (notification) =>
                                    notification.unread
                            ).length}
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


                {/* LOADING */}

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


                {/* EMPTY */}

                {!loading &&
                    notifications.length === 0 && (

                        <div className="notification-state">

                            <div>
                                🔔
                            </div>

                            <h2>
                                You're all caught up
                            </h2>

                            <p>
                                No new notifications right now.
                            </p>

                        </div>

                    )}


                {/* NOTIFICATIONS */}

                {!loading &&
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
                                    >

                                        <div
                                            className={`notification-icon ${notification.type}`}
                                        >
                                            {notification.icon}
                                        </div>


                                        <div className="notification-content">

                                            <div className="notification-title-row">

                                                <h3>
                                                    {notification.title}
                                                </h3>

                                                {notification.unread && (
                                                    <span className="unread-dot"></span>
                                                )}

                                            </div>

                                            <p>
                                                {notification.message}
                                            </p>

                                            <small>
                                                {notification.time}
                                            </small>

                                        </div>


                                        <button
                                            className="notification-menu"
                                            onClick={() =>
                                                setNotifications(
                                                    notifications.filter(
                                                        (item) =>
                                                            item.id !==
                                                            notification.id
                                                    )
                                                )
                                            }
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