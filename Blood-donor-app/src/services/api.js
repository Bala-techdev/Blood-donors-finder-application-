import axios from "axios";

const api = axios.create({
     baseURL: "http://localhost:8080",
    // baseURL: "/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor: retrieve JWT token from localStorage and append Bearer header
api.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem("bloodDonorToken") ||
            localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Seamlessly route endpoints that start with or without "/api"
        if (
            config.url &&
            !config.url.startsWith("http://") &&
            !config.url.startsWith("https://")
        ) {
            if (!config.url.startsWith("/api")) {
                config.url = `/api${config.url.startsWith("/") ? "" : "/"}${config.url}`;
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: catch 401/403 errors and cleanly redirect to /login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response &&
            (error.response.status === 401 || error.response.status === 403)
        ) {
            const isLoginRequest = error.config?.url?.includes("/auth/login");
            const isAuthPage =
                window.location.pathname === "/login" ||
                window.location.pathname === "/register";

            if (!isLoginRequest && !isAuthPage) {
                localStorage.removeItem("bloodDonorToken");
                localStorage.removeItem("bloodDonorUser");
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default api;
