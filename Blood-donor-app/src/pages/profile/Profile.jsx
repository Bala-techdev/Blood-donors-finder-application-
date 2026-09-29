import { useState } from "react";
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
      
    });

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    if (!user) {
        navigate("/login");
        return null;
    }


    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };


    const handleSave = async (e) => {

        e.preventDefault();

        setMessage("");
        setError("");

        try {

            setSaving(true);

            /*
             * Adjust this endpoint if your UserController
             * uses a different PUT endpoint.
             */

            const response = await api.put(
                `/users/${user.id}`,
                formData
            );

            const updatedUser = {
                ...user,
                ...response.data
            };

            localStorage.setItem(
                "bloodDonorUser",
                JSON.stringify(updatedUser)
            );

            setFormData({
                name: updatedUser.name || "",
                email: updatedUser.email || "",
                phone: updatedUser.phone || "",
                bloodGroup: updatedUser.bloodGroup || "",
                location: updatedUser.location || ""
            });

            setEditing(false);

            setMessage("Profile updated successfully.");

        } catch (err) {

            console.error(err);

            setError(
                "Unable to update profile. Please check your backend endpoint."
            );

        } finally {

            setSaving(false);

        }
    };


    const handleLogout = () => {

        localStorage.removeItem("bloodDonorUser");

        navigate("/login");
    };


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

                    <span>
                        ACCOUNT
                    </span>

                    <h1>
                        My Profile
                    </h1>

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
                            ? formData.name
                                .charAt(0)
                                .toUpperCase()
                            : "U"}
                    </div>

                    <div className="profile-hero-info">

                        <h2>
                            {formData.name || "User"}
                        </h2>

                        <p>
                            {formData.email}
                        </p>

                        <span className="profile-member-badge">
                            🩸 BloodDonor Member
                        </span>

                    </div>

                    <button
                        className="edit-profile-button"
                        onClick={() => {
                            setEditing(!editing);
                            setMessage("");
                            setError("");
                        }}
                    >
                        {editing ? "Cancel" : "✎ Edit Profile"}
                    </button>

                </section>


                {/* MESSAGE */}

                {message && (
                    <div className="profile-success">
                        ✓ {message}
                    </div>
                )}

                {error && (
                    <div className="profile-error">
                        ⚠ {error}
                    </div>
                )}


                {/* CONTENT */}

                <div className="profile-page-grid">

                    {/* PERSONAL INFORMATION */}

                    <section className="profile-information-card">

                        <div className="profile-card-title">

                            <div>
                                <h2>
                                    Personal Information
                                </h2>

                                <p>
                                    Your registered account details
                                </p>
                            </div>

                        </div>


                        <form onSubmit={handleSave}>

                            <div className="profile-form-grid">

                                {/* NAME */}

                                <div className="profile-field">

                                    <label>
                                        Full Name
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        disabled={!editing}
                                    />

                                </div>


                                {/* EMAIL */}

                                <div className="profile-field">

                                    <label>
                                        Email Address
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={!editing}
                                    />

                                </div>


                                {/* PHONE */}

                                <div className="profile-field">

                                    <label>
                                        Phone Number
                                    </label>

                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="Enter phone number"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={!editing}
                                    />

                                </div>


                                {/* BLOOD GROUP */}

                                <div className="profile-field">

                                    <label>
                                        Blood Group
                                    </label>

                                    <select
                                        name="bloodGroup"
                                        value={formData.bloodGroup}
                                        onChange={handleChange}
                                        disabled={!editing}
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

                                    <label>
                                        Location
                                    </label>

                                    <input
                                        type="text"
                                        name="location"
                                        placeholder="City / Area"
                                        value={formData.location}
                                        onChange={handleChange}
                                        disabled={!editing}
                                    />

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

                        <div className="donor-status-icon">
                            🩸
                        </div>

                        <h2>
                            Donor Status
                        </h2>

                        <div className="available-status">
                            <span></span>
                            Available to Donate
                        </div>

                        <p>
                            Your profile can appear in donor
                            searches when someone needs your
                            blood group.
                        </p>

                        <div className="donor-stat-row">

                            <div>
                                <strong>5</strong>
                                <span>Donations</span>
                            </div>

                            <div>
                                <strong>100%</strong>
                                <span>Profile</span>
                            </div>

                        </div>

                    </section>

                </div>


                {/* SECURITY */}

                <section className="profile-security-card">

                    <div className="security-icon">
                        🔒
                    </div>

                    <div>

                        <h3>
                            Account Security
                        </h3>

                        <p>
                            Your account information is protected.
                        </p>

                    </div>

                    <button
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