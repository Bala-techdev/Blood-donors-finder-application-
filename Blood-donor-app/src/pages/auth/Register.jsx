import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Register.css";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "DONOR"
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

    const fillDemoDonor = () => {
        const randomNum = Math.floor(100 + Math.random() * 900);
        setError("");
        setFormData({
            name: `Karthik Donor ${randomNum}`,
            email: `karthik${randomNum}@smartblood.org`,
            password: "password123",
            phone: "9876543210",
            role: "DONOR"
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (
            !formData.name ||
            !formData.email ||
            !formData.password ||
            !formData.phone
        ) {
            setError("Please fill in all required fields.");
            return;
        }

        try {
            setLoading(true);

            await api.post("/users", formData);

            setSuccess("Registration successful! Redirecting to login...");

            setFormData({
                name: "",
                email: "",
                password: "",
                phone: "",
                role: "DONOR"
            });

            setTimeout(() => {
                navigate("/login");
            }, 1200);
        } catch (err) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError("Registration failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-container">
                {/* LEFT SIDE */}
                <div className="register-info">
                    <Link to="/" className="register-logo">
                        🩸 Blood<span>Donor</span>
                    </Link>

                    <div className="register-info-content">
                        <span className="register-label">
                            SAVE LIVES • BECOME A HERO
                        </span>

                        <h1>
                            Become a Blood
                            <span> Donor Today.</span>
                        </h1>

                        <p>
                            Join our intelligent community of verified blood donors and respond when hospitals near you need urgent help.
                        </p>

                        <div className="register-benefits">
                            <div className="benefit">
                                <div className="benefit-icon">🤖</div>
                                <div>
                                    <strong>Smart AI Matching</strong>
                                    <small>
                                        Get matched only when you are eligible and nearby.
                                    </small>
                                </div>
                            </div>

                            <div className="benefit">
                                <div className="benefit-icon">🩺</div>
                                <div>
                                    <strong>90-Day Cooldown Protection</strong>
                                    <small>
                                        Automatic recovery interval tracking after every donation.
                                    </small>
                                </div>
                            </div>

                            <div className="benefit">
                                <div className="benefit-icon">🔒</div>
                                <div>
                                    <strong>Privacy First</strong>
                                    <small>
                                        Contact details are shared only when you accept a request.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="register-form-section">
                    <div className="register-form-card">
                        <div className="form-header">
                            <div className="form-icon">🩸</div>
                            <h2>Create Your Account</h2>
                            <p>Register to join the SmartBlood community.</p>
                        </div>

                        {/* 1-CLICK DEMO AUTOFILL */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "8px 12px",
                                marginBottom: "14px",
                                background: "#f8fafc",
                                border: "1px dashed #cbd5e1",
                                borderRadius: "8px"
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "#475569"
                                }}
                            >
                                ⚡ Quick Demo Registration:
                            </span>
                            <button
                                type="button"
                                onClick={fillDemoDonor}
                                style={{
                                    background: "#ffe4e6",
                                    color: "#be123c",
                                    border: "1px solid #fda4af",
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                }}
                            >
                                Fill Sample Donor
                            </button>
                        </div>

                        {error && (
                            <div className="form-message error-message">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="form-message success-message">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="9876543210"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Account Type</label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                    >
                                        <option value="DONOR">Donor</option>
                                        <option value="USER">
                                            Requester / Patient
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Create a password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="terms">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    required
                                />
                                <span>
                                    I agree to the Terms & Privacy Policy.
                                </span>
                            </div>

                            <button
                                type="submit"
                                className="register-submit"
                                disabled={loading}
                            >
                                {loading
                                    ? "Creating Account..."
                                    : "Create Account →"}
                            </button>
                        </form>

                        <div className="login-link">
                            Already have an account?{" "}
                            <Link to="/login">Login</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;