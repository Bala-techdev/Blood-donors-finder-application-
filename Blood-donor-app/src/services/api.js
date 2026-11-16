import axios from "axios";

export const API_BASE_URL =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
    "http://localhost:8080";

// In-memory token cache (Item 9: secure token storage)
let inMemoryToken =
    typeof localStorage !== "undefined"
        ? localStorage.getItem("bloodDonorToken")
        : null;

export const setAccessToken = (token) => {
    inMemoryToken = token;
    if (typeof localStorage !== "undefined") {
        if (token) {
            localStorage.setItem("bloodDonorToken", token);
        } else {
            localStorage.removeItem("bloodDonorToken");
        }
    }
};

export const getAccessToken = () => inMemoryToken;

export const clearAuthSession = () => {
    inMemoryToken = null;
    if (typeof localStorage !== "undefined") {
        localStorage.removeItem("bloodDonorToken");
        localStorage.removeItem("bloodDonorUser");
    }
};

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Enables HttpOnly refresh cookie handling
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Check if the target request URL is safe to receive our Bearer token.
 * Prevents token leakage to external third-party hosts.
 */
export const isInternalApiUrl = (url, baseURL = API_BASE_URL) => {
    if (!url) return false;
    if (url.startsWith("/") && !url.startsWith("//")) return true;

    try {
        const targetHost = new URL(url, baseURL).host;
        const defaultOrigin =
            typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
        const apiHost = new URL(baseURL, defaultOrigin).host;
        return targetHost === apiHost;
    } catch {
        return false;
    }
};

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();

        // Attach Authorization only to verified internal endpoints
        if (token && isInternalApiUrl(config.url, config.baseURL || API_BASE_URL)) {
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

// Response interceptor with 401 refresh token retry mechanism (Item 4 & 9)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        const isAuthEndpoint =
            originalRequest.url?.includes("/auth/login") ||
            originalRequest.url?.includes("/auth/refresh") ||
            originalRequest.url?.includes("/auth/logout");

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Call refresh endpoint with withCredentials: true so HttpOnly cookie is attached
                const response = await axios.post(
                    `${API_BASE_URL}/api/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const newToken = response.data?.token;
                if (!newToken) {
                    throw new Error("No token returned by refresh endpoint");
                }

                setAccessToken(newToken);
                processQueue(null, newToken);

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearAuthSession();

                const isAuthPage =
                    window.location.pathname === "/login" ||
                    window.location.pathname === "/register";

                if (!isAuthPage) {
                    window.location.href = "/login";
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
