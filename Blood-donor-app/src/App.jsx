import { BrowserRouter, Routes, Route } from "react-router-dom";
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
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/donors" element={<FindDonors />} />
                <Route
                        path="/donors/:id"
                        element={<DonorProfile />}
                    />

                <Route
                    path="/requests/create"
                    element={<CreateRequest />}
                />
                <Route
                    path="/requests"
                    element={<BloodRequests />}
                />
                <Route
                    path="/profile"
                    element={<Profile />}
                />
                <Route
                    path="/notifications"
                    element={<Notifications />}
                />
             </Routes>
        </BrowserRouter>
    );
}

export default App;