import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import DonorCard from "../../components/navbar/donor/DonorCard";
import "./FindDonors.css";

const COMPATIBLE_DONORS = {
    "A+": ["A+", "A-", "O+", "O-"],
    "A-": ["A-", "O-"],
    "B+": ["B+", "B-", "O+", "O-"],
    "B-": ["B-", "O-"],
    "AB+": ["All Blood Groups (Universal Recipient)"],
    "AB-": ["AB-", "A-", "B-", "O-"],
    "O+": ["O+", "O-"],
    "O-": ["O- (Universal Donor Only)"]
};

const QUICK_CITY_COORDS = [
    { label: "Chennai", lat: 13.0827, lng: 80.2707 },
    { label: "Coimbatore", lat: 11.0168, lng: 76.9558 },
    { label: "Madurai", lat: 9.9252, lng: 78.1198 },
    { label: "Tiruchirappalli", lat: 10.7905, lng: 78.7047 }
];

function FindDonors() {
    const [donors, setDonors] = useState([]);
    const [bloodGroup, setBloodGroup] = useState("");
    const [location, setLocation] = useState("");
    const [onlyAvailable, setOnlyAvailable] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [smartMatching, setSmartMatching] = useState(false);

    // =========================
    // GPS STATE
    // =========================
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [locationDetected, setLocationDetected] = useState(false);
    const [radius, setRadius] = useState("10");
    const [gpsLoading, setGpsLoading] = useState(false);

    // =========================
    // EXISTING DONOR SEARCH
    // =========================
    const fetchDonors = async (
        overrideBloodGroup = bloodGroup,
        overrideLocation = location
    ) => {
        try {
            setLoading(true);
            setError("");
            setSmartMatching(false);

            const params = {};
            if (overrideBloodGroup) {
                params.bloodGroup = overrideBloodGroup;
            }
            if (overrideLocation) {
                params.location = overrideLocation;
            }

            const response = await api.get("/donors/search", { params });
            setDonors(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error(err);
            setError("Unable to load donors. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // GET USER GPS LOCATION
    // =========================
    const getMyLocation = () => {
        setError("");
        setGpsLoading(true);

        if (!navigator.geolocation) {
            setError(
                "Geolocation is not supported by your browser. Select a city preset below."
            );
            setGpsLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLatitude = position.coords.latitude;
                const userLongitude = position.coords.longitude;

                setLatitude(userLatitude);
                setLongitude(userLongitude);
                setLocationDetected(true);
                setGpsLoading(false);
            },
            (geoError) => {
                console.error("GPS error:", geoError);
                let message =
                    "Unable to detect browser GPS. You can click a quick city preset below instead.";

                if (geoError.code === 1) {
                    message =
                        "Location permission denied. Click a quick city preset below or allow browser location access.";
                } else if (geoError.code === 2) {
                    message =
                        "Your location could not be determined. Use a quick city preset below.";
                } else if (geoError.code === 3) {
                    message =
                        "Location request timed out. Use a quick city preset below.";
                }

                setError(message);
                setGpsLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    // =========================
    // APPLY CITY PRESET GPS
    // =========================
    const applyCityCoords = (city) => {
        setError("");
        setLatitude(city.lat);
        setLongitude(city.lng);
        setLocation(city.label);
        setLocationDetected(true);
    };

    // =========================
    // FIND NEARBY DONORS
    // =========================
    const findNearbyDonors = async () => {
        setError("");

        if (latitude === null || longitude === null) {
            setError(
                "Please click 'Use My Location' or select a city preset first."
            );
            return;
        }

        try {
            setLoading(true);
            setSmartMatching(false);

            const response = await api.get("/donors/nearby", {
                params: {
                    latitude: latitude,
                    longitude: longitude,
                    radius: Number(radius)
                }
            });

            let nearbyDonors = Array.isArray(response.data)
                ? response.data
                : [];

            if (bloodGroup) {
                nearbyDonors = nearbyDonors.filter(
                    (donor) => donor.bloodGroup === bloodGroup
                );
            }

            setDonors(nearbyDonors);
        } catch (err) {
            console.error("Nearby donor search error:", err);
            setError("Unable to find nearby donors. Please try again.");
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

            if (!bloodGroup) {
                setError(
                    "Please select a blood group above before running Smart Donor Matching."
                );
                setLoading(false);
                return;
            }

            // Use detected GPS or fallback to Chennai/Coimbatore coordinates so demo never blocks
            const activeLat = latitude !== null ? latitude : 13.0827;
            const activeLng = longitude !== null ? longitude : 80.2707;

            if (latitude === null || longitude === null) {
                setLatitude(activeLat);
                setLongitude(activeLng);
                setLocationDetected(true);
            }

            const requestData = {
                bloodGroup: bloodGroup,
                location: location || "Chennai",
                latitude: activeLat,
                longitude: activeLng
            };

            const response = await api.post("/donors/match", requestData);

            const recommendedDonors = (response.data || []).map((item) => ({
                ...item.donor,
                name: item.donor?.user?.name || item.donor?.name || "Blood Donor",
                matchScore: item.score,
                distance: item.distance,
                responseProbability: item.responseProbability,
                explanation: item.explanation,
                ruleBasedScore: item.ruleBasedScore,
                urgencyBoost: item.urgencyBoost,
                responsePredictionAvailable: item.responsePredictionAvailable,
                responseModelVersion: item.responseModelVersion,
                factualReasons: item.factualReasons,
                predictionReasons: item.predictionReasons
            }));

            setDonors(recommendedDonors);
            setSmartMatching(true);
        } catch (err) {
            console.error("Smart matching error:", err);
            setError("Unable to find recommended donors. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDonors();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchDonors(bloodGroup, location);
    };

    const handleClear = () => {
        setBloodGroup("");
        setLocation("");
        setOnlyAvailable(false);
        setSmartMatching(false);
        setLatitude(null);
        setLongitude(null);
        setLocationDetected(false);
        setRadius("10");
        setError("");
        fetchDonors("", "");
    };

    const displayedDonors = onlyAvailable
        ? donors.filter((d) => d.available !== false)
        : donors;

    const availableCount = donors.filter((d) => d.available !== false).length;
    const verifiedCount = donors.filter((d) => d.verified).length;
    const compatibleList = COMPATIBLE_DONORS[bloodGroup] || [];

    return (
        <div className="find-donors-page">
            {/* =========================
                HEADER
            ========================= */}
            <header className="donors-header">
                <div className="donors-header-inner">
                    <Link to="/dashboard" className="back-dashboard">
                        ← Dashboard
                    </Link>

                    <div className="donors-title">
                        <span>FIND BLOOD DONORS</span>
                        <h1>Find the Right Donor</h1>
                        <p>
                            Search verified donors near you using GPS radius or AI-powered Smart Matching.
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
                <form className="donor-search" onSubmit={handleSearch}>
                    <div className="search-field">
                        <label>Blood Group</label>
                        <select
                            value={bloodGroup}
                            onChange={(e) => setBloodGroup(e.target.value)}
                        >
                            <option value="">All Blood Groups</option>
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
                        <label>Location / City</label>
                        <input
                            type="text"
                            placeholder="Enter city or location (e.g., Chennai)"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="search-button">
                        🔍 Search Donors
                    </button>
                </form>

                {/* COMPATIBILITY HELPER */}
                {compatibleList.length > 0 && (
                    <div
                        style={{
                            marginTop: "14px",
                            padding: "10px 16px",
                            background: "#fff1f2",
                            borderLeft: "4px solid #e11d48",
                            borderRadius: "8px",
                            color: "#881337",
                            fontSize: "13px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "8px"
                        }}
                    >
                        <span>
                            <strong>
                                💡 Patient with {bloodGroup} can receive blood from:
                            </strong>{" "}
                            {compatibleList.join(" • ")}
                        </span>
                    </div>
                )}

                {/* =========================
                    GPS NEARBY DONOR SEARCH
                ========================= */}
                <div className="smart-match-box" style={{ marginTop: "20px" }}>
                    <div className="smart-match-info">
                        <span className="smart-match-icon">📍</span>
                        <div>
                            <h3>GPS Nearby Donor Search</h3>
                            <p>
                                Find available donors within a specific kilometer radius of your coordinates.
                            </p>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "center",
                            flexWrap: "wrap",
                            marginTop: "15px"
                        }}
                    >
                        <button
                            type="button"
                            className="smart-match-button"
                            onClick={getMyLocation}
                            disabled={gpsLoading}
                        >
                            {gpsLoading
                                ? "Detecting GPS..."
                                : "📍 Use My Location"}
                        </button>

                        <select
                            value={radius}
                            onChange={(e) => setRadius(e.target.value)}
                            disabled={!locationDetected}
                            style={{
                                padding: "10px 14px",
                                borderRadius: "8px",
                                border: "1px solid #ddd"
                            }}
                        >
                            <option value="5">Within 5 km</option>
                            <option value="10">Within 10 km</option>
                            <option value="25">Within 25 km</option>
                            <option value="50">Within 50 km</option>
                        </select>

                        <button
                            type="button"
                            className="smart-match-button"
                            onClick={findNearbyDonors}
                            disabled={loading || !locationDetected}
                        >
                            {loading ? "Finding..." : "🔎 Find Nearby Donors"}
                        </button>
                    </div>

                    {/* QUICK CITY GPS PRESETS FOR DEMO RELIABILITY */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                            marginTop: "12px",
                            paddingTop: "10px",
                            borderTop: "1px dashed #e2e8f0"
                        }}
                    >
                        <small style={{ color: "#64748b", fontWeight: "600" }}>
                            ⚡ Quick City GPS Presets:
                        </small>
                        {QUICK_CITY_COORDS.map((city) => (
                            <button
                                key={city.label}
                                type="button"
                                onClick={() => applyCityCoords(city)}
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: "999px",
                                    border: "1px solid #cbd5e1",
                                    background:
                                        location === city.label
                                            ? "#eff6ff"
                                            : "#fff",
                                    color:
                                        location === city.label
                                            ? "#1d4ed8"
                                            : "#475569",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    cursor: "pointer"
                                }}
                            >
                                📍 {city.label}
                            </button>
                        ))}
                    </div>

                    {locationDetected &&
                        latitude !== null &&
                        longitude !== null && (
                            <p
                                style={{
                                    marginTop: "10px",
                                    color: "#15803d",
                                    fontWeight: "600",
                                    fontSize: "13px"
                                }}
                            >
                                ✓ Active Coordinates: {latitude.toFixed(4)},{" "}
                                {longitude.toFixed(4)}
                                {location ? ` (${location})` : ""}
                            </p>
                        )}
                </div>

                {/* =========================
                    SMART MATCHING
                ========================= */}
                <div className="smart-match-box">
                    <div className="smart-match-info">
                        <span className="smart-match-icon">🤖</span>
                        <div>
                            <h3>AI Smart Donor Matching</h3>
                            <p>
                                Rank donors using blood compatibility, availability, verification, experience, distance, and ML response probability.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="smart-match-button"
                        onClick={findBestMatches}
                        disabled={loading}
                    >
                        {loading ? "Analyzing..." : "🤖 Find Best Matches"}
                    </button>
                </div>

                {/* =========================
                    RESULTS HEADER & STATS BAR
                ========================= */}
                <div className="results-header">
                    <div>
                        <h2>
                            {smartMatching
                                ? "🤖 AI Recommended Donors"
                                : "Available Donors"}
                        </h2>
                        <p>
                            {displayedDonors.length} donor
                            {displayedDonors.length !== 1 ? "s" : ""}{" "}
                            {smartMatching ? "ranked by AI score" : "found"} •{" "}
                            <span style={{ color: "#16a34a", fontWeight: 600 }}>
                                {availableCount} Available
                            </span>{" "}
                            •{" "}
                            <span style={{ color: "#2563eb", fontWeight: 600 }}>
                                {verifiedCount} Verified
                            </span>
                        </p>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            flexWrap: "wrap"
                        }}
                    >
                        <label
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "13px",
                                fontWeight: "600",
                                color: "#334155",
                                cursor: "pointer"
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={onlyAvailable}
                                onChange={(e) =>
                                    setOnlyAvailable(e.target.checked)
                                }
                            />
                            Available Only
                        </label>

                        <button
                            type="button"
                            className="clear-button"
                            onClick={handleClear}
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* =========================
                    ERROR
                ========================= */}
                {error && <div className="donor-error">{error}</div>}

                {/* =========================
                    LOADING
                ========================= */}
                {loading && (
                    <div className="donor-loading">
                        {smartMatching
                            ? "🤖 Running AI model & ranking best donors..."
                            : "Finding donors..."}
                    </div>
                )}

                {/* =========================
                    DONORS GRID
                ========================= */}
                {!loading && displayedDonors.length > 0 && (
                    <div className="donors-grid">
                        {displayedDonors.map((donor, idx) => (
                            <div
                                key={donor.id ?? idx}
                                className={
                                    smartMatching ? "recommended-donor" : ""
                                }
                            >
                                {/* Match Score Badge */}
                                {smartMatching && (
                                    <div className="match-badge">
                                        #{idx + 1} • ⭐{" "}
                                        {Number(donor.matchScore ?? 0).toFixed(0)}% Match
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
                                            {donor.distance != null &&
                                            donor.distance < 999
                                                ? `${Number(
                                                      donor.distance
                                                  ).toFixed(1)} km`
                                                : "Distance N/A"}
                                        </span>

                                        {donor.responsePredictionAvailable &&
                                            donor.responseProbability != null && (
                                                <span
                                                    style={{
                                                        color: "#047857",
                                                        fontWeight: "700"
                                                    }}
                                                >
                                                    🤖{" "}
                                                    {Number(
                                                        donor.responseProbability
                                                    ).toFixed(0)}
                                                    % ML Response
                                                </span>
                                            )}

                                        <span>
                                            {donor.available
                                                ? "🟢 Available"
                                                : "🔴 Unavailable"}
                                        </span>

                                        <span>
                                            {donor.verified
                                                ? "✓ Verified"
                                                : "Not Verified"}
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
                {!loading && displayedDonors.length === 0 && !error && (
                    <div className="empty-donors">
                        <div>🩸</div>
                        <h3>No donors found</h3>
                        <p>
                            Try changing your blood group, location, or clearing active filters.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default FindDonors;