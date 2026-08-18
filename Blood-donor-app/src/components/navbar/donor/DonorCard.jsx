import { Link } from "react-router-dom";
import "./DonorCard.css";

function DonorCard({ donor }) {

    const donorName = donor.user?.name || "Blood Donor";

    return (
        <div className="donor-card">

            <div className="donor-card-top">

                <div className="donor-avatar">
                    {donorName.charAt(0).toUpperCase()}
                </div>

                <div className="donor-main-info">

                    <h3>{donorName}</h3>

                    <p>
                        📍 {donor.location || "Location unavailable"}
                    </p>

                </div>

                {donor.available && (
                    <span className="available-badge">
                        Available
                    </span>
                )}

            </div>


            <div className="donor-details">

                <div className="donor-detail">

                    <span className="detail-label">
                        Blood Group
                    </span>

                    <strong className="blood-group-badge">
                        {donor.bloodGroup}
                    </strong>

                </div>


                <div className="donor-detail">

                    <span className="detail-label">
                        Donations
                    </span>

                    <strong>
                        {donor.totalDonations || 0}
                    </strong>

                </div>


                <div className="donor-detail">

                    <span className="detail-label">
                        Verified
                    </span>

                    <strong className="verified-text">
                        {donor.verified ? "✓ Verified" : "Pending"}
                    </strong>

                </div>

            </div>


            <div className="donor-card-bottom">

                <Link
                    to={`/donors/${donor.id}`}
                    className="view-profile-btn"
                >
                    View Profile
                </Link>

               <Link
                        to="/requests/create"
                        className="request-donor-btn"
                    >
                        Request Blood
                    </Link>

            </div>

        </div>
    );
}

export default DonorCard;