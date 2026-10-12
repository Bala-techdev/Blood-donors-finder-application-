import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../../styles/Navbar.css";

function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    const closeMenu = () => setMenuOpen(false);

    const token = localStorage.getItem("bloodDonorToken");
    const storedUser = localStorage.getItem("bloodDonorUser");
    let user = null;
    try {
        user = storedUser ? JSON.parse(storedUser) : null;
    } catch {
        user = null;
    }

    const isLoggedIn = Boolean(token && user);

    const handleLogout = () => {
        localStorage.removeItem("bloodDonorUser");
        localStorage.removeItem("bloodDonorToken");
        closeMenu();
        navigate("/login");
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo" onClick={closeMenu}>
                    🩸 Blood<span>Donor</span>
                </Link>

                <button
                    type="button"
                    className="navbar-menu-toggle"
                    aria-label={
                        menuOpen
                            ? "Close navigation menu"
                            : "Open navigation menu"
                    }
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((open) => !open)}
                >
                    <span />
                    <span />
                    <span />
                </button>

                <div className={`navbar-links ${menuOpen ? "is-open" : ""}`}>
                    <Link to="/" onClick={closeMenu}>
                        Home
                    </Link>
                    <Link to="/donors" onClick={closeMenu}>
                        Find Donors
                    </Link>
                    <Link to="/requests" onClick={closeMenu}>
                        Blood Requests
                    </Link>

                    {isLoggedIn ? (
                        <>
                            <Link
                                to="/emergency"
                                onClick={closeMenu}
                                style={{ color: "#e11d48", fontWeight: "700" }}
                            >
                                🚨 Emergency
                            </Link>
                            <Link to="/dashboard" onClick={closeMenu}>
                                Dashboard
                            </Link>
                            <Link
                                to="/profile"
                                className="register-btn"
                                onClick={closeMenu}
                            >
                                👤 {user?.name?.split(" ")[0] || "Profile"}
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                style={{
                                    background: "transparent",
                                    border: "1px solid #cbd5e1",
                                    padding: "7px 14px",
                                    borderRadius: "8px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    color: "#475569"
                                }}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" onClick={closeMenu}>
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="register-btn"
                                onClick={closeMenu}
                            >
                                Become a Donor
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;