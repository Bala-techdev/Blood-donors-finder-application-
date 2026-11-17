import { useState, useEffect } from "react";
import api from "../../services/api";
import "./OtpVerificationModal.css";

export default function OtpVerificationModal({
    isOpen,
    onClose,
    onSuccess,
    initialEmail = ""
}) {
    const storedUser = localStorage.getItem("bloodDonorUser");
    let currentUser = null;
    try {
        currentUser = storedUser ? JSON.parse(storedUser) : null;
    } catch {
        currentUser = null;
    }

    const emailToUse = initialEmail || currentUser?.email || "";

    const [otp, setOtp] = useState("");
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [devHint, setDevHint] = useState("");

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setOtp("");
            setErrorMessage("");
            setStatusMessage("");
            setDevHint("");
            // Auto trigger send on open
            handleSendOtp();
        }
    }, [isOpen]);

    // Countdown timer for resend
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    if (!isOpen) return null;

    const handleSendOtp = async () => {
        if (!emailToUse) {
            setErrorMessage("No email address found. Please ensure you are logged in.");
            return;
        }

        try {
            setSending(true);
            setErrorMessage("");
            setStatusMessage("");

            const response = await api.post("/api/auth/send-verification-otp", {
                email: emailToUse.trim().toLowerCase()
            });

            setStatusMessage(
                response.data?.message ||
                `A 6-digit verification code has been dispatched to ${emailToUse}.`
            );

            if (response.data?.devOtpHint) {
                setDevHint(response.data.devOtpHint);
                setOtp(response.data.devOtpHint); // convenience autofill in dev mode
            }

            setCountdown(60);
        } catch (err) {
            console.error("Failed to send OTP:", err);
            setErrorMessage(
                err.response?.data?.message ||
                "Failed to send OTP. Please check server logs or try again."
            );
        } finally {
            setSending(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();

        if (!otp || otp.trim().length !== 6) {
            setErrorMessage("Please enter the complete 6-digit verification code.");
            return;
        }

        try {
            setVerifying(true);
            setErrorMessage("");

            await api.post("/api/auth/verify-otp", {
                email: emailToUse.trim().toLowerCase(),
                otp: otp.trim()
            });

            // Update local user state
            if (currentUser) {
                currentUser.emailVerified = true;
                localStorage.setItem("bloodDonorUser", JSON.stringify(currentUser));
            }

            setStatusMessage("Email verified successfully! Unlocking donor search...");

            setTimeout(() => {
                if (onSuccess) onSuccess();
                onClose();
            }, 1200);
        } catch (err) {
            console.error("Verification failed:", err);
            setErrorMessage(
                err.response?.data?.message ||
                "Invalid or expired verification code. Please request a new one."
            );
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="otp-modal-overlay" onClick={onClose}>
            <div className="otp-modal-card" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    className="otp-modal-close"
                    onClick={onClose}
                    aria-label="Close modal"
                >
                    &times;
                </button>

                <div className="otp-modal-icon">🛡️</div>

                <h2>Verify Your Email</h2>
                <p className="otp-modal-subtitle">
                    To prevent spam and protect donor contact privacy, please verify your email address before searching or viewing donors.
                </p>

                <div className="otp-email-chip">
                    <span>Account Email:</span>
                    <strong>{emailToUse || "Not specified"}</strong>
                </div>

                {devHint && (
                    <div className="otp-dev-hint">
                        <span>🧪 <strong>Demo Mode:</strong> OTP logged to server console: <code>{devHint}</code></span>
                    </div>
                )}

                {statusMessage && (
                    <div className="otp-alert success" role="alert">
                        {statusMessage}
                    </div>
                )}

                {errorMessage && (
                    <div className="otp-alert error" role="alert">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleVerifyOtp} className="otp-form">
                    <label htmlFor="otp-input" className="otp-label">
                        Enter 6-Digit Verification Code
                    </label>

                    <input
                        id="otp-input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        placeholder="••••••"
                        value={otp}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setOtp(val);
                        }}
                        autoFocus
                        disabled={verifying}
                        className="otp-digit-input"
                    />

                    <button
                        type="submit"
                        className="otp-verify-button"
                        disabled={verifying || otp.length !== 6}
                    >
                        {verifying ? "Verifying..." : "✓ Confirm & Verify"}
                    </button>
                </form>

                <div className="otp-resend-row">
                    <span>Didn't receive the code?</span>
                    {countdown > 0 ? (
                        <span className="otp-countdown">Resend in {countdown}s</span>
                    ) : (
                        <button
                            type="button"
                            className="otp-resend-button"
                            onClick={handleSendOtp}
                            disabled={sending}
                        >
                            {sending ? "Sending..." : "Resend Code"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
