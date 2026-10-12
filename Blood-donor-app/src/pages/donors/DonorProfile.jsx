import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "./DonorProfile.css";

const COMPATIBLE_RECIPIENTS = {
    "O-": ["All Blood Groups (Universal Donor)"],
    "O+": ["O+", "A+", "B+", "AB+"],
    "A-": ["A-", "A+", "AB-", "AB+"],
    "A+": ["A+", "AB+"],
    "B-": ["B-", "B+", "AB-", "AB+"],
    "B+": ["B+", "AB+"],
    "AB-": ["AB-", "AB+"],
    "AB+": ["AB+ Only"]
};

function DonorProfile() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [donor, setDonor] = useState(null);
    const [reliability, setReliability] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [selectedRequestId, setSelectedRequestId] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notifying, setNotifying] = useState(false);
    const [notifySuccess, setNotifySuccess] = useState("");
    const [notifyError, setNotifyError] = useState("");

    useEffect(() => {
        const fetchDonorProfileData = async () => {
            try {
                setLoading(true);
                setError("");

                const [donorRes, reliabilityRes, requestsRes] =
                    await Promise.allSettled([
                        api.get(`/donors/${id}`),
                        api.get(`/request-responses/donor/${id}/reliability`),
                        api.get("/requests/pending")
                    ]);

                if (donorRes.status === "fulfilled" && donorRes.value.data) {
                    setDonor(donorRes.value.data);
                } else {
                    setError("Unable to load donor profile.");
                    return;
                }

                if (reliabilityRes.status === "fulfilled") {
                    setReliability(reliabilityRes.value.data);
                }

                if (
                    requestsRes.status === "fulfilled" &&
                    Array.isArray(requestsRes.value.data)
                ) {
                    const allPending = requestsRes.value.data;
                    setPendingRequests(allPending);
                    if (allPending.length > 0) {
                        setSelectedRequestId(String(allPending[0].id));
                    }
                }
            } catch (err) {
                console.error(err);
                setError("Unable to load donor profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchDonorProfileData();
    }, [id]);

    // ==========================================
    // DIRECTLY NOTIFY THIS DONOR FOR AN ACTIVE REQUEST
    // ==========================================
    const handleNotifyDonor = async () => {
        if (!selectedRequestId) {
            navigate("/requests/create");
            return;
        }

        try {
            setNotifying(true);
            setNotifySuccess("");
            setNotifyError("");

            await api.post(
                `/request-responses/recommend/request/${selectedRequestId}/donor/${id}`,
                null,
                {
                    params: {
                        matchScore: 95,
                        distance: 2.5
                    }
                }
            );

            setNotifySuccess(
                `✅ Emergency alert sent to ${
                    donor?.user?.name || donor?.name || "Donor"
                } for Request #${selectedRequestId}!`
            );
        } catch (err) {
            console.error("Error notifying donor:", err);
            setNotifyError(
                err.response?.data?.message ||
                    "Unable to notify donor for this request. You may need to be the request owner."
            );
        } finally {
            setNotifying(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-state">
                <div className="profile-loading-icon">🩸</div>
                <p>Loading donor profile & AI reliability metrics...</p>
            </div>
        );
    }

    if (error || !donor) {
        return (
            <div className="profile-state">
                <div className="profile-loading-icon">😕</div>
                <h2>Donor Not Found</h2>
                <p>{error || "This donor profile is unavailable."}</p>
                <Link to="/donors" className="back-donors-button">
                    ← Back to Donors
                </Link>
            </div>
        );
    }

    const donorName = donor.user?.name || donor.name || "Blood Donor";
    const bloodGroup = donor.bloodGroup || "N/A";
    const location = donor.location || "Location unavailable";
    const phone = donor.phone || donor.user?.phone || "";
    const canDonateTo = COMPATIBLE_RECIPIENTS[bloodGroup] || [];

    // Calculate 90-day medical cooldown
    let daysSinceLastDonation = null;
    let isMedicallyEligible = true;
    if (donor.lastDonationDate) {
        const lastDate = new Date(donor.lastDonationDate);
        const diffDays = Math.floor(
            (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        daysSinceLastDonation = Math.max(0, diffDays);
        isMedicallyEligible = daysSinceLastDonation >= 90;
    }

    return (
        <div className="donor-profile-page">
            {/* HEADER */}
            <header className="profile-header">
                <Link to="/donors" className="profile-back">
                    ← Back to Donors
                </Link>
                <span>VERIFIED DONOR PROFILE</span>
            </header>

            <main className="profile-main">
                {/* PROFILE CARD */}
                <section className="profile-card">
                    <div className="profile-top">
                        <div className="profile-avatar">
                            {donorName.charAt(0).toUpperCase()}
                        </div>

                        <div className="profile-name">
                            <h1>{donorName}</h1>
                            <p>📍 {location}</p>

                            <div
                                style={{
                                    display: "flex",
                                    gap: "10px",
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    marginTop: "6px"
                                }}
                            >
                                <div className="profile-status">
                                    <span
                                        className="available-dot"
                                        style={{
                                            color: donor.available
                                                ? "#16a34a"
                                                : "#dc2626"
                                        }}
                                    >
                                        ●
                                    </span>
                                    {donor.available
                                        ? " Available to Donate"
                                        : " Currently Unavailable"}
                                </div>

                                <span
                                    style={{
                                        padding: "4px 10px",
                                        borderRadius: "999px",
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        background: isMedicallyEligible
                                            ? "#ecfdf5"
                                            : "#fffbeb",
                                        color: isMedicallyEligible
                                            ? "#047857"
                                            : "#b45309",
                                        border: isMedicallyEligible
                                            ? "1px solid #a7f3d0"
                                            : "1px solid #fde68a"
                                    }}
                                >
                                    {isMedicallyEligible
                                        ? "🩺 Medically Eligible"
                                        : "⏳ In 90-Day Cooldown"}
                                </span>
                            </div>
                        </div>

                        <div className="profile-blood">
                            <small>BLOOD GROUP</small>
                            <strong>{bloodGroup}</strong>
                        </div>
                    </div>

                    {/* DETAILS */}
                    <div className="profile-details">
                        <div className="profile-detail">
                            <span>Total Donations</span>
                            <strong>{donor.totalDonations || 0}</strong>
                        </div>

                        <div className="profile-detail">
                            <span>Verification</span>
                            <strong className="verified">
                                {donor.verified ? "✓ Verified" : "Pending"}
                            </strong>
                        </div>

                        <div className="profile-detail">
                            <span>Last Donation</span>
                            <strong>
                                {daysSinceLastDonation !== null
                                    ? `${daysSinceLastDonation} days ago`
                                    : "Ready (No cooldown)"}
                            </strong>
                        </div>
                    </div>

                    {/* QUICK CONTACT & MAP BAR */}
                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                            marginTop: "18px",
                            paddingTop: "16px",
                            borderTop: "1px solid #f1f5f9"
                        }}
                    >
                        {phone && (
                            <>
                                <a
                                    href={`tel:${phone}`}
                                    style={{
                                        background: "#2563eb",
                                        color: "#ffffff",
                                        padding: "8px 16px",
                                        borderRadius: "8px",
                                        textDecoration: "none",
                                        fontSize: "13px",
                                        fontWeight: "700"
                                    }}
                                >
                                    📞 Call Donor
                                </a>
                                <a
                                    href={`https://wa.me/${phone.replace(
                                        /[^0-9]/g,
                                        ""
                                    )}?text=${encodeURIComponent(
                                        `🚨 URGENT BLOOD NEED: Hello ${donorName}, we found your${bloodGroup} profile on SmartBlood. Are you available to donate?`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        background: "#16a34a",
                                        color: "#ffffff",
                                        padding: "8px 16px",
                                        borderRadius: "8px",
                                        textDecoration: "none",
                                        fontSize: "13px",
                                        fontWeight: "700"
                                    }}
                                >
                                    💬 WhatsApp Alert
                                </a>
                            </>
                        )}

                        {donor.location && (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    donor.location
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    background: "#fff1f2",
                                    color: "#be123c",
                                    padding: "8px 16px",
                                    borderRadius: "8px",
                                    textDecoration: "none",
                                    fontSize: "13px",
                                    fontWeight: "700"
                                }}
                            >
                                📍 View Location on Map
                            </a>
                        )}
                    </div>
                </section>

                {/* AI RELIABILITY & RESPONSE METRICS PANEL */}
                {reliability && (
                    <section
                        className="profile-panel"
                        style={{
                            marginBottom: "24px",
                            background:
                                "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                            border: "1px solid #e2e8f0"
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "10px",
                                marginBottom: "12px"
                            }}
                        >
                            <div>
                                <span
                                    style={{
                                        fontSize: "11px",
                                        fontWeight: "800",
                                        color: "#2563eb",
                                        letterSpacing: "0.06em"
                                    }}
                                >
                                    🤖 SMARTBLOOD RELIABILITY ANALYTICS
                                </span>
                                <h2 style={{ margin: "4px 0 0 0" }}>
                                    Donor Response Reliability
                                </h2>
                            </div>

                            <span
                                style={{
                                    padding: "6px 14px",
                                    borderRadius: "999px",
                                    fontWeight: "800",
                                    fontSize: "13px",
                                    background: "#eff6ff",
                                    color: "#1d4ed8"
                                }}
                            >
                                {reliability.reliabilityLevel || "EVALUATED"} •{" "}
                                {Number(
                                    reliability.reliabilityScore || 0
                                ).toFixed(0)}
                                /100
                            </span>
                        </div>

                        <p style={{ fontSize: "14px", color: "#475569" }}>
                            {reliability.explanation ||
                                "Evaluated based on historical responsiveness to blood requests."}
                        </p>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(130px, 1fr))",
                                gap: "12px",
                                marginTop: "14px"
                            }}
                        >
                            <div
                                style={{
                                    background: "#fff",
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0"
                                }}
                            >
                                <small style={{ color: "#64748b" }}>
                                    Response Rate
                                </small>
                                <strong
                                    style={{
                                        display: "block",
                                        fontSize: "18px",
                                        color: "#0f172a"
                                    }}
                                >
                                    {Number(
                                        reliability.responseRate || 0
                                    ).toFixed(0)}
                                    %
                                </strong>
                            </div>

                            <div
                                style={{
                                    background: "#fff",
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0"
                                }}
                            >
                                <small style={{ color: "#64748b" }}>
                                    Acceptance Rate
                                </small>
                                <strong
                                    style={{
                                        display: "block",
                                        fontSize: "18px",
                                        color: "#16a34a"
                                    }}
                                >
                                    {Number(
                                        reliability.acceptanceRate || 0
                                    ).toFixed(0)}
                                    %
                                </strong>
                            </div>

                            <div
                                style={{
                                    background: "#fff",
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0"
                                }}
                            >
                                <small style={{ color: "#64748b" }}>
                                    Accepted Requests
                                </small>
                                <strong
                                    style={{
                                        display: "block",
                                        fontSize: "18px",
                                        color: "#0f172a"
                                    }}
                                >
                                    {reliability.acceptedCount || 0}
                                </strong>
                            </div>

                            <div
                                style={{
                                    background: "#fff",
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0"
                                }}
                            >
                                <small style={{ color: "#64748b" }}>
                                    Total Responses
                                </small>
                                <strong
                                    style={{
                                        display: "block",
                                        fontSize: "18px",
                                        color: "#0f172a"
                                    }}
                                >
                                    {reliability.respondedCount || 0}
                                </strong>
                            </div>
                        </div>
                    </section>
                )}

                {/* CONTENT */}
                <div className="profile-grid">
                    {/* ABOUT */}
                    <section className="profile-panel">
                        <h2>About Donor & Compatibility</h2>

                        <p>
                            This donor is registered with the SmartBlood community and can be notified for compatible emergency or scheduled blood requests.
                        </p>

                        <div className="profile-info-list">
                            <div>
                                <span>Blood Group</span>
                                <strong>{bloodGroup}</strong>
                            </div>

                            <div>
                                <span>Can Donate To</span>
                                <strong>
                                    {canDonateTo.join(", ") || bloodGroup}
                                </strong>
                            </div>

                            <div>
                                <span>Location</span>
                                <strong>{location}</strong>
                            </div>

                            <div>
                                <span>Availability</span>
                                <strong>
                                    {donor.available
                                        ? "🟢 Available"
                                        : "🔴 Unavailable"}
                                </strong>
                            </div>
                        </div>
                    </section>

                    {/* DIRECT REQUEST / NOTIFY ACTION */}
                    <section className="profile-request-card">
                        <div className="request-icon">🩸</div>

                        <h2>Request Blood from {donorName}</h2>

                        <p>
                            Link an existing blood request to notify this donor immediately, or create a new request.
                        </p>

                        {notifySuccess && (
                            <div
                                style={{
                                    padding: "10px",
                                    marginBottom: "12px",
                                    borderRadius: "8px",
                                    background: "#ecfdf5",
                                    color: "#065f46",
                                    fontSize: "13px",
                                    fontWeight: "600"
                                }}
                            >
                                {notifySuccess}
                            </div>
                        )}

                        {notifyError && (
                            <div
                                style={{
                                    padding: "10px",
                                    marginBottom: "12px",
                                    borderRadius: "8px",
                                    background: "#fef2f2",
                                    color: "#991b1b",
                                    fontSize: "13px",
                                    fontWeight: "600"
                                }}
                            >
                                ⚠️ {notifyError}
                            </div>
                        )}

                        {pendingRequests.length > 0 && (
                            <div
                                style={{
                                    width: "100%",
                                    marginBottom: "12px",
                                    textAlign: "left"
                                }}
                            >
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        marginBottom: "6px",
                                        color: "#334155"
                                    }}
                                >
                                    Select Active Request to Notify:
                                </label>
                                <select
                                    value={selectedRequestId}
                                    onChange={(e) =>
                                        setSelectedRequestId(e.target.value)
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "9px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px"
                                    }}
                                >
                                    {pendingRequests.map((req) => (
                                        <option key={req.id} value={req.id}>
                                            #{req.id} • {req.bloodGroup} for{" "}
                                            {req.patientName} ({req.hospitalName})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {pendingRequests.length > 0 ? (
                            <button
                                type="button"
                                className="request-blood-button"
                                onClick={handleNotifyDonor}
                                disabled={notifying}
                            >
                                {notifying
                                    ? "Sending Alert..."
                                    : "🚨 Send Direct Blood Alert"}
                            </button>
                        ) : null}

                        <Link
                            to="/requests/create"
                            style={{
                                display: "inline-block",
                                marginTop: "10px",
                                fontSize: "13px",
                                fontWeight: "700",
                                color: "#e11d48",
                                textDecoration: "none"
                            }}
                        >
                            + Or Create a New Blood Request →
                        </Link>

                        <small style={{ display: "block", marginTop: "8px" }}>
                            The donor will receive an instant in-app notification.
                        </small>
                    </section>
                </div>

                {/* SAFETY */}
                <section className="profile-safety">
                    <span>🔒</span>
                    <div>
                        <strong>Privacy & Security Protected</strong>
                        <p>
                            Donor contact details and notifications are managed securely through JWT-verified channels.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default DonorProfile;