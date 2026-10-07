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

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        if (!formData.email || !formData.password) {
            setError("Please enter your email and password.");
            return;
        }

        try {

            setLoading(true);

            // JWT login
            const response = await api.post(
                "/auth/login",
                formData
            );

            const loginData = response.data;

            // Store JWT token
            localStorage.setItem(
                "bloodDonorToken",
                loginData.token
            );

            // Store logged-in user information
            const user = {
                id: loginData.userId,
                name: loginData.name,
                email: loginData.email,
                phone: loginData.phone,
                role: loginData.role
            };

            localStorage.setItem(
                "bloodDonorUser",
                JSON.stringify(user)
            );

            // Go to dashboard
            navigate("/dashboard");

        } catch (err) {

            if (err.response?.status === 401) {
                setError("Invalid email or password.");
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError("Unable to login. Please try again.");
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
                            WELCOME BACK
                        </span>

                        <h1>
                            Together We Can
                            <span> Save Lives.</span>
                        </h1>

                        <p>
                            Sign in to find blood donors, manage requests,
                            and continue making a difference.
                        </p>

                        <div className="login-highlight">

                            <div className="highlight-icon">
                                ❤️
                            </div>

                            <div>
                                <strong>
                                    Every Drop Matters
                                </strong>

                                <small>
                                    Your contribution can save lives.
                                </small>
                            </div>

                        </div>

                    </div>

                </div>


                {/* RIGHT SIDE */}

                <div className="login-form-section">

                    <div className="login-form-card">

                        <div className="login-form-header">

                            <div className="login-icon">
                                🩸
                            </div>

                            <h2>
                                Welcome Back
                            </h2>

                            <p>
                                Sign in to your BloodDonor account.
                            </p>

                        </div>


                        {error && (
                            <div className="login-error">
                                {error}
                            </div>
                        )}


                        <form onSubmit={handleSubmit}>

                            <div className="login-form-group">

                                <label>
                                    Email Address
                                </label>

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

                                    <label>
                                        Password
                                    </label>

                                    <a href="#forgot">
                                        Forgot password?
                                    </a>

                                </div>

                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={loading}
                                />

                            </div>


                            <div className="remember-me">

                                <input
                                    type="checkbox"
                                    id="remember"
                                />

                                <label htmlFor="remember">
                                    Remember me
                                </label>

                            </div>


                            <button
                                type="submit"
                                className="login-submit"
                                disabled={loading}
                            >
                                {loading
                                    ? "Signing In..."
                                    : "Sign In"}
                            </button>

                        </form>


                        <div className="login-register">

                            Don't have an account?

                            <Link to="/register">
                                Register as a Donor
                            </Link>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Login;