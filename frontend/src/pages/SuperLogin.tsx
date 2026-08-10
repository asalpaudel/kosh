import { API_BASE } from "../lib/apiClient";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../component/icons";
import { booleanField, stringField } from "../lib/validation";

export default function SuperLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"email" | "otp">("email");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const nav = useNavigate();

    const handleRequestOtp = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        setErrorMessage("");
        setIsLoading(true);

        if (!email.trim() || !password) {
            setErrorMessage("Please enter your email address and password.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/superadmin-auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email: email.trim(), password }),
            });

            const data: unknown = await response.json();

            if (!response.ok || booleanField(data, "success") !== true) {
                setErrorMessage(stringField(data, "message") ?? "Failed to send verification code");
                setIsLoading(false);
                return;
            }

            if (stringField(data, "status") === "LOGIN_SUCCESS") {
                localStorage.setItem("superadminRole", "superadmin");
                void nav("/superadmin");
                return;
            }

            setStep("otp");
            setIsLoading(false);
        } catch {
            setErrorMessage("Could not connect to the server.");
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        setErrorMessage("");
        setIsLoading(true);

        if (!otp.trim()) {
            setErrorMessage("Please enter the verification code.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/superadmin-auth/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ otp: otp.trim() }),
            });

            const data: unknown = await response.json();

            if (!response.ok || booleanField(data, "success") !== true) {
                setErrorMessage(stringField(data, "message") ?? "Invalid verification code");
                setIsLoading(false);
                return;
            }

            // Success - Navigate to superadmin dashboard
            localStorage.setItem("superadminRole", "superadmin");
            void nav("/superadmin");
        } catch {
            setErrorMessage("Verification failed.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-teal-100">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl opacity-50" />
            </div>

            <div className="relative z-10 w-full max-w-md p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Superadmin Access</h1>
                    <p className="text-gray-500 mt-2 text-sm font-medium">
                        {step === "email"
                            ? "Restricted area. Enter authorized credentials."
                            : "Enter the verification code sent to your email."}
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 p-8 shadow-xl shadow-teal-900/5">
                    {step === "email" && (
                        <form onSubmit={(event) => { void handleRequestOtp(event); }} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(event) => { setEmail(event.target.value); }}
                                    placeholder="Enter authorized email"
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition duration-200 disabled:opacity-50 disabled:bg-gray-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) => { setPassword(event.target.value); }}
                                    placeholder="Enter password"
                                    autoComplete="current-password"
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition duration-200 disabled:opacity-50 disabled:bg-gray-100"
                                />
                            </div>

                            {errorMessage && (
                                <div className="rounded-lg p-3 text-sm bg-red-50 border border-red-100 text-red-600 flex items-center gap-2">
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {errorMessage}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold shadow-lg shadow-teal-500/30 hover:shadow-teal-500/40 hover:from-teal-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Signing in...
                                    </>
                                ) : (
                                    "Sign In"
                                )}
                            </button>
                        </form>
                    )}

                    {step === "otp" && (
                        <form onSubmit={(event) => { void handleVerifyOtp(event); }} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(event) => { setOtp(event.target.value); }}
                                    placeholder="000000"
                                    maxLength={6}
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition duration-200 text-center text-3xl tracking-[0.5em] font-mono disabled:opacity-50 disabled:bg-gray-100"
                                />
                            </div>

                            <p className="text-xs text-gray-500 text-center bg-gray-50 py-2 rounded-lg border border-gray-100">
                                Code sent to <span className="font-semibold text-gray-700">{email}</span>. Valid for 5 minutes.
                            </p>

                            {errorMessage && (
                                <div className="rounded-lg p-3 text-sm bg-red-50 border border-red-100 text-red-600 flex items-center gap-2">
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {errorMessage}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold shadow-lg shadow-teal-500/30 hover:shadow-teal-500/40 hover:from-teal-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
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
                                className="w-full text-sm font-medium text-gray-500 hover:text-teal-600 transition-colors flex items-center justify-center gap-1 group"
                            >
                                <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Email
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 mt-8">
                    Protected system access. Unauthorized attempts are logged.
                </p>
            </div>
        </div>
    );
}
