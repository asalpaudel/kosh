import { API_BASE } from "../../lib/apiClient";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SuperadminProtectedRoute({ children }) {
    const [authState, setAuthState] = useState("checking"); // 'checking' | 'authorized' | 'unauthorized'
    const [countdown, setCountdown] = useState(3);
    const nav = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch(`${API_BASE}/superadmin-auth/session`, {
                    credentials: "include",
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.authenticated) {
                        setAuthState("authorized");
                        return;
                    }
                }

                setAuthState("unauthorized");
            } catch {
                setAuthState("unauthorized");
            }
        };

        checkAuth();
    }, []);

    // Countdown and redirect for unauthorized
    useEffect(() => {
        if (authState !== "unauthorized") return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    nav("/");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [authState, nav]);

    // Loading state
    if (authState === "checking") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-gray-600 border-t-red-500 rounded-full animate-spin" />
                    <p className="text-gray-400">Verifying access...</p>
                </div>
            </div>
        );
    }

    // Unauthorized - Show warning modal
    if (authState === "unauthorized") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
                </div>

                <div className="relative z-10 text-center p-8">
                    {/* Warning Icon */}
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-500/50 mb-6 animate-pulse">
                        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    {/* Warning Message */}
                    <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
                    <p className="text-xl text-gray-300 mb-2">
                        You do not have authority to access this page.
                    </p>
                    <p className="text-gray-500 mb-8">
                        This area is restricted to authorized superadmins only.
                    </p>

                    {/* Countdown */}
                    <div className="inline-flex items-center gap-3 bg-gray-800/50 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-700">
                        <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-gray-300">
                            Redirecting to home in <span className="font-bold text-white">{countdown}</span> seconds...
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // Authorized - Render children
    return children;
}
