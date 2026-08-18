import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import DonorCard from "../../components/navbar/donor/DonorCard";
import "./FindDonors.css";

function FindDonors() {

    const [donors, setDonors] = useState([]);

    const [bloodGroup, setBloodGroup] = useState("");
    const [location, setLocation] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchDonors = async () => {

        try {

            setLoading(true);
            setError("");

            const params = {};

            if (bloodGroup) {
                params.bloodGroup = bloodGroup;
            }

            if (location) {
                params.location = location;
            }

            const response = await api.get("/donors/search", {
                params
            });

            setDonors(response.data);

        } catch (err) {

            console.error(err);

            setError(
                "Unable to load donors. Please try again."
            );

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {
        fetchDonors();
    }, []);


    const handleSearch = (e) => {

        e.preventDefault();

        fetchDonors();
    };


    return (
        <div className="find-donors-page">

            {/* HEADER */}

            <header className="donors-header">

                <div className="donors-header-inner">

                    <Link
                        to="/dashboard"
                        className="back-dashboard"
                    >
                        ← Dashboard
                    </Link>

                    <div className="donors-title">

                        <span>
                            FIND BLOOD DONORS
                        </span>

                        <h1>
                            Find the Right Donor
                        </h1>

                        <p>
                            Search verified donors near you
                            and help save a life.
                        </p>

                    </div>

                </div>

            </header>


            {/* SEARCH */}

            <main className="donors-main">

                <form
                    className="donor-search"
                    onSubmit={handleSearch}
                >

                    <div className="search-field">

                        <label>
                            Blood Group
                        </label>

                        <select
                            value={bloodGroup}
                            onChange={(e) =>
                                setBloodGroup(e.target.value)
                            }
                        >

                            <option value="">
                                All Blood Groups
                            </option>

                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>

                        </select>

                    </div>


                    <div className="search-field">

                        <label>
                            Location
                        </label>

                        <input
                            type="text"
                            placeholder="Enter city or location"
                            value={location}
                            onChange={(e) =>
                                setLocation(e.target.value)
                            }
                        />

                    </div>


                    <button
                        type="submit"
                        className="search-button"
                    >
                        🔍 Search Donors
                    </button>

                </form>


                {/* RESULTS HEADER */}

                <div className="results-header">

                    <div>

                        <h2>
                            Available Donors
                        </h2>

                        <p>
                            {donors.length} donor
                            {donors.length !== 1 ? "s" : ""}
                            found
                        </p>

                    </div>

                    <button
                        className="clear-button"
                        onClick={() => {

                            setBloodGroup("");
                            setLocation("");

                            setTimeout(() => {
                                fetchDonors();
                            }, 0);

                        }}
                    >
                        Clear Filters
                    </button>

                </div>


                {/* ERROR */}

                {error && (
                    <div className="donor-error">
                        {error}
                    </div>
                )}


                {/* LOADING */}

                {loading && (
                    <div className="donor-loading">
                        Finding donors...
                    </div>
                )}


                {/* DONORS */}

                {!loading && donors.length > 0 && (

                    <div className="donors-grid">

                        {donors.map((donor) => (
                            <DonorCard
                                key={donor.id}
                                donor={donor}
                            />
                        ))}

                    </div>

                )}


                {/* EMPTY */}

                {!loading && donors.length === 0 && !error && (

                    <div className="empty-donors">

                        <div>
                            🩸
                        </div>

                        <h3>
                            No donors found
                        </h3>

                        <p>
                            Try changing your blood group
                            or location.
                        </p>

                    </div>

                )}

            </main>

        </div>
    );
}

export default FindDonors;