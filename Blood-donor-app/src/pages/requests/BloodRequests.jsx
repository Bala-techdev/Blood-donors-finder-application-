import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./BloodRequests.css";

function BloodRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [respondingId, setRespondingId] = useState(null);

  // This page is the donor-facing list: show requests still accepting help.
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
    const confirmed = window.confirm(
      "Are you available to donate blood for this request?"
    );
    if (!confirmed) return;

    const storedUser = localStorage.getItem("bloodDonorUser");
    if (!storedUser) {
      window.alert("Please login before responding to a blood request.");
      return;
    }

    let user;
    try {
      user = JSON.parse(storedUser);
    } catch {
      window.alert("Your saved login information is invalid. Please log in again.");
      return;
    }

    if (!user?.id) {
      window.alert("Unable to identify the logged-in user. Please log in again.");
      return;
    }

    try {
      setRespondingId(requestId);
      await api.post(`/request-responses/request/${requestId}/respond`);
      window.alert(
        "Thank you! Your willingness to donate has been recorded. The request remains open until the requester confirms fulfillment."
      );
      // Refresh the list. The request should remain visible while its status
      // is PENDING; the backend prevents this donor from responding twice.
      await fetchRequests();
    } catch (err) {
      console.error("Unable to respond to request:", err);
      window.alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to respond to this request. Please try again."
      );
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div className="blood-requests-page">
      <header className="requests-page-header">
        <div className="requests-header-top">
          <Link to="/dashboard" className="requests-back">← Dashboard</Link>
          <Link to="/requests/create" className="create-request-button">
            + Create Request
          </Link>
        </div>
        <div className="requests-title">
          <span>BLOOD REQUESTS</span>
          <h1>People Who Need Blood</h1>
          <p>Find active blood requests and help save lives.</p>
        </div>
      </header>

      <main className="blood-requests-main">
        <div className="request-summary">
          <div className="summary-card">
            <div className="summary-icon red">🩸</div>
            <div><span>Active Requests</span><strong>{requests.length}</strong></div>
          </div>
          <div className="summary-card">
            <div className="summary-icon orange">🚨</div>
            <div><span>Emergency</span><strong>{requests.filter((r) => r.urgency === "EMERGENCY").length}</strong></div>
          </div>
          <div className="summary-card">
            <div className="summary-icon green">✓</div>
            <div><span>Pending</span><strong>{requests.filter((r) => r.status === "PENDING").length}</strong></div>
          </div>
        </div>

        {loading && (
          <div className="requests-state"><div>🩸</div><p>Loading blood requests...</p></div>
        )}

        {!loading && error && (
          <div className="requests-state error">
            <div>⚠️</div><p>{error}</p>
            <button onClick={fetchRequests}>Try Again</button>
          </div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="requests-state">
            <div>🩸</div><h2>No Blood Requests</h2>
            <p>There are currently no pending requests available.</p>
            <Link to="/requests/create" className="empty-create-button">Create Blood Request</Link>
          </div>
        )}

        {!loading && !error && requests.length > 0 && (
          <div className="requests-list">
            {requests.map((request) => (
              <div className="blood-request-card" key={request.id}>
                <div className="request-card-top">
                  <div className="request-blood-group">
                    <span>BLOOD</span><strong>{request.bloodGroup || "N/A"}</strong>
                  </div>
                  <div className="request-card-title">
                    <h2>{request.patientName || "Patient"}</h2>
                    <p>🏥 {request.hospitalName || "Hospital not specified"}</p>
                    <small>📍 {request.location || "Location not specified"}</small>
                  </div>
                  <div className="request-card-badges">
                    <span className={getUrgencyClass(request.urgency)}>{request.urgency || "NORMAL"}</span>
                    <span className={getStatusClass(request.status)}>{request.status || "PENDING"}</span>
                  </div>
                </div>

                <div className="request-card-details">
                  <div><span>Units Required</span><strong>{request.units ?? 1} Units</strong></div>
                  <div><span>Required Date</span><strong>{request.requiredDate || "Not specified"}</strong></div>
                  <div><span>Request ID</span><strong>#{request.id}</strong></div>
                </div>

                {request.description && (
                  <div className="request-description">
                    <span>Description</span><p>{request.description}</p>
                  </div>
                )}

                <div className="request-card-bottom">
                  <span className="request-date">Created recently</span>
                  <div className="request-actions">
                    <Link to={`/requests/${request.id}`} className="view-details-button">View Details</Link>
                    <button
                      className="help-button"
                      onClick={() => handleHelp(request.id)}
                      disabled={respondingId === request.id}
                    >
                      {respondingId === request.id ? "Submitting..." : "🩸 I Can Help"}
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
