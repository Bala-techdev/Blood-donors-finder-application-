import Navbar from "../components/navbar/Navbar";
import "./Home.css";
function Home() {
    return (
        <>
            <Navbar />

            <main className="home">

                {/* ================= HERO ================= */}
                <section className="hero-section">

                    <div className="hero-container">

                        <div className="hero-left">

                            <div className="hero-badge">
                                🩸 BLOOD DONATION COMMUNITY
                            </div>

                            <h1>
                                Find Blood Donors.
                                <br />
                                <span>Save Lives Together.</span>
                            </h1>

                            <p className="hero-description">
                                Connect with verified blood donors near you
                                and help save lives when it matters most.
                            </p>

                            <div className="hero-buttons">

                                <button className="primary-button">
                                    Find Blood Donors →
                                </button>

                                <button className="secondary-button">
                                    Become a Donor
                                </button>

                            </div>

                            <div className="hero-trust">

                                <div>
                                    <span>✓</span>
                                    Verified Donors
                                </div>

                                <div>
                                    <span>✓</span>
                                    Secure Platform
                                </div>

                                <div>
                                    <span>✓</span>
                                    Available 24/7
                                </div>

                            </div>

                        </div>

                        <div className="hero-right">

                            <div className="blood-illustration">

                                <div className="blood-circle">
                                    🩸
                                </div>

                                <div className="heart-icon">
                                    ♥
                                </div>

                                <div className="floating-card card-one">
                                    ❤️
                                    <div>
                                        <strong>Save Lives</strong>
                                        <small>One donation matters</small>
                                    </div>
                                </div>

                                <div className="floating-card card-two">
                                    <strong>50K+</strong>
                                    <small>Registered Donors</small>
                                </div>

                            </div>

                        </div>

                    </div>

                </section>


                {/* ================= STATS ================= */}
                <section className="stats-section">

                    <div className="stats-container">

                        <div className="stat-item">
                            <h3>50K+</h3>
                            <p>Registered Donors</p>
                        </div>

                        <div className="stat-item">
                            <h3>10K+</h3>
                            <p>Lives Saved</p>
                        </div>

                        <div className="stat-item">
                            <h3>150+</h3>
                            <p>Cities Covered</p>
                        </div>

                        <div className="stat-item">
                            <h3>24/7</h3>
                            <p>Emergency Support</p>
                        </div>

                    </div>

                </section>


                {/* ================= HOW IT WORKS ================= */}
                <section className="how-section">

                    <div className="section-heading">

                        <span>HOW IT WORKS</span>

                        <h2>
                            Help Someone in <span>4 Simple Steps</span>
                        </h2>

                        <p>
                            Finding the right blood donor has never been easier.
                        </p>

                    </div>

                    <div className="steps-container">

                        <div className="step-card">
                            <div className="step-number">01</div>
                            <div className="step-icon">🔍</div>
                            <h3>Search Donors</h3>
                            <p>
                                Find compatible blood donors based on
                                blood group and location.
                            </p>
                        </div>

                        <div className="step-card">
                            <div className="step-number">02</div>
                            <div className="step-icon">📩</div>
                            <h3>Send Request</h3>
                            <p>
                                Send a blood donation request to
                                available donors.
                            </p>
                        </div>

                        <div className="step-card">
                            <div className="step-number">03</div>
                            <div className="step-icon">🩸</div>
                            <h3>Donate Blood</h3>
                            <p>
                                Connect with the donor and arrange
                                the donation.
                            </p>
                        </div>

                        <div className="step-card">
                            <div className="step-number">04</div>
                            <div className="step-icon">❤️</div>
                            <h3>Save a Life</h3>
                            <p>
                                Your contribution can make a real
                                difference to someone's life.
                            </p>
                        </div>

                    </div>

                </section>


                {/* ================= FEATURES ================= */}
                <section className="features-section">

                    <div className="section-heading">

                        <span>WHY BLOOD DONOR?</span>

                        <h2>
                            Everything You Need to
                            <span> Save Lives</span>
                        </h2>

                    </div>

                    <div className="features-container">

                        <div className="feature-card">
                            <div className="feature-icon">✓</div>
                            <h3>Verified Donors</h3>
                            <p>
                                Connect with verified and trustworthy
                                blood donors.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📍</div>
                            <h3>Nearby Donors</h3>
                            <p>
                                Quickly discover compatible donors
                                near your location.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🚨</div>
                            <h3>Emergency Requests</h3>
                            <p>
                                Quickly create urgent blood requests
                                when every minute matters.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🔒</div>
                            <h3>Secure Platform</h3>
                            <p>
                                Your personal information is protected
                                with secure technology.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🔔</div>
                            <h3>Instant Notifications</h3>
                            <p>
                                Receive updates about blood requests
                                and donations.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h3>Donation History</h3>
                            <p>
                                Keep track of your blood donation
                                activities.
                            </p>
                        </div>

                    </div>

                </section>


                {/* ================= BLOOD GROUPS ================= */}
                <section className="blood-groups-section">

                    <div className="section-heading">

                        <span>BLOOD GROUPS</span>

                        <h2>
                            Find the Right
                            <span> Blood Match</span>
                        </h2>

                    </div>

                    <div className="blood-groups">

                        {[
                            "A+",
                            "A-",
                            "B+",
                            "B-",
                            "AB+",
                            "AB-",
                            "O+",
                            "O-"
                        ].map((group) => (
                            <div
                                className="blood-group"
                                key={group}
                            >
                                🩸
                                <strong>{group}</strong>
                            </div>
                        ))}

                    </div>

                </section>


                {/* ================= CTA ================= */}
                <section className="cta-section">

                    <div className="cta-container">

                        <div>
                            <span>❤️ MAKE A DIFFERENCE</span>

                            <h2>
                                Ready to Save a Life?
                            </h2>

                            <p>
                                Join thousands of donors who are making
                                a difference every day.
                            </p>
                        </div>

                        <div className="cta-buttons">

                            <button className="cta-white-button">
                                Find Donors
                            </button>

                            <button className="cta-outline-button">
                                Become a Donor
                            </button>

                        </div>

                    </div>

                </section>

            </main>
        </>
    );
}

export default Home;