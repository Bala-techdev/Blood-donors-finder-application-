import { Link } from "react-router-dom";
import "../../styles/Navbar.css";

function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-container">

                <Link to="/" className="navbar-logo">
                    🩸 Blood<span>Donor</span>
                </Link>

                <div className="navbar-links">
                    <Link to="/">Home</Link>
                    <Link to="/donors">Find Donors</Link>
                    <Link to="/requests">Blood Requests</Link>
                    <Link to="/login">Login</Link>

                    <Link to="/register" className="register-btn">
                        Become a Donor
                    </Link>
                </div>

            </div>
        </nav>
    );
}

export default Navbar;