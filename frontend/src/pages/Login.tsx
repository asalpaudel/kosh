import { API_BASE } from "../lib/apiClient";
import { NavLink, useNavigate } from "react-router-dom";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { booleanField, isRecord, stringField } from "../lib/validation";

type Role = "member" | "admin" | "superadmin";
interface AuthenticatedLogin {
  role: Role;
  userId: string;
  name: string;
  sahakari: string;
}

function authenticatedLogin(body: unknown): AuthenticatedLogin | null {
  if (!isRecord(body) || booleanField(body, "success") !== true) return null;
  const role = stringField(body, "role");
  const userId = body.userId;
  if ((role !== "member" && role !== "admin" && role !== "superadmin")
      || (typeof userId !== "string" && typeof userId !== "number")) return null;
  return { role, userId: String(userId), name: stringField(body, "name") ?? "", sahakari: stringField(body, "sahakari") ?? "" };
}

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otpData, setOtpData] = useState({ otp: "", trustDevice: false });
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const nav = useNavigate();

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleOtpChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setOtpData({ ...otpData, [event.target.name]: value });
  };

  const finishLogin = (data: AuthenticatedLogin): void => {
    localStorage.setItem("userRole", data.role);
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("userName", data.name);
    localStorage.setItem("userSahakari", data.sahakari);

    if (data.role === "member") void nav("/home");
    else if (data.role === "admin") void nav("/admin");
    else void nav("/superadmin");
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    if (!formData.email || !formData.password) {
      setErrorMessage("Please fill in all fields.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data: unknown = await response.json();

      if (stringField(data, "status") === "2FA_REQUIRED") {
        setStep("2fa");
        setErrorMessage(""); 
        setIsLoading(false);
        return;
      }

      const login = authenticatedLogin(data);
      if (!login) {
        if (stringField(data, "status") === "Pending") setIsPending(true);
        setErrorMessage(stringField(data, "message") ?? "Login failed");
        setIsLoading(false);
        return;
      }

      finishLogin(login);
      setIsLoading(false);

    } catch {
      setErrorMessage("Could not connect to the server.");
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage("");
    setIsVerifying(true);

    try {
      const response = await fetch(`${API_BASE}/auth/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          otp: otpData.otp,
          trustDevice: otpData.trustDevice
        }),
      });

      const data: unknown = await response.json();

      const login = authenticatedLogin(data);
      if (!login) {
        setErrorMessage(stringField(data, "message") ?? "Invalid OTP");
        setIsVerifying(false);
        return;
      }

      finishLogin(login);
      setIsVerifying(false);

    } catch {
      setErrorMessage("Verification failed.");
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      <div className="hidden lg:flex relative items-center px-20 bg-gradient-to-br from-[#00FFB2] via-black-600 to-black text-white overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-black/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg">
          <p className="uppercase tracking-widest text-sm text-white/70 mb-6">
            Finance Management Platform
          </p>

          <h1 className="text-5xl font-semibold leading-tight tracking-tight mb-6">
            Built for clarity. <br />
            Designed for control.
          </h1>

          <p className="text-lg text-white/80 leading-relaxed">
            Manage members, track transactions, and view analytics with
            confidence — all from a single, intuitive dashboard.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 sm:px-10">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">
            {step === "credentials" ? "Log in" : "Verify Identity"}
          </h2>
          <p className="text-gray-500 mb-8">
            {step === "credentials" 
              ? "Welcome back, please enter your details" 
              : "Enter the code sent to your email address"}
          </p>

          {step === "credentials" && (
            <form onSubmit={(event) => { void handleLogin(event); }} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700">Email address</label>
                <input
                  type="email"
                  name="email"
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#14c596] focus:outline-none"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#14c596] focus:outline-none"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                </div>
                <NavLink to="/forgot" className="text-gray-500 hover:text-gray-900">
                  Forgot password?
                </NavLink>
              </div>

              {errorMessage && (
                <div className={`rounded-lg p-4 text-sm ${
                  isPending ? "bg-yellow-50 text-yellow-700 border border-yellow-200" : "bg-red-50 text-red-600 border border-red-200"
                }`}>
                  {errorMessage}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3 rounded-lg bg-[#14c596] text-black font-semibold hover:bg-[#21ab87] transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending email...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          )}

          {/* 2FA */}
          {step === "2fa" && (
            <form onSubmit={(event) => { void handleVerify2FA(event); }} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700">Verification Code</label>
                <input
                  type="text"
                  name="otp"
                  maxLength={6}
                  placeholder="000000"
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#14c596] focus:outline-none text-center text-2xl tracking-widest font-bold"
                  value={otpData.otp}
                  onChange={handleOtpChange}
                  disabled={isVerifying}
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <input
                  type="checkbox"
                  name="trustDevice"
                  id="trustDevice"
                  checked={otpData.trustDevice}
                  onChange={handleOtpChange}
                  disabled={isVerifying}
                  className="w-5 h-5 accent-[#14c596]"
                />
                <label htmlFor="trustDevice" className="text-sm text-gray-700 cursor-pointer">
                  Trust this device for 30 days
                </label>
              </div>

              {errorMessage && (
                <div className="rounded-lg p-4 text-sm bg-red-50 text-red-600 border border-red-200">
                  {errorMessage}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isVerifying}
                className="w-full py-3 rounded-lg bg-[#14c596] text-black font-semibold hover:bg-[#21ab87] transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </button>

              <button 
                type="button" 
                onClick={() => { setStep("credentials"); }}
                disabled={isVerifying}
                className="w-full text-sm text-gray-500 hover:text-gray-900 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back to Login
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <NavLink to="/signup" className="font-medium text-[#14c596]">
              Sign up
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}
