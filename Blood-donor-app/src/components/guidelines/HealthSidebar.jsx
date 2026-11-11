import { useState, useEffect } from "react";
import "./HealthSidebar.css";

export default function HealthSidebar() {
    const [isOpen, setIsOpen] = useState(false);

    // Sync body class so desktop layouts can adjust margin side-by-side without overlapping
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add("health-sidebar-open");
        } else {
            document.body.classList.remove("health-sidebar-open");
        }
        return () => {
            document.body.classList.remove("health-sidebar-open");
        };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    return (
        <>
            {/* FLOATING TOGGLE BUTTON */}
            {!isOpen && (
                <button
                    type="button"
                    className="floating-health-btn"
                    onClick={() => setIsOpen(true)}
                    title="View Blood Donation Rules & Medical Eligibility"
                    aria-label="Open donation health guidelines sidebar"
                >
                    <span className="floating-health-icon">🩺</span>
                    <span className="floating-health-text">Guidelines</span>
                </button>
            )}

            {/* MOBILE BACKDROP OVERLAY */}
            <div
                className={`health-sidebar-overlay ${isOpen ? "open" : ""}`}
                onClick={() => setIsOpen(false)}
                aria-hidden={!isOpen}
            />

            {/* SLIDE-OUT PANEL / SIDE-BY-SIDE SIDEBAR */}
            <aside
                className={`health-sidebar ${isOpen ? "open" : ""}`}
                aria-label="Blood Donation Medical Guidelines"
            >
                <div className="health-sidebar-header">
                    <h2>🩺 Donation Guidelines</h2>
                    <button
                        type="button"
                        className="close-sidebar-btn"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close donation guidelines"
                    >
                        ×
                    </button>
                </div>

                <div className="health-sidebar-content">
                    <div className="rule-highlight">
                        <p>
                            💡 <strong>SmartBlood Safety Policy:</strong> Our system automatically enforces a 90-day medical cooldown after every donation.
                        </p>
                    </div>

                    <div className="rule-card">
                        <h3>✅ Basic Eligibility</h3>
                        <ul>
                            <li><strong>Age:</strong> Must be between 18 and 65 years old.</li>
                            <li><strong>Weight:</strong> Must weigh at least 45 kg (110 lbs).</li>
                            <li><strong>Health:</strong> Must be in good general health and feeling well today.</li>
                            <li><strong>Hemoglobin:</strong> Not less than 12.5 g/dL.</li>
                        </ul>
                    </div>

                    <div className="rule-card">
                        <h3>❌ Deferrals & Restrictions</h3>
                        <ul>
                            <li>Tattoo, piercing, or acupuncture in the last 6 months.</li>
                            <li>Currently suffering from cold, flu, sore throat, or infection.</li>
                            <li>Pregnant, recently gave birth, or currently breastfeeding.</li>
                            <li>Undergone major surgery within the last 6 months.</li>
                        </ul>
                    </div>

                    <div className="rule-card">
                        <h3>🍽️ Pre-Donation Preparation</h3>
                        <ul>
                            <li>Drink plenty of water (at least 500ml) before donating.</li>
                            <li>Eat a healthy, light meal—never donate on an empty stomach.</li>
                            <li>Avoid alcohol for 24 hours prior to donation.</li>
                            <li>Get 7–8 hours of restful sleep prior to donation.</li>
                        </ul>
                    </div>

                    <div className="rule-card">
                        <h3>🩹 Post-Donation Care</h3>
                        <ul>
                            <li>Rest for 10–15 minutes at the hospital/clinic after donating.</li>
                            <li>Drink extra liquids over the next 24 hours.</li>
                            <li>Avoid strenuous physical exercise or heavy lifting today.</li>
                            <li>If you feel lightheaded, sit down and elevate your feet.</li>
                        </ul>
                    </div>
                </div>
            </aside>
        </>
    );
}
