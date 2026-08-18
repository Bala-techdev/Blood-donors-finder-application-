import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./BloodRequests.css";

function BloodRequests() {

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/requests");

            setRequests(response.data);

        } catch (err) {
            console.error(err);
            setError("Unable to load blood requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const getUrgencyClass = (urgency) => {

        if (urgency === "EMERGENCY") {
            return "urgency emergency";
        }

        if (urgency === "URGENT") {
            return "urgency urgent";
        }

        return "urgency normal";
    };

    const getStatusClass = (status) => {

        if (status === "FULFILLED") {
            return "request-status fulfilled";
        }

        if (status === "CANCELLED") {
            return "request-status cancelled";
        }

        return "request-status pending";
    };

    const handleHelp = async (requestId) => {

    const confirmed = window.confirm(
        "Are you available to donate blood for this request?"
    );

    if (!confirmed) {
        return;
    }

    try {

        await api.put(
            `/requests/${requestId}/status`,
            null,
            {
                params: {
                    status: "DONOR_RESPONDED"
                }
            }
        );

        alert(
            "Thank you! Your willingness to donate has been recorded."
        );

        fetchRequests();

    } catch (err) {

        console.error(err);

        alert(
            "Unable to respond to this request."
        );
    }
};

    return (
        <div className="blood-requests-page">

            {/* HEADER */}

            <header className="requests-page-header">

                <div className="requests-header-top">

                    <Link
                        to="/dashboard"
                        className="requests-back"
                    >
                        ← Dashboard
                    </Link>

                    <Link
                        to="/requests/create"
                        className="create-request-button"
                    >
                        + Create Request
                    </Link>

                </div>

                <div className="requests-title">

                    <span>
                        BLOOD REQUESTS
                    </span>

                    <h1>
                        People Who Need Blood
                    </h1>

                    <p>
                        Find active blood requests and help save lives.
                    </p>

                </div>

            </header>


            {/* MAIN */}

            <main className="blood-requests-main">

                {/* SUMMARY */}

                <div className="request-summary">

                    <div className="summary-card">

                        <div className="summary-icon red">
                            🩸
                        </div>

                        <div>
                            <span>Total Requests</span>
                            <strong>{requests.length}</strong>
                        </div>

                    </div>


                    <div className="summary-card">

                        <div className="summary-icon orange">
                            🚨
                        </div>

                        <div>
                            <span>Emergency</span>

                            <strong>
                                {
                                    requests.filter(
                                        (request) =>
                                            request.urgency === "EMERGENCY"
                                    ).length
                                }
                            </strong>

                        </div>

                    </div>


                    <div className="summary-card">

                        <div className="summary-icon green">
                            ✓
                        </div>

                        <div>
                            <span>Pending</span>

                            <strong>
                                {
                                    requests.filter(
                                        (request) =>
                                            request.status === "PENDING"
                                    ).length
                                }
                            </strong>

                        </div>

                    </div>

                </div>


                {/* LOADING */}

                {loading && (
                    <div className="requests-state">
                        <div>🩸</div>
                        <p>Loading blood requests...</p>
                    </div>
                )}


                {/* ERROR */}

                {!loading && error && (
                    <div className="requests-state error">
                        <div>⚠️</div>
                        <p>{error}</p>

                        <button onClick={fetchRequests}>
                            Try Again
                        </button>
                    </div>
                )}


                {/* EMPTY */}

                {!loading &&
                    !error &&
                    requests.length === 0 && (

                        <div className="requests-state">

                            <div>🩸</div>

                            <h2>
                                No Blood Requests
                            </h2>

                            <p>
                                There are currently no blood
                                requests available.
                            </p>

                            <Link
                                to="/requests/create"
                                className="empty-create-button"
                            >
                                Create Blood Request
                            </Link>

                        </div>
                    )}


                {/* REQUESTS */}

                {!loading &&
                    !error &&
                    requests.length > 0 && (

                        <div className="requests-list">

                            {requests.map((request) => (

                                <div
                                    className="blood-request-card"
                                    key={request.id}
                                >

                                    {/* TOP */}

                                    <div className="request-card-top">

                                        <div className="request-blood-group">

                                            <span>
                                                BLOOD
                                            </span>

                                            <strong>
                                                {request.bloodGroup}
                                            </strong>

                                        </div>


                                        <div className="request-card-title">

                                            <h2>
                                                {request.patientName}
                                            </h2>

                                            <p>
                                                🏥 {request.hospitalName}
                                            </p>

                                            <small>
                                                📍 {request.location}
                                            </small>

                                        </div>


                                        <div className="request-card-badges">

                                            <span
                                                className={getUrgencyClass(
                                                    request.urgency
                                                )}
                                            >
                                                {request.urgency}
                                            </span>

                                            <span
                                                className={getStatusClass(
                                                    request.status
                                                )}
                                            >
                                                {request.status}
                                            </span>

                                        </div>

                                    </div>


                                    {/* DETAILS */}

                                    <div className="request-card-details">

                                        <div>
                                            <span>
                                                Units Required
                                            </span>

                                            <strong>
                                                {request.units} Units
                                            </strong>
                                        </div>


                                        <div>
                                            <span>
                                                Required Date
                                            </span>

                                            <strong>
                                                {request.requiredDate}
                                            </strong>
                                        </div>


                                        <div>
                                            <span>
                                                Request ID
                                            </span>

                                            <strong>
                                                #{request.id}
                                            </strong>
                                        </div>

                                    </div>


                                    {/* DESCRIPTION */}

                                    {request.description && (
                                        <div className="request-description">

                                            <span>
                                                Description
                                            </span>

                                            <p>
                                                {request.description}
                                            </p>

                                        </div>
                                    )}


                                    {/* ACTION */}

                                    <div className="request-card-bottom">

                                        <span className="request-date">
                                            Created recently
                                        </span>

                                       <button
                                            className="help-button"
                                            onClick={() => handleHelp(request.id)}
                                        >
                                            🩸 I Can Help
                                        </button>

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