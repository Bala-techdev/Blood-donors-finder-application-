import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./CreateRequest.css";

const COMPATIBLE_DONORS = {
    "A+": ["A+", "A-", "O+", "O-"],
    "A-": ["A-", "O-"],
    "B+": ["B+", "B-", "O+", "O-"],
    "B-": ["B-", "O-"],
    "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+ (Universal Recipient)"],
    "AB-": ["AB-", "A-", "B-", "O-"],
    "O+": ["O+", "O-"],
    "O-": ["O- (Universal Donor Only)"]
};

function CreateRequest() {
    const navigate = useNavigate();

    const now = new Date();
    const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");

    const [formData, setFormData] = useState({
        patientName: "",
        bloodGroup: "",
        units: 1,
        hospitalName: "",
        location: "",
        urgency: "NORMAL",
        requiredDate: today,
        description: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    /* ==========================================
       1-CLICK PRESENTATION DEMO PRESETS
    ========================================== */
    const fillEmergencyPreset = () => {
        setError("");
        setFormData({
            patientName: "Arun Kumar",
            bloodGroup: "O-",
            units: 3,
            hospitalName: "Apollo Speciality Hospital",
            location: "Chennai",
            urgency: "EMERGENCY",
            requiredDate: today,
            description:
                "Critical trauma surgery in ICU. Immediate O-Negative blood units required urgently."
        });
    };

    const fillNormalPreset = () => {
        setError("");
        setFormData({
            patientName: "Priya Sharma",
            bloodGroup: "B+",
            units: 2,
            hospitalName: "Government General Hospital",
            location: "Coimbatore",
            urgency: "URGENT",
            requiredDate: today,
            description:
                "Scheduled cardiac procedure. Looking for verified B+ or O+ donors nearby."
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        const units = Number(formData.units);
        const trimmedPatientName = formData.patientName.trim();
        const trimmedHospitalName = formData.hospitalName.trim();
        const trimmedLocation = formData.location.trim();

        if (!trimmedPatientName) {
            setError("Patient name is required.");
            return;
        }

        if (!formData.bloodGroup) {
            setError("Please select a blood group.");
            return;
        }

        if (!Number.isInteger(units) || units < 1 || units > 10) {
            setError("Units must be between 1 and 10.");
            return;
        }

        if (!trimmedHospitalName || !trimmedLocation) {
            setError("Hospital name and location are required.");
            return;
        }

        if (!formData.requiredDate || formData.requiredDate < today) {
            setError("Required date must be today or a future date.");
            return;
        }

        try {
            setLoading(true);

            if (!localStorage.getItem("bloodDonorToken")) {
                setError("Please login before creating a blood request.");
                return;
            }

            const requestData = {
                patientName: trimmedPatientName,
                bloodGroup: formData.bloodGroup,
                units,
                hospitalName: trimmedHospitalName,
                location: trimmedLocation,
                urgency: formData.urgency,
                requiredDate: formData.requiredDate,
                description: formData.description
            };

            const response = await api.post("/requests", requestData);
            const createdRequestId = response?.data?.id;

            setSuccess(
                "Blood request created! Redirecting to AI Donor Matching..."
            );

            setTimeout(() => {
                if (createdRequestId) {
                    navigate(`/requests/${createdRequestId}`);
                } else {
                    navigate("/requests");
                }
            }, 1000);
        } catch (err) {
            console.error("Blood request error:", err);

            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.response?.data) {
                console.error("Backend response:", err.response.data);
                setError(
                    "Unable to create blood request. Check backend console."
                );
            } else {
                setError("Unable to create blood request.");
            }
        } finally {
            setLoading(false);
        }
    };

    const compatibleGroups = COMPATIBLE_DONORS[formData.bloodGroup] || [];

    return (
        <div className="create-request-page">
            {/* ================= HEADER ================= */}
            <header className="request-page-header">
                <Link to="/dashboard" className="request-back">
                    ← Dashboard
                </Link>

                <div className="request-header-title">
                    <span>BLOOD DONATION</span>
                    <h1>Create Blood Request</h1>
                    <p>
                        Submit your requirement to trigger SmartBlood AI donor matching and priority assessment.
                    </p>
                </div>
            </header>

            {/* ================= MAIN ================= */}
            <main className="create-request-main">
                {/* ================= FORM ================= */}
                <div className="request-form-card">
                    {/* QUICK DEMO AUTOFILL BAR */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "8px",
                            padding: "10px 14px",
                            marginBottom: "18px",
                            background: "#f8fafc",
                            border: "1px dashed #cbd5e1",
                            borderRadius: "10px"
                        }}
                    >
                        <span
                            style={{
                                fontSize: "12px",
                                fontWeight: "700",
                                color: "#475569"
                            }}
                        >
                            ⚡ Quick Demo Templates:
                        </span>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button
                                type="button"
                                onClick={fillEmergencyPreset}
                                style={{
                                    background: "#ffe4e6",
                                    color: "#be123c",
                                    border: "1px solid #fda4af",
                                    padding: "5px 10px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                }}
                            >
                                🚨 Fill Critical Emergency (O-)
                            </button>
                            <button
                                type="button"
                                onClick={fillNormalPreset}
                                style={{
                                    background: "#e0f2fe",
                                    color: "#0369a1",
                                    border: "1px solid #7dd3fc",
                                    padding: "5px 10px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                }}
                            >
                                🏥 Fill Urgent Case (B+)
                            </button>
                        </div>
                    </div>

                    {error && <div className="request-error">{error}</div>}
                    {success && <div className="request-success">{success}</div>}

                    <form onSubmit={handleSubmit}>
                        {/* PATIENT */}
                        <div className="form-section-title">
                            <span>01</span>
                            Patient Information
                        </div>

                        <div className="request-form-group">
                            <label>Patient Name *</label>
                            <input
                                type="text"
                                name="patientName"
                                placeholder="Enter patient full name"
                                value={formData.patientName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="request-form-row">
                            <div className="request-form-group">
                                <label>Blood Group *</label>
                                <select
                                    name="bloodGroup"
                                    value={formData.bloodGroup}
                                    onChange={handleChange}
                                >
                                    <option value="">Select blood group</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>

                            <div className="request-form-group">
                                <label>Units Required (1 - 10) *</label>
                                <input
                                    type="number"
                                    name="units"
                                    min="1"
                                    max="10"
                                    value={formData.units}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* LIVE COMPATIBILITY HELPER */}
                        {compatibleGroups.length > 0 && (
                            <div
                                style={{
                                    background: "#fff1f2",
                                    borderLeft: "4px solid #e11d48",
                                    padding: "10px 14px",
                                    marginBottom: "16px",
                                    borderRadius: "6px",
                                    fontSize: "13px",
                                    color: "#881337"
                                }}
                            >
                                <strong>
                                    💡 Compatible Donor Groups for {formData.bloodGroup}:
                                </strong>{" "}
                                {compatibleGroups.join(" • ")}
                            </div>
                        )}

                        {/* HOSPITAL */}
                        <div className="form-section-title">
                            <span>02</span>
                            Hospital Information
                        </div>

                        <div className="request-form-group">
                            <label>Hospital Name *</label>
                            <input
                                type="text"
                                name="hospitalName"
                                placeholder="Enter hospital name"
                                value={formData.hospitalName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="request-form-group">
                            <label>Location *</label>
                            <input
                                type="text"
                                name="location"
                                placeholder="City / Area (e.g., Chennai, Coimbatore)"
                                value={formData.location}
                                onChange={handleChange}
                            />
                        </div>

                        {/* REQUIREMENT */}
                        <div className="form-section-title">
                            <span>03</span>
                            Blood Requirement
                        </div>

                        <div className="request-form-row">
                            <div className="request-form-group">
                                <label>Urgency Level</label>
                                <select
                                    name="urgency"
                                    value={formData.urgency}
                                    onChange={handleChange}
                                >
                                    <option value="NORMAL">Normal</option>
                                    <option value="URGENT">Urgent</option>
                                    <option value="EMERGENCY">Emergency (Critical Triage)</option>
                                </select>
                            </div>

                            <div className="request-form-group">
                                <label>Required Date *</label>
                                <input
                                    type="date"
                                    name="requiredDate"
                                    value={formData.requiredDate}
                                    onChange={handleChange}
                                    min={today}
                                />
                            </div>
                        </div>

                        <div className="request-form-group">
                            <label>Additional Clinical Information</label>
                            <textarea
                                name="description"
                                rows="4"
                                placeholder="Ward/ICU details, attending doctor note, or special instructions..."
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        {/* ACTIONS */}
                        <div className="request-form-actions">
                            <Link to="/dashboard" className="cancel-request">
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                className="submit-request"
                                disabled={loading}
                            >
                                {loading
                                    ? "Submitting & Running AI Triage..."
                                    : "🩸 Create Blood Request"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ================= INFO CARD ================= */}
                <aside className="request-info-card">
                    <div className="info-blood-icon">🩸</div>

                    <h2>Need Blood Urgently?</h2>

                    <p>
                        Your request will be immediately scored by our Emergency Intelligence Engine and matched with eligible nearby donors.
                    </p>

                    {/* LIVE TRIAGE PREVIEW BOX */}
                    <div
                        style={{
                            marginTop: "16px",
                            padding: "12px",
                            borderRadius: "10px",
                            background:
                                formData.urgency === "EMERGENCY"
                                    ? "#fef2f2"
                                    : formData.urgency === "URGENT"
                                    ? "#fffbeb"
                                    : "#f0fdf4",
                            border:
                                formData.urgency === "EMERGENCY"
                                    ? "1px solid #fecaca"
                                    : formData.urgency === "URGENT"
                                    ? "1px solid #fde68a"
                                    : "1px solid #bbf7d0",
                            color: "#1e293b",
                            fontSize: "13px"
                        }}
                    >
                        <strong style={{ display: "block", marginBottom: "4px" }}>
                            🤖 Live AI Triage Preview:
                        </strong>
                        <span>
                            Mode:{" "}
                            <b>
                                {formData.urgency === "EMERGENCY"
                                    ? "🚨 CRITICAL AUTO-ESCALATION"
                                    : formData.urgency === "URGENT"
                                    ? "⚡ HIGH PRIORITY"
                                    : "✅ STANDARD OUTREACH"}
                            </b>
                        </span>
                        <div style={{ marginTop: "4px", fontSize: "12px", opacity: 0.85 }}>
                            {formData.urgency === "EMERGENCY"
                                ? "Will appear on the Emergency Command Center and trigger immediate ML donor ranking."
                                : "Will notify compatible eligible donors in your city."}
                        </div>
                    </div>

                    <div className="request-tip" style={{ marginTop: "16px" }}>
                        <strong>💡 Tip</strong>
                        <span>
                            Make sure your hospital and city name match your target area so distance & ML reliability ranking can find the closest donors.
                        </span>
                    </div>
                </aside>
            </main>
        </div>
    );
}

export default CreateRequest;