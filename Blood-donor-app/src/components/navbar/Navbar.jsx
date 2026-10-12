import { Link } from "react-router-dom";
import { useState } from "react";
import "../../styles/Navbar.css";

function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    const closeMenu = () => setMenuOpen(false);

    return (
        <nav className="navbar">
            <div className="navbar-container">

                <Link to="/" className="navbar-logo">
                    🩸 Blood<span>Donor</span>
                </Link>

                <button
                    type="button"
                    className="navbar-menu-toggle"
                    aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((open) => !open)}
                >
                    <span />
                    <span />
                    <span />
                </button>

                <div className={`navbar-links ${menuOpen ? "is-open" : ""}`}>
                    <Link to="/" onClick={closeMenu}>Home</Link>
                    <Link to="/donors" onClick={closeMenu}>Find Donors</Link>
                    <Link to="/requests" onClick={closeMenu}>Blood Requests</Link>
                    <Link to="/login" onClick={closeMenu}>Login</Link>

                    <Link to="/register" className="register-btn" onClick={closeMenu}>
                        Become a Donor
                    </Link>
                </div>

            </div>
        </nav>
    );
}

export default Navbar;