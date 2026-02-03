import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SuperLogin() {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState("email"); // 'email' or 'otp'
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const nav = useNavigate();

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setIsLoading(true);

        if (!email.trim()) {
            setErrorMessage("Please enter your email address.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/api/superadmin-auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setErrorMessage(data.message || "Failed to send verification code");
                setIsLoading(false);
                return;
            }

            setStep("otp");
            setIsLoading(false);
        } catch {
            setErrorMessage("Could not connect to the server.");
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setIsLoading(true);

        if (!otp.trim()) {
            setErrorMessage("Please enter the verification code.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/api/superadmin-auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setErrorMessage(data.message || "Invalid verification code");
                setIsLoading(false);
                return;
            }

            // Success - Navigate to superadmin dashboard
            localStorage.setItem("superadminRole", "superadmin");
            nav("/superadmin");
        } catch {
            setErrorMessage("Verification failed.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Superadmin Access</h1>
                    <p className="text-gray-400 mt-2">
                        {step === "email"
                            ? "Restricted area. Enter authorized credentials."
                            : "Enter the verification code sent to your email."}
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
                    {step === "email" && (
                        <form onSubmit={handleRequestOtp} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter authorized email"
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition disabled:opacity-50"
                                />
                            </div>

                            {errorMessage && (
                                <div className="rounded-lg p-3 text-sm bg-red-500/20 border border-red-500/30 text-red-400">
                                    {errorMessage}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold hover:from-red-500 hover:to-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Sending...
                                    </>
                                ) : (
                                    "Request Verification Code"
                                )}
                            </button>
                        </form>
                    )}

                    {step === "otp" && (
                        <form onSubmit={handleVerifyOtp} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="000000"
                                    maxLength={6}
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest font-mono disabled:opacity-50"
                                />
                            </div>

                            <p className="text-xs text-gray-500 text-center">
                                Code sent to {email}. Valid for 5 minutes.
                            </p>

                            {errorMessage && (
                                <div className="rounded-lg p-3 text-sm bg-red-500/20 border border-red-500/30 text-red-400">
                                    {errorMessage}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold hover:from-red-500 hover:to-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify & Login"
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep("email");
                                    setOtp("");
                                    setErrorMessage("");
                                }}
                                disabled={isLoading}
                                className="w-full text-sm text-gray-400 hover:text-white transition disabled:opacity-50"
                            >
                                ← Back to Email
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-600 mt-6">
                    Protected system access. Unauthorized attempts are logged.
                </p>
            </div>
        </div>
    );
}
