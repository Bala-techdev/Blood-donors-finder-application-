
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

    const [smartMatching, setSmartMatching] = useState(false);


    // =========================
    // EXISTING DONOR SEARCH
    // =========================

    const fetchDonors = async () => {

        try {

            setLoading(true);
            setError("");
            setSmartMatching(false);

            const params = {};

            if (bloodGroup) {
                params.bloodGroup = bloodGroup;
            }

            if (location) {
                params.location = location;
            }

            const response = await api.get(
                "/donors/search",
                {
                    params
                }
            );

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


    // =========================
    // SMART DONOR MATCHING
    // =========================

  const findBestMatches = async () => {

    try {

        setLoading(true);
        setError("");

        // Blood group is required
        if (!bloodGroup) {

            setError(
                "Please select a blood group first."
            );

            setLoading(false);

            return;
        }


        /*
         * Temporary Coimbatore coordinates.
         *
         * Later we will replace these with
         * the actual user's GPS coordinates.
         */
        const requestData = {

            bloodGroup: bloodGroup,

            location: location,

            latitude: 11.0168,

            longitude: 76.9558

        };


        console.log(
            "Smart Match Request:",
            requestData
        );


        // Call Smart Matching API
        const response = await api.post(
            "/donors/match",
            requestData
        );


        console.log(
            "Smart Match Raw Response:",
            response.data
        );


        /*
         * Backend response:
         *
         * {
         *     donor: {...},
         *     score: 100,
         *     distance: 0
         * }
         *
         * Convert it into the structure
         * expected by DonorCard.
         */
const recommendedDonors =
    response.data.map((item) => {

        return {

            // Existing donor information
            ...item.donor,

            // Donor name
            name:
                item.donor.user?.name ||
                "Blood Donor",

            // Final SmartBlood score
            matchScore:
                item.score,

            // Distance
            distance:
                item.distance,

            // ML prediction
            responseProbability:
                item.responseProbability

        };

    });

        console.log(
            "Processed Recommended Donors:",
            recommendedDonors
        );


        setDonors(recommendedDonors);

        setSmartMatching(true);


    } catch (err) {

        console.error(
            "Smart matching error:",
            err
        );

        setError(
            "Unable to find recommended donors. Please try again."
        );

    } finally {

        setLoading(false);

    }
};
    // =========================
    // INITIAL LOAD
    // =========================

    useEffect(() => {

        fetchDonors();

    }, []);


    // =========================
    // NORMAL SEARCH
    // =========================

    const handleSearch = (e) => {

        e.preventDefault();

        fetchDonors();

    };


    // =========================
    // CLEAR FILTERS
    // =========================

    const handleClear = () => {

        setBloodGroup("");
        setLocation("");
        setSmartMatching(false);

        // Load all donors again
        setTimeout(() => {

            fetchDonors();

        }, 0);

    };


    return (

        <div className="find-donors-page">

            {/* =========================
                HEADER
            ========================= */}

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


            {/* =========================
                MAIN
            ========================= */}

            <main className="donors-main">


                {/* =========================
                    NORMAL SEARCH
                ========================= */}

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
                                setBloodGroup(
                                    e.target.value
                                )
                            }
                        >

                            <option value="">
                                All Blood Groups
                            </option>

                            <option value="A+">
                                A+
                            </option>

                            <option value="A-">
                                A-
                            </option>

                            <option value="B+">
                                B+
                            </option>

                            <option value="B-">
                                B-
                            </option>

                            <option value="AB+">
                                AB+
                            </option>

                            <option value="AB-">
                                AB-
                            </option>

                            <option value="O+">
                                O+
                            </option>

                            <option value="O-">
                                O-
                            </option>

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
                                setLocation(
                                    e.target.value
                                )
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


                {/* =========================
                    SMART MATCHING
                ========================= */}

                <div className="smart-match-box">

                    <div className="smart-match-info">

                        <span className="smart-match-icon">
                            ✨
                        </span>

                        <div>

                            <h3>
                                Smart Donor Matching
                            </h3>

                            <p>
                                Find the most suitable donors
                                using blood compatibility,
                                availability, verification,
                                experience and distance.
                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        className="smart-match-button"
                        onClick={findBestMatches}
                        disabled={loading}
                    >

                        {loading
                            ? "Finding..."
                            : "Find Best Matches"
                        }

                    </button>

                </div>


                {/* =========================
                    RESULTS HEADER
                ========================= */}

                <div className="results-header">

                    <div>

                        <h2>

                            {smartMatching
                                ? "Recommended Donors"
                                : "Available Donors"
                            }

                        </h2>

                        <p>

                            {donors.length} donor
                            {donors.length !== 1
                                ? "s"
                                : ""
                            }

                            {" "}

                            {smartMatching
                                ? "recommended"
                                : "found"
                            }

                        </p>

                    </div>


                    <button
                        type="button"
                        className="clear-button"
                        onClick={handleClear}
                    >
                        Clear Filters
                    </button>

                </div>


                {/* =========================
                    ERROR
                ========================= */}

                {error && (

                    <div className="donor-error">
                        {error}
                    </div>

                )}


                {/* =========================
                    LOADING
                ========================= */}

                {loading && (

                    <div className="donor-loading">

                        {smartMatching
                            ? "Finding the best donors..."
                            : "Finding donors..."
                        }

                    </div>

                )}


                {/* =========================
                    DONORS
                ========================= */}

                {!loading &&
                    donors.length > 0 && (

                    <div className="donors-grid">

                        {donors.map((donor) => (

                            <div
                                key={donor.id}
                                className={
                                    smartMatching
                                        ? "recommended-donor"
                                        : ""
                                }
                            >

                                {/* Match Score */}

                                {smartMatching && (

                                    <div className="match-badge">

                                        ⭐{" "}
                                        {donor.matchScore ?? 0}%

                                    </div>

                                )}


                                {/* Donor Card */}

                                    <DonorCard
                                        donor={donor}
                                        smartMatch={smartMatching}
                                    />

                                {/* Smart Match Details */}

                                {smartMatching && (

                                    <div className="smart-donor-details">

                                        <span>
                                            📏{" "}
                                            {donor.distance != null
                                                ? Number(
                                                    donor.distance
                                                ).toFixed(2)
                                                : "—"
                                            } km
                                        </span>


                                        <span>
                                            {donor.available
                                                ? "🟢 Available"
                                                : "🔴 Unavailable"
                                            }
                                        </span>


                                        <span>
                                            {donor.verified
                                                ? "✓ Verified"
                                                : "Not Verified"
                                            }
                                        </span>

                                    </div>

                                )}

                            </div>

                        ))}

                    </div>

                )}


                {/* =========================
                    EMPTY STATE
                ========================= */}

                {!loading &&
                    donors.length === 0 &&
                    !error && (

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
