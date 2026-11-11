import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import FindDonors from "./pages/donors/FindDonors";
import DonorProfile from "./pages/donors/DonorProfile";
import CreateRequest from "./pages/requests/CreateRequest";
import BloodRequests from "./pages/requests/BloodRequests";
import Profile from "./pages/profile/Profile";
import Notifications from "./pages/notifications/Notifications";
import RequestDetails from "./pages/requests/RequestDetails";
import EmergencyDashboard from "./pages/emergency/EmergencyDashboard";
import DonorRecommendations from "./pages/notifications/DonorRecommendations";
import HealthSidebar from "./components/guidelines/HealthSidebar";

function App() {
    return (
        <BrowserRouter>
            <div className="app-shell">
                {/* Global floating health guidelines sidebar */}
                <HealthSidebar />

                <Routes>
                    {/* Core Landing & Authentication */}
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />

                    {/* Dashboard & Triage */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/emergency" element={<EmergencyDashboard />} />

                    {/* Donors & Matching */}
                    <Route path="/donors" element={<FindDonors />} />
                    <Route path="/donors/:id" element={<DonorProfile />} />
                    <Route path="/donor/:id" element={<DonorProfile />} />

                    {/* Blood Requests */}
                    <Route path="/requests" element={<BloodRequests />} />
                    <Route path="/requests/create" element={<CreateRequest />} />
                    <Route path="/requests/new" element={<CreateRequest />} />
                    <Route path="/requests/:id" element={<RequestDetails />} />
                    <Route path="/request/:id" element={<RequestDetails />} />

                    {/* User Profile, Notifications & Recommendations */}
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/recommendations" element={<DonorRecommendations />} />

                    {/* Catch-all route prevents blank screens on unknown paths */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
