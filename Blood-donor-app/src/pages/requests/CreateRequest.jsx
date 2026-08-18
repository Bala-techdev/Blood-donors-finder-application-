import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./CreateRequest.css";

function CreateRequest() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        patientName: "",
        bloodGroup: "",
        units: 1,
        hospitalName: "",
        location: "",
        urgency: "NORMAL",
        requiredDate: "",
        description: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };


    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        // Basic validation
        if (
            !formData.patientName ||
            !formData.bloodGroup ||
            !formData.hospitalName ||
            !formData.location ||
            !formData.requiredDate
        ) {
            setError("Please fill all required fields.");
            return;
        }


        try {

            setLoading(true);

            // Get logged-in user
            const storedUser =
                localStorage.getItem("bloodDonorUser");

            if (!storedUser) {
                setError("Please login before creating a blood request.");
                return;
            }

            const user = JSON.parse(storedUser);


            // Data expected by Spring Boot
            const requestData = {

                requester: {
                    id: user.id
                },

                patientName: formData.patientName,

                bloodGroup: formData.bloodGroup,

                units: Number(formData.units),

                hospitalName: formData.hospitalName,

                location: formData.location,

                urgency: formData.urgency,

                requiredDate: formData.requiredDate,

                description: formData.description

            };


            console.log(
                "Sending blood request:",
                requestData
            );


            // Correct backend endpoint
            await api.post(
                "/requests",
                requestData
            );


            setSuccess(
                "Blood request created successfully!"
            );


            setTimeout(() => {
                navigate("/requests");
            }, 1200);


        } catch (err) {

            console.error(
                "Blood request error:",
                err
            );

            if (err.response?.data?.message) {

                setError(
                    err.response.data.message
                );

            } else if (err.response?.data) {

                console.error(
                    "Backend response:",
                    err.response.data
                );

                setError(
                    "Unable to create blood request. Check backend console."
                );

            } else {

                setError(
                    "Unable to create blood request."
                );

            }

        } finally {

            setLoading(false);

        }

    };


    return (
        <div className="create-request-page">

            {/* ================= HEADER ================= */}

            <header className="request-page-header">

                <Link
                    to="/dashboard"
                    className="request-back"
                >
                    ← Dashboard
                </Link>


                <div className="request-header-title">

                    <span>
                        BLOOD DONATION
                    </span>

                    <h1>
                        Create Blood Request
                    </h1>

                    <p>
                        Tell nearby donors what kind of blood
                        you need.
                    </p>

                </div>

            </header>


            {/* ================= MAIN ================= */}

            <main className="create-request-main">


                {/* ================= FORM ================= */}

                <div className="request-form-card">


                    {error && (
                        <div className="request-error">
                            {error}
                        </div>
                    )}


                    {success && (
                        <div className="request-success">
                            {success}
                        </div>
                    )}


                    <form onSubmit={handleSubmit}>


                        {/* PATIENT */}

                        <div className="form-section-title">

                            <span>
                                01
                            </span>

                            Patient Information

                        </div>


                        <div className="request-form-group">

                            <label>
                                Patient Name *
                            </label>

                            <input
                                type="text"
                                name="patientName"
                                placeholder="Enter patient name"
                                value={formData.patientName}
                                onChange={handleChange}
                            />

                        </div>


                        <div className="request-form-row">


                            <div className="request-form-group">

                                <label>
                                    Blood Group *
                                </label>

                                <select
                                    name="bloodGroup"
                                    value={formData.bloodGroup}
                                    onChange={handleChange}
                                >

                                    <option value="">
                                        Select blood group
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


                            <div className="request-form-group">

                                <label>
                                    Units Required *
                                </label>

                                <input
                                    type="number"
                                    name="units"
                                    min="1"
                                    max="10"
                                    value={formData.units}
                                    onChange={handleChange}
                                />

                            </div>

                        </div>


                        {/* HOSPITAL */}

                        <div className="form-section-title">

                            <span>
                                02
                            </span>

                            Hospital Information

                        </div>


                        <div className="request-form-group">

                            <label>
                                Hospital Name *
                            </label>

                            <input
                                type="text"
                                name="hospitalName"
                                placeholder="Enter hospital name"
                                value={formData.hospitalName}
                                onChange={handleChange}
                            />

                        </div>


                        <div className="request-form-group">

                            <label>
                                Location *
                            </label>

                            <input
                                type="text"
                                name="location"
                                placeholder="City / Area"
                                value={formData.location}
                                onChange={handleChange}
                            />

                        </div>


                        {/* REQUIREMENT */}

                        <div className="form-section-title">

                            <span>
                                03
                            </span>

                            Blood Requirement

                        </div>


                        <div className="request-form-row">


                            <div className="request-form-group">

                                <label>
                                    Urgency
                                </label>

                                <select
                                    name="urgency"
                                    value={formData.urgency}
                                    onChange={handleChange}
                                >

                                    <option value="NORMAL">
                                        Normal
                                    </option>

                                    <option value="URGENT">
                                        Urgent
                                    </option>

                                    <option value="EMERGENCY">
                                        Emergency
                                    </option>

                                </select>

                            </div>


                            <div className="request-form-group">

                                <label>
                                    Required Date *
                                </label>

                                <input
                                    type="date"
                                    name="requiredDate"
                                    value={formData.requiredDate}
                                    onChange={handleChange}
                                />

                            </div>

                        </div>


                        <div className="request-form-group">

                            <label>
                                Additional Information
                            </label>

                            <textarea
                                name="description"
                                rows="4"
                                placeholder="Add any additional information..."
                                value={formData.description}
                                onChange={handleChange}
                            />

                        </div>


                        {/* ACTIONS */}

                        <div className="request-form-actions">

                            <Link
                                to="/dashboard"
                                className="cancel-request"
                            >
                                Cancel
                            </Link>


                            <button
                                type="submit"
                                className="submit-request"
                                disabled={loading}
                            >

                                {loading
                                    ? "Submitting..."
                                    : "🩸 Create Blood Request"}

                            </button>

                        </div>

                    </form>

                </div>


                {/* ================= INFO CARD ================= */}

                <aside className="request-info-card">

                    <div className="info-blood-icon">
                        🩸
                    </div>


                    <h2>
                        Need Blood Urgently?
                    </h2>


                    <p>
                        Your request will be visible to matching
                        blood donors in your area.
                    </p>


                    <div className="request-tip">

                        <strong>
                            💡 Tip
                        </strong>

                        <span>
                            Make sure your hospital and blood
                            requirement details are correct so
                            donors can respond quickly.
                        </span>

                    </div>

                </aside>

            </main>

        </div>
    );
}

export default CreateRequest;