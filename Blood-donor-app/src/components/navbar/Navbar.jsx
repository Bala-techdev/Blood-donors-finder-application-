import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../../styles/Navbar.css";

function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    const closeMenu = () => setMenuOpen(false);

    // Close mobile menu on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                closeMenu();
            }
        };

        if (menuOpen) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [menuOpen]);

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
        <>
            <header className="navbar">
                <div className="navbar-container">
                    <Link to="/" className="navbar-logo" onClick={closeMenu}>
                        🩸 Blood<span>Donor</span>
                    </Link>

                    {/* Mobile Hamburger Toggle Button */}
                    <button
                        type="button"
                        className={`navbar-menu-toggle ${menuOpen ? "is-active" : ""}`}
                        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((prev) => !prev)}
                    >
                        <span className="hamburger-bar" />
                        <span className="hamburger-bar" />
                        <span className="hamburger-bar" />
                    </button>

                    {/* Desktop & Mobile Drawer Links */}
                    <nav
                        className={`navbar-links ${menuOpen ? "is-open" : ""}`}
                        aria-label="Primary navigation"
                    >
                        <Link to="/" onClick={closeMenu} className="nav-link">
                            Home
                        </Link>
                        <Link to="/donors" onClick={closeMenu} className="nav-link">
                            Find Donors
                        </Link>
                        <Link to="/requests" onClick={closeMenu} className="nav-link">
                            Blood Requests
                        </Link>

                        {isLoggedIn ? (
                            <>
                                <Link
                                    to="/emergency"
                                    onClick={closeMenu}
                                    className="nav-link emergency-link"
                                >
                                    🚨 Emergency
                                </Link>
                                <Link to="/dashboard" onClick={closeMenu} className="nav-link">
                                    Dashboard
                                </Link>
                                <Link
                                    to="/profile"
                                    className="nav-link profile-link"
                                    onClick={closeMenu}
                                >
                                    👤 {user?.name?.split(" ")[0] || "Profile"}
                                </Link>
                                <button
                                    type="button"
                                    className="nav-logout-btn"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={closeMenu} className="nav-link">
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
                    </nav>
                </div>
            </header>

            {/* Mobile Drawer Backdrop Overlay */}
            {menuOpen && (
                <div
                    className="navbar-backdrop"
                    onClick={closeMenu}
                    aria-hidden="true"
                />
            )}
        </>
    );
}

export default Navbar;
