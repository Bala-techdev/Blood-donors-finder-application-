import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Profile.css";

function Profile() {
    const navigate = useNavigate();

    const storedUser = localStorage.getItem("bloodDonorUser");

    const user = storedUser
        ? JSON.parse(storedUser)
        : null;

    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        bloodGroup: "",
        location: "",
        available: true,
    });

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [donorProfileExists, setDonorProfileExists] =
        useState(false);

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
                // Load personal account information.
                const userResponse = await api.get("/users/me");

                if (!active) return;

                const updatedUser = {
                    ...user,
                    ...userResponse.data,
                };

                localStorage.setItem(
                    "bloodDonorUser",
                    JSON.stringify(updatedUser)
                );

                setFormData((previous) => ({
                    ...previous,
                    name: updatedUser.name || "",
                    email: updatedUser.email || "",
                    phone: updatedUser.phone || "",
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

            // Load donor information separately.
            // A user might not have created a donor profile yet.
            try {
                const donorResponse = await api.get("/donors/me");

                if (!active) return;

                setDonorProfileExists(true);

                setFormData((previous) => ({
                    ...previous,
                    bloodGroup:
                        donorResponse.data.bloodGroup || "",
                    location:
                        donorResponse.data.location || "",
                    available:
                        donorResponse.data.available !== false,
                }));
            } catch (err) {
                if (!active) return;

                if (err.response?.status === 404) {
                    setDonorProfileExists(false);

                    setFormData((previous) => ({
                        ...previous,
                        bloodGroup: "",
                        location: "",
                        available: true,
                    }));
                } else {
                    console.error(
                        "Unable to load donor information:",
                        err.response?.status,
                        err.response?.data || err.message
                    );

                    setError((previous) =>
                        previous ||
                        "Unable to load your donor information."
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
        // Load the profile when the component mounts.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");
        setSaving(true);

        try {
            // Step 1: Update personal account information.
            const userResponse = await api.put("/users/me", {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
            });

            const updatedUser = {
                ...user,
                ...userResponse.data,
            };

            localStorage.setItem(
                "bloodDonorUser",
                JSON.stringify(updatedUser)
            );

            // Step 2: Create or update the donor profile.
            if (donorProfileExists) {
                const donorResponse = await api.put(
                    "/donors/me",
                    {
                        bloodGroup: formData.bloodGroup,
                        location: formData.location.trim(),
                        available: formData.available,
                    }
                );

                setFormData((previous) => ({
                    ...previous,
                    name: updatedUser.name || "",
                    email: updatedUser.email || "",
                    phone: updatedUser.phone || "",
                    bloodGroup:
                        donorResponse.data.bloodGroup || "",
                    location:
                        donorResponse.data.location || "",
                    available:
                        donorResponse.data.available !== false,
                }));
            } else {
                const donorResponse = await api.post(
                    "/donors",
                    {
                        bloodGroup: formData.bloodGroup,
                        location: formData.location.trim(),
                        available: formData.available,
                    }
                );

                setFormData((previous) => ({
                    ...previous,
                    name: updatedUser.name || "",
                    email: updatedUser.email || "",
                    phone: updatedUser.phone || "",
                    bloodGroup:
                        donorResponse.data.bloodGroup || "",
                    location:
                        donorResponse.data.location || "",
                    available:
                        donorResponse.data.available !== false,
                }));

                setDonorProfileExists(true);
                setMessage("Profile and donor information saved successfully.");
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

        // Reload saved values rather than retaining unsaved changes.
        try {
            const userResponse = await api.get("/users/me");

            const updatedUser = {
                ...user,
                ...userResponse.data,
            };

            localStorage.setItem(
                "bloodDonorUser",
                JSON.stringify(updatedUser)
            );

            setFormData((previous) => ({
                ...previous,
                name: updatedUser.name || "",
                email: updatedUser.email || "",
                phone: updatedUser.phone || "",
            }));

            try {
                const donorResponse = await api.get("/donors/me");

                setDonorProfileExists(true);

                setFormData((previous) => ({
                    ...previous,
                    bloodGroup:
                        donorResponse.data.bloodGroup || "",
                    location:
                        donorResponse.data.location || "",
                    available:
                        donorResponse.data.available !== false,
                }));
            } catch (donorError) {
                if (donorError.response?.status === 404) {
                    setDonorProfileExists(false);

                    setFormData((previous) => ({
                        ...previous,
                        bloodGroup: "",
                        location: "",
                        available: true,
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

    return (
        <div className="profile-page">
            {/* HEADER */}
            <header className="profile-page-header">
                <Link
                    to="/dashboard"
                    className="profile-dashboard-link"
                >
                    ← Dashboard
                </Link>

                <div className="profile-header-title">
                    <span>ACCOUNT</span>

                    <h1>My Profile</h1>

                    <p>
                        Manage your personal and donor information.
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

                        <span className="profile-member-badge">
                            🩸 BloodDonor Member
                        </span>
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
                                <h2>Personal Information</h2>

                                <p>
                                    Your registered account and donor details
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
                                        Phone Number
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
                                        disabled={
                                            !editing ||
                                            saving
                                        }
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
                                        Location
                                    </label>

                                    <input
                                        id="profile-location"
                                        type="text"
                                        name="location"
                                        placeholder="City / Area"
                                        value={formData.location}
                                        onChange={handleChange}
                                        disabled={!editing || saving}
                                        maxLength={200}
                                    />

                                    {!donorProfileExists && (
                                        <small>
                                            Saving these fields will create
                                            your donor profile.
                                        </small>
                                    )}
                                </div>

                                {/* AVAILABILITY */}
                                <div className="profile-field full">
                                    <label
                                        className="profile-availability-field"
                                    >
                                        <input
                                            type="checkbox"
                                            name="available"
                                            checked={formData.available}
                                            onChange={(event) =>
                                                setFormData((previous) => ({
                                                    ...previous,
                                                    available:
                                                        event.target.checked,
                                                }))
                                            }
                                            disabled={!editing || saving}
                                        />
                                        Available to donate
                                    </label>
                                </div>
                            </div>

                            {editing && (
                                <div className="profile-save-area">
                                    <button
                                        type="submit"
                                        className="save-profile-button"
                                        disabled={saving}
                                    >
                                        {saving
                                            ? "Saving..."
                                            : "Save Changes"}
                                    </button>
                                </div>
                            )}
                        </form>
                    </section>

                    {/* DONOR STATUS */}
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
                                ? "Your donor profile can appear in donor searches when someone needs your blood group."
                                : "Create your donor profile to participate in donor searches and matching."}
                        </p>

                        <div className="donor-stat-row">
                            <div>
                                <strong>
                                    {formData.bloodGroup || "--"}
                                </strong>

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
                        </div>
                    </section>
                </div>

                {/* SECURITY */}
                <section className="profile-security-card">
                    <div className="security-icon">🔒</div>

                    <div>
                        <h3>Account Security</h3>

                        <p>
                            Your account information is protected.
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