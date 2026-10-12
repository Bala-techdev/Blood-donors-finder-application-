import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [infoMessage, setInfoMessage] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setInfoMessage("");

        if (!formData.email || !formData.password) {
            setError("Please enter your email and password.");
            return;
        }

        try {
            setLoading(true);

            const response = await api.post("/auth/login", formData);
            const loginData = response.data;

            localStorage.setItem("bloodDonorToken", loginData.token);

            const user = {
                id: loginData.userId,
                name: loginData.name,
                email: loginData.email,
                phone: loginData.phone,
                role: loginData.role
            };

            localStorage.setItem("bloodDonorUser", JSON.stringify(user));

            navigate("/dashboard");
        } catch (err) {
            if (err.response?.status === 401) {
                setError("Invalid email or password.");
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError("Unable to login. Please check if backend is running.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                {/* LEFT SIDE */}
                <div className="login-info">
                    <Link to="/" className="login-logo">
                        🩸 Blood<span>Donor</span>
                    </Link>

                    <div className="login-info-content">
                        <span className="login-label">
                            SMARTBLOOD AI NETWORK
                        </span>

                        <h1>
                            Together We Can
                            <span> Save Lives.</span>
                        </h1>

                        <p>
                            Sign in to access AI-powered donor matching, real-time emergency triage, and community blood requests.
                        </p>

                        <div className="login-highlight">
                            <div className="highlight-icon">🤖</div>
                            <div>
                                <strong>Intelligent Emergency Triage</strong>
                                <small>
                                    Powered by Spring Security JWT & FastAPI ML
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="login-form-section">
                    <div className="login-form-card">
                        <div className="login-form-header">
                            <div className="login-icon">🩸</div>
                            <h2>Welcome Back</h2>
                            <p>Sign in to your SmartBlood account.</p>
                        </div>

                        {error && <div className="login-error">{error}</div>}

                        {infoMessage && (
                            <div
                                style={{
                                    padding: "10px 14px",
                                    marginBottom: "16px",
                                    borderRadius: "8px",
                                    background: "#eff6ff",
                                    color: "#1d4ed8",
                                    fontSize: "13px",
                                    fontWeight: "600"
                                }}
                            >
                                ℹ️ {infoMessage}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="login-form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                            </div>

                            <div className="login-form-group">
                                <div className="password-label">
                                    <label>Password</label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setInfoMessage(
                                                "Please contact your hospital administrator or register a new account."
                                            )
                                        }
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "#e11d48",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            cursor: "pointer",
                                            padding: 0
                                        }}
                                    >
                                        Forgot password?
                                    </button>
                                </div>

                                <div style={{ position: "relative" }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        disabled={loading}
                                        style={{ width: "100%", paddingRight: "42px" }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        style={{
                                            position: "absolute",
                                            right: "10px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: "14px",
                                            color: "#64748b"
                                        }}
                                        title={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                    >
                                        {showPassword ? "🙈" : "👁️"}
                                    </button>
                                </div>
                            </div>

                            <div className="remember-me">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    defaultChecked
                                />
                                <label htmlFor="remember">
                                    Keep me signed in on this device
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="login-submit"
                                disabled={loading}
                            >
                                {loading ? "Signing In..." : "Sign In →"}
                            </button>
                        </form>

                        <div className="login-register">
                            Don't have an account?{" "}
                            <Link to="/register">Register as a Donor</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;