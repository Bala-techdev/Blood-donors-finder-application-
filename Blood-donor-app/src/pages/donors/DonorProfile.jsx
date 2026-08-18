import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import "./DonorProfile.css";

function DonorProfile() {

    const { id } = useParams();

    const [donor, setDonor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        const fetchDonor = async () => {

            try {

                setLoading(true);

                const response = await api.get(`/donors/${id}`);

                setDonor(response.data);

            } catch (err) {

                console.error(err);

                setError("Unable to load donor profile.");

            } finally {

                setLoading(false);

            }
        };

        fetchDonor();

    }, [id]);


    if (loading) {
        return (
            <div className="profile-state">
                <div className="profile-loading-icon">🩸</div>
                <p>Loading donor profile...</p>
            </div>
        );
    }


    if (error || !donor) {
        return (
            <div className="profile-state">

                <div className="profile-loading-icon">
                    😕
                </div>

                <h2>Donor Not Found</h2>

                <p>
                    {error || "This donor profile is unavailable."}
                </p>

                <Link
                    to="/donors"
                    className="back-donors-button"
                >
                    ← Back to Donors
                </Link>

            </div>
        );
    }


    const donorName =
        donor.user?.name || donor.name || "Blood Donor";

    const bloodGroup =
        donor.bloodGroup || "N/A";

    const location =
        donor.location || "Location unavailable";


    return (
        <div className="donor-profile-page">

            {/* HEADER */}

            <header className="profile-header">

                <Link
                    to="/donors"
                    className="profile-back"
                >
                    ← Back to Donors
                </Link>

                <span>
                    DONOR PROFILE
                </span>

            </header>


            <main className="profile-main">

                {/* PROFILE CARD */}

                <section className="profile-card">

                    <div className="profile-top">

                        <div className="profile-avatar">
                            {donorName
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div className="profile-name">

                            <h1>
                                {donorName}
                            </h1>

                            <p>
                                📍 {location}
                            </p>

                            <div className="profile-status">

                                <span className="available-dot">
                                    ●
                                </span>

                                {donor.available
                                    ? " Available to Donate"
                                    : " Currently Unavailable"}

                            </div>

                        </div>

                        <div className="profile-blood">

                            <small>
                                BLOOD GROUP
                            </small>

                            <strong>
                                {bloodGroup}
                            </strong>

                        </div>

                    </div>


                    {/* DETAILS */}

                    <div className="profile-details">

                        <div className="profile-detail">

                            <span>
                                Total Donations
                            </span>

                            <strong>
                                {donor.totalDonations || 0}
                            </strong>

                        </div>


                        <div className="profile-detail">

                            <span>
                                Verification
                            </span>

                            <strong className="verified">
                                {donor.verified
                                    ? "✓ Verified"
                                    : "Pending"}
                            </strong>

                        </div>


                        <div className="profile-detail">

                            <span>
                                Location
                            </span>

                            <strong>
                                {location}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* CONTENT */}

                <div className="profile-grid">

                    {/* ABOUT */}

                    <section className="profile-panel">

                        <h2>
                            About Donor
                        </h2>

                        <p>
                            This donor is registered with the
                            BloodDonor community and can be contacted
                            for compatible blood donation requests.
                        </p>

                        <div className="profile-info-list">

                            <div>
                                <span>Blood Group</span>
                                <strong>{bloodGroup}</strong>
                            </div>

                            <div>
                                <span>Location</span>
                                <strong>{location}</strong>
                            </div>

                            <div>
                                <span>Availability</span>
                                <strong>
                                    {donor.available
                                        ? "Available"
                                        : "Unavailable"}
                                </strong>
                            </div>

                        </div>

                    </section>


                    {/* REQUEST */}

                    <section className="profile-request-card">

                        <div className="request-icon">
                            🩸
                        </div>

                        <h2>
                            Need Blood?
                        </h2>

                        <p>
                            Send a blood donation request to this
                            donor if you need compatible blood.
                        </p>

                        <button
                            className="request-blood-button"
                            onClick={() =>
                                alert(
                                    "Blood request feature will be connected next."
                                )
                            }
                        >
                            Request Blood
                        </button>

                        <small>
                            The donor will receive your request.
                        </small>

                    </section>

                </div>


                {/* SAFETY */}

                <section className="profile-safety">

                    <span>🔒</span>

                    <div>
                        <strong>
                            Your information is secure
                        </strong>

                        <p>
                            Contact information is only shared
                            when a donation request is accepted.
                        </p>
                    </div>

                </section>

            </main>

        </div>
    );
}

export default DonorProfile;