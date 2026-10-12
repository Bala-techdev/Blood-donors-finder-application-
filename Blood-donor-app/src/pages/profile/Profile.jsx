import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Profile.css";

const BLOOD_COMPATIBILITY_INFO = {
    "A+": { donateTo: "A+, AB+", receiveFrom: "A+, A-, O+, O-" },
    "A-": { donateTo: "A+, A-, AB+, AB-", receiveFrom: "A-, O-" },
    "B+": { donateTo: "B+, AB+", receiveFrom: "B+, B-, O+, O-" },
    "B-": { donateTo: "B+, B-, AB+, AB-", receiveFrom: "B-, O-" },
    "AB+": { donateTo: "AB+ Only", receiveFrom: "All Blood Groups (Universal Recipient)" },
    "AB-": { donateTo: "AB+, AB-", receiveFrom: "AB-, A-, B-, O-" },
    "O+": { donateTo: "O+, A+, B+, AB+", receiveFrom: "O+, O-" },
    "O-": { donateTo: "All Blood Groups (Universal Donor)", receiveFrom: "O- Only" }
};

function Profile() {
    const navigate = useNavigate();

    const storedUser = localStorage.getItem("bloodDonorUser");
    let user = null;
    try {
        user = storedUser ? JSON.parse(storedUser) : null;
    } catch {
        user = null;
    }

    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        bloodGroup: "",
        location: "",
        available: true
    });

    const [donorMeta, setDonorMeta] = useState({
        id: null,
        totalDonations: 0,
        verified: false,
        lastDonationDate: null
    });

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [togglingAvailability, setTogglingAvailability] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [donorProfileExists, setDonorProfileExists] = useState(false);

    useEffect(() => {
        let active = true;

        const loadProfile = async () => {
            if (!user) {
                setLoading(false);
                navigate("/login");
                return;
            }

            setLoading(true);
            setError("");

            try {
                const userResponse = await api.get("/users/me");

                if (!active) return;

                const updatedUser = {
                    ...user,
                    ...userResponse.data
                };

                localStorage.setItem(
                    "bloodDonorUser",
                    JSON.stringify(updatedUser)
                );

                setFormData((previous) => ({
                    ...previous,
                    name: updatedUser.name || "",
                    email: updatedUser.email || "",
                    phone: updatedUser.phone || ""
                }));
            } catch (err) {
                console.error(
                    "Unable to load account information:",
                    err.response?.status,
                    err.response?.data || err.message
                );

                if (active) {
                    setError(
                        "Unable to load your account information. Please log in again if your session has expired."
                    );
                }
            }

            try {
                const donorResponse = await api.get("/donors/me");

                if (!active) return;

                const d = donorResponse.data;
                setDonorProfileExists(true);

                setFormData((previous) => ({
                    ...previous,
                    bloodGroup: d.bloodGroup || "",
                    location: d.location || "",
                    available: d.available !== false
                }));

                setDonorMeta({
                    id: d.id || null,
                    totalDonations: d.totalDonations || 0,
                    verified: Boolean(d.verified),
                    lastDonationDate: d.lastDonationDate || null
                });
            } catch (err) {
                if (!active) return;

                if (err.response?.status === 404) {
                    setDonorProfileExists(false);
                    setFormData((previous) => ({
                        ...previous,
                        bloodGroup: "",
                        location: "",
                        available: true
                    }));
                } else {
                    console.error(
                        "Unable to load donor information:",
                        err.response?.status,
                        err.response?.data || err.message
                    );

                    setError(
                        (previous) =>
                            previous || "Unable to load your donor information."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadProfile();

        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    /* ==========================================
       QUICK 1-CLICK AVAILABILITY TOGGLE
    ========================================== */
    const handleQuickToggleAvailability = async () => {
        if (!donorProfileExists || togglingAvailability) return;

        setMessage("");
        setError("");
        setTogglingAvailability(true);

        const nextAvailable = !formData.available;

        try {
            const donorResponse = await api.put("/donors/me", {
                bloodGroup: formData.bloodGroup,
                location: formData.location.trim(),
                available: nextAvailable
            });

            const updatedAvailable = donorResponse.data.available !== false;
            setFormData((prev) => ({
                ...prev,
                available: updatedAvailable
            }));
            setMessage(
                updatedAvailable
                    ? "You are now marked as Available for emergency blood requests."
                    : "Your donor availability has been paused."
            );
        } catch (err) {
            console.error("Quick toggle failed:", err);
            setError("Unable to toggle availability right now.");
        } finally {
            setTogglingAvailability(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");
        setSaving(true);

        try {
            const userResponse = await api.put("/users/me", {
                name: formData.name.trim(),
                phone: formData.phone.trim()
            });

            const updatedUser = {
                ...user,
                ...userResponse.data
            };

            localStorage.setItem(
                "bloodDonorUser",
                JSON.stringify(updatedUser)
            );

            if (donorProfileExists) {
                const donorResponse = await api.put("/donors/me", {
                    bloodGroup: formData.bloodGroup,
                    location: formData.location.trim(),
                    available: formData.available
                });

                const d = donorResponse.data;
                setFormData((previous) => ({
                    ...previous,
                    name: updatedUser.name || "",
                    email: updatedUser.email || "",
                    phone: updatedUser.phone || "",
                    bloodGroup: d.bloodGroup || "",
                    location: d.location || "",
                    available: d.available !== false
                }));
                setDonorMeta({
                    id: d.id || donorMeta.id,
                    totalDonations: d.totalDonations || 0,
                    verified: Boolean(d.verified),
                    lastDonationDate: d.lastDonationDate || null
                });
            } else {
                const donorResponse = await api.post("/donors", {
                    bloodGroup: formData.bloodGroup,
                    location: formData.location.trim(),
                    available: formData.available
                });

                const d = donorResponse.data;
                setFormData((previous) => ({
                    ...previous,
                    name: updatedUser.name || "",
                    email: updatedUser.email || "",
                    phone: updatedUser.phone || "",
                    bloodGroup: d.bloodGroup || "",
                    location: d.location || "",
                    available: d.available !== false
                }));
                setDonorMeta({
                    id: d.id || null,
                    totalDonations: d.totalDonations || 0,
                    verified: Boolean(d.verified),
                    lastDonationDate: d.lastDonationDate || null
                });

                setDonorProfileExists(true);
                setMessage(
                    "Profile and donor information saved! You are now registered as a donor."
                );
                setEditing(false);
                return;
            }

            setMessage("Profile updated successfully.");
            setEditing(false);
        } catch (err) {
            console.error(
                "Profile update failed:",
                err.response?.status,
                err.response?.data || err.message
            );

            setError(
                err.response?.data?.message ||
                    "Unable to update your profile. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async () => {
        setMessage("");
        setError("");
        setEditing(false);

        try {
            const userResponse = await api.get("/users/me");
            const updatedUser = {
                ...user,
                ...userResponse.data
            };

            localStorage.setItem(
                "bloodDonorUser",
                JSON.stringify(updatedUser)
            );

            setFormData((previous) => ({
                ...previous,
                name: updatedUser.name || "",
                email: updatedUser.email || "",
                phone: updatedUser.phone || ""
            }));

            try {
                const donorResponse = await api.get("/donors/me");
                setDonorProfileExists(true);
                setFormData((previous) => ({
                    ...previous,
                    bloodGroup: donorResponse.data.bloodGroup || "",
                    location: donorResponse.data.location || "",
                    available: donorResponse.data.available !== false
                }));
            } catch (donorError) {
                if (donorError.response?.status === 404) {
                    setDonorProfileExists(false);
                    setFormData((previous) => ({
                        ...previous,
                        bloodGroup: "",
                        location: "",
                        available: true
                    }));
                } else {
                    throw donorError;
                }
            }
        } catch (err) {
            console.error(
                "Unable to reload profile:",
                err.response?.data || err.message
            );
            setError("Unable to reload your saved profile.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("bloodDonorUser");
        localStorage.removeItem("bloodDonorToken");
        navigate("/login");
    };

    if (!user) {
        return null;
    }

    if (loading) {
        return (
            <div className="profile-page">
                <main className="profile-page-main">
                    <p>Loading your profile...</p>
                </main>
            </div>
        );
    }

    // Calculate Profile Completion %
    const fieldsCompleted = [
        Boolean(formData.name?.trim()),
        Boolean(formData.email?.trim()),
        Boolean(formData.phone?.trim()),
        Boolean(formData.bloodGroup),
        Boolean(formData.location?.trim())
    ].filter(Boolean).length;
    const completionPercentage = Math.round((fieldsCompleted / 5) * 100);

    // Calculate 90-Day Medical Cooldown Eligibility
    let daysSinceLast = null;
    let daysRemainingCooldown = 0;
    if (donorMeta.lastDonationDate) {
        const lastDate = new Date(donorMeta.lastDonationDate);
        const diffMs = Date.now() - lastDate.getTime();
        daysSinceLast = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        daysRemainingCooldown = Math.max(0, 90 - daysSinceLast);
    }

    const compatibilityInfo =
        BLOOD_COMPATIBILITY_INFO[formData.bloodGroup] || null;

    return (
        <div className="profile-page">
            {/* HEADER */}
            <header className="profile-page-header">
                <Link to="/dashboard" className="profile-dashboard-link">
                    ← Dashboard
                </Link>

                <div className="profile-header-title">
                    <span>ACCOUNT & DONOR ID</span>
                    <h1>My Profile</h1>
                    <p>
                        Manage your personal details, donor availability, and medical eligibility status.
                    </p>
                </div>
            </header>

            {/* MAIN */}
            <main className="profile-page-main">
                {/* PROFILE HERO */}
                <section className="profile-hero-card">
                    <div className="profile-big-avatar">
                        {formData.name
                            ? formData.name.charAt(0).toUpperCase()
                            : "U"}
                    </div>

                    <div className="profile-hero-info">
                        <h2>{formData.name || "User"}</h2>
                        <p>{formData.email}</p>

                        <div
                            style={{
                                display: "flex",
                                gap: "8px",
                                flexWrap: "wrap",
                                marginTop: "6px"
                            }}
                        >
                            <span className="profile-member-badge">
                                🩸 SmartBlood Member
                            </span>

                            {donorProfileExists && (
                                <span
                                    className="profile-member-badge"
                                    style={{
                                        background: donorMeta.verified
                                            ? "#ecfdf5"
                                            : "#fffbeb",
                                        color: donorMeta.verified
                                            ? "#047857"
                                            : "#b45309",
                                        border: donorMeta.verified
                                            ? "1px solid #a7f3d0"
                                            : "1px solid #fde68a"
                                    }}
                                >
                                    {donorMeta.verified
                                        ? "✓ Verified Donor"
                                        : "⏳ Verification Pending"}
                                </span>
                            )}

                            {donorMeta.id && (
                                <span
                                    className="profile-member-badge"
                                    style={{
                                        background: "#eff6ff",
                                        color: "#1d4ed8",
                                        border: "1px solid #bfdbfe"
                                    }}
                                >
                                    ID #{donorMeta.id}
                                </span>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        className="edit-profile-button"
                        onClick={() => {
                            if (editing) {
                                handleCancel();
                            } else {
                                setEditing(true);
                                setMessage("");
                                setError("");
                            }
                        }}
                        disabled={saving}
                    >
                        {editing ? "Cancel" : "✎ Edit Profile"}
                    </button>
                </section>

                {/* PROFILE COMPLETION BAR */}
                <div
                    style={{
                        background: "#ffffff",
                        padding: "14px 20px",
                        borderRadius: "12px",
                        marginBottom: "20px",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "16px",
                        flexWrap: "wrap"
                    }}
                >
                    <div style={{ flex: 1, minWidth: "220px" }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "13px",
                                fontWeight: "700",
                                color: "#334155",
                                marginBottom: "6px"
                            }}
                        >
                            <span>📊 Donor Profile Readiness</span>
                            <span>{completionPercentage}% Complete</span>
                        </div>
                        <div
                            style={{
                                width: "100%",
                                height: "8px",
                                background: "#f1f5f9",
                                borderRadius: "999px",
                                overflow: "hidden"
                            }}
                        >
                            <div
                                style={{
                                    width: `${completionPercentage}%`,
                                    height: "100%",
                                    background:
                                        completionPercentage === 100
                                            ? "#10b981"
                                            : "#e11d48",
                                    transition: "width 0.3s ease"
                                }}
                            />
                        </div>
                    </div>
                    {completionPercentage < 100 && !editing && (
                        <button
                            type="button"
                            onClick={() => setEditing(true)}
                            style={{
                                background: "#fff1f2",
                                color: "#be123c",
                                border: "1px solid #fda4af",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer"
                            }}
                        >
                            Complete Missing Fields →
                        </button>
                    )}
                </div>

                {/* MESSAGES */}
                {message && (
                    <div className="profile-success" role="status">
                        ✓ {message}
                    </div>
                )}

                {error && (
                    <div className="profile-error" role="alert">
                        ⚠ {error}
                    </div>
                )}

                {/* CONTENT */}
                <div className="profile-page-grid">
                    {/* PERSONAL INFORMATION */}
                    <section className="profile-information-card">
                        <div className="profile-card-title">
                            <div>
                                <h2>Personal & Donor Information</h2>
                                <p>
                                    Your registered account and blood matching details
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="profile-form-grid">
                                {/* NAME */}
                                <div className="profile-field">
                                    <label htmlFor="profile-name">
                                        Full Name
                                    </label>
                                    <input
                                        id="profile-name"
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        disabled={!editing || saving}
                                        required
                                        maxLength={100}
                                    />
                                </div>

                                {/* EMAIL */}
                                <div className="profile-field">
                                    <label htmlFor="profile-email">
                                        Email Address
                                    </label>
                                    <input
                                        id="profile-email"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        disabled
                                        readOnly
                                    />
                                </div>

                                {/* PHONE */}
                                <div className="profile-field">
                                    <label htmlFor="profile-phone">
                                        Phone Number (For Emergency SMS/WhatsApp)
                                    </label>
                                    <input
                                        id="profile-phone"
                                        type="tel"
                                        name="phone"
                                        placeholder="Enter phone number"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={!editing || saving}
                                        maxLength={20}
                                    />
                                </div>

                                {/* BLOOD GROUP */}
                                <div className="profile-field">
                                    <label htmlFor="profile-blood-group">
                                        Blood Group
                                    </label>
                                    <select
                                        id="profile-blood-group"
                                        name="bloodGroup"
                                        value={formData.bloodGroup}
                                        onChange={handleChange}
                                        disabled={!editing || saving}
                                    >
                                        <option value="">
                                            Select Blood Group
                                        </option>
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

                                {/* LOCATION */}
                                <div className="profile-field full">
                                    <label htmlFor="profile-location">
                                        Location / City
                                    </label>
                                    <input
                                        id="profile-location"
                                        type="text"
                                        name="location"
                                        placeholder="City / Area (e.g., Chennai, Coimbatore)"
                                        value={formData.location}
                                        onChange={handleChange}
                                        disabled={!editing || saving}
                                        maxLength={200}
                                    />
                                    {!donorProfileExists && (
                                        <small>
                                            Saving these fields will activate your SmartBlood donor profile.
                                        </small>
                                    )}
                                </div>

                                {/* AVAILABILITY */}
                                <div className="profile-field full">
                                    <label className="profile-availability-field">
                                        <input
                                            type="checkbox"
                                            name="available"
                                            checked={formData.available}
                                            onChange={(event) =>
                                                setFormData((previous) => ({
                                                    ...previous,
                                                    available:
                                                        event.target.checked
                                                }))
                                            }
                                            disabled={!editing || saving}
                                        />
                                        Available to donate for emergency and scheduled requests
                                    </label>
                                </div>
                            </div>

                            {/* COMPATIBILITY INSIGHT BOX */}
                            {compatibilityInfo && (
                                <div
                                    style={{
                                        marginTop: "16px",
                                        padding: "12px 14px",
                                        background: "#fff1f2",
                                        borderLeft: "4px solid #e11d48",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        color: "#881337"
                                    }}
                                >
                                    <strong>
                                        🩸 {formData.bloodGroup} Compatibility Guide:
                                    </strong>
                                    <div style={{ marginTop: "4px" }}>
                                        • <b>Can Donate To:</b>{" "}
                                        {compatibilityInfo.donateTo}
                                    </div>
                                    <div>
                                        • <b>Can Receive From:</b>{" "}
                                        {compatibilityInfo.receiveFrom}
                                    </div>
                                </div>
                            )}

                            {editing && (
                                <div className="profile-save-area">
                                    <button
                                        type="submit"
                                        className="save-profile-button"
                                        disabled={saving}
                                    >
                                        {saving
                                            ? "Saving..."
                                            : "💾 Save Changes"}
                                    </button>
                                </div>
                            )}
                        </form>
                    </section>

                    {/* DONOR STATUS & MEDICAL ELIGIBILITY */}
                    <section className="donor-status-card">
                        <div className="donor-status-icon">🩸</div>

                        <h2>Donor Status</h2>

                        <div className="available-status">
                            <span
                                className={
                                    donorProfileExists && formData.available
                                        ? ""
                                        : "profile-status-inactive"
                                }
                            ></span>
                            {donorProfileExists
                                ? formData.available
                                    ? "Available to Donate"
                                    : "Currently Unavailable"
                                : "Donor Profile Not Created"}
                        </div>

                        <p>
                            {donorProfileExists
                                ? "Your donor profile is indexed by the SmartBlood AI engine for compatible blood requests."
                                : "Create your donor profile to participate in donor searches and AI matching."}
                        </p>

                        {/* 1-CLICK QUICK TOGGLE */}
                        {donorProfileExists && (
                            <button
                                type="button"
                                onClick={handleQuickToggleAvailability}
                                disabled={togglingAvailability}
                                style={{
                                    width: "100%",
                                    marginTop: "10px",
                                    marginBottom: "14px",
                                    padding: "9px 14px",
                                    borderRadius: "8px",
                                    border: formData.available
                                        ? "1px solid #fca5a5"
                                        : "1px solid #86efac",
                                    background: formData.available
                                        ? "#fef2f2"
                                        : "#f0fdf4",
                                    color: formData.available
                                        ? "#b91c1c"
                                        : "#15803d",
                                    fontWeight: "700",
                                    fontSize: "13px",
                                    cursor: "pointer"
                                }}
                            >
                                {togglingAvailability
                                    ? "Updating..."
                                    : formData.available
                                    ? "⏸ Pause My Availability"
                                    : "🟢 Set Me as Available Now"}
                            </button>
                        )}

                        <div className="donor-stat-row">
                            <div>
                                <strong>{formData.bloodGroup || "--"}</strong>
                                <span>Blood Group</span>
                            </div>

                            <div>
                                <strong>
                                    {!donorProfileExists
                                        ? "--"
                                        : formData.available
                                        ? "Active"
                                        : "Paused"}
                                </strong>
                                <span>Profile Status</span>
                            </div>

                            <div>
                                <strong>{donorMeta.totalDonations}</strong>
                                <span>Donations</span>
                            </div>
                        </div>

                        {/* 90-DAY MEDICAL COOLDOWN TRACKER */}
                        {donorProfileExists && (
                            <div
                                style={{
                                    marginTop: "16px",
                                    padding: "12px",
                                    borderRadius: "10px",
                                    background:
                                        daysRemainingCooldown > 0
                                            ? "#fffbeb"
                                            : "#ecfdf5",
                                    border:
                                        daysRemainingCooldown > 0
                                            ? "1px solid #fde68a"
                                            : "1px solid #a7f3d0",
                                    fontSize: "12px",
                                    textAlign: "left",
                                    color: "#1e293b"
                                }}
                            >
                                <strong style={{ display: "block", marginBottom: "4px" }}>
                                    🩺 Medical Cooldown Check (90-Day Rule):
                                </strong>
                                {daysSinceLast === null ? (
                                    <span>
                                        ✅ Medically Eligible (No recent donation cooldown active).
                                    </span>
                                ) : daysRemainingCooldown === 0 ? (
                                    <span>
                                        ✅ Medically Eligible (Last donated{" "}
                                        {daysSinceLast} days ago).
                                    </span>
                                ) : (
                                    <span>
                                        ⏳ In Recovery Cooldown: {daysRemainingCooldown}{" "}
                                        days remaining (Last donated {daysSinceLast} days ago).
                                    </span>
                                )}
                            </div>
                        )}
                    </section>
                </div>

                {/* SECURITY */}
                <section className="profile-security-card">
                    <div className="security-icon">🔒</div>

                    <div>
                        <h3>Account Security & JWT Session</h3>
                        <p>
                            Your account is protected with Spring Security & encrypted JWT authentication.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="profile-logout"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </section>
            </main>
        </div>
    );
}

export default Profile;