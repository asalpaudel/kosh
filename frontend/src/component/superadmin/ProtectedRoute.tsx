import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../lib/apiClient";
import { booleanField } from "../../lib/validation";

type AuthState = "checking" | "authorized" | "unauthorized";

export default function SuperadminProtectedRoute({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [countdown, setCountdown] = useState(3);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      try {
        const response = await fetch(`${API_BASE}/superadmin-auth/session`, { credentials: "include" });
        const body: unknown = response.ok ? await response.json() : null;
        setAuthState(booleanField(body, "authenticated") === true ? "authorized" : "unauthorized");
      } catch {
        setAuthState("unauthorized");
      }
    };
    void checkAuth();
  }, []);

  useEffect(() => {
    if (authState !== "unauthorized") return;
    const timer = window.setInterval(() => {
      setCountdown((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          void navigate("/");
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
    return () => { window.clearInterval(timer); };
  }, [authState, navigate]);

  if (authState === "checking") {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900"><div className="flex flex-col items-center gap-4"><div className="w-12 h-12 border-4 border-gray-600 border-t-red-500 rounded-full animate-spin" /><p className="text-gray-400">Verifying access...</p></div></div>;
  }
  if (authState === "unauthorized") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="relative z-10 text-center p-8">
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-xl text-gray-300 mb-2">You do not have authority to access this page.</p>
          <p className="text-gray-500 mb-8">This area is restricted to authorized superadmins only.</p>
          <div className="inline-flex items-center gap-3 bg-gray-800/50 rounded-full px-6 py-3 border border-gray-700">
            <span className="text-gray-300">Redirecting to home in <strong className="text-white">{countdown}</strong> seconds...</span>
          </div>
        </div>
      </div>
    );
  }
  return children;
}
