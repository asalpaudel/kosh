import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8080/api";

/* -------------------- STEPPER -------------------- */
const Stepper = ({ currentStep }) => (
  <div className="flex items-center justify-between mb-8">
    {[1, 2, 3].map((s) => (
      <div key={s} className="flex-1 flex items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2
            ${
              currentStep >= s
                ? "border-[#00FFB2] text-[#00FFB2]"
                : "border-gray-300 text-gray-400"
            }`}
        >
          {s}
        </div>
        {s !== 3 && (
          <div
            className={`flex-1 h-[2px] mx-2 ${
              currentStep > s ? "bg-[#00FFB2]" : "bg-gray-300"
            }`}
          />
        )}
      </div>
    ))}
  </div>
);

/* -------------------- SIGNUP -------------------- */
export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sahakariList, setSahakariList] = useState([]);
  const [loadingSahakari, setLoadingSahakari] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dob: "",
    address: "",
    phone: "",
    sahakari: "",
    password: "",
    confirm: "",
    citizenship: null,
    signature: null,
    photo: null,
  });

  useEffect(() => {
    const load = async () => {
      setLoadingSahakari(true);
      try {
        const res = await fetch(`${API_BASE}/networks`);
        const data = await res.json();
        setSahakariList(Array.isArray(data) ? data : []);
      } catch {
        setSahakariList([]);
      } finally {
        setLoadingSahakari(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((p) => ({ ...p, [name]: files ? files[0] : value }));
  };

  const nextStep = () => {
    setError("");
    if (
      step === 1 &&
      (!formData.name ||
        !formData.email ||
        !formData.phone ||
        !formData.dob ||
        !formData.address)
    ) {
      setError("Please fill in all fields.");
      return;
    }
    if (
      step === 2 &&
      (!formData.sahakari ||
        !formData.password ||
        formData.password !== formData.confirm)
    ) {
      setError("Check your account details.");
      return;
    }
    setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const handleSignup = async () => {
    setError("");
    setLoading(true);

    if (!formData.citizenship || !formData.signature || !formData.photo) {
      setError("All documents are required.");
      setLoading(false);
      return;
    }

    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => v && fd.append(k, v));
      fd.append("role", "member");

      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Signup failed");

      alert("Account created. Pending approval.");
      navigate("/");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* LEFT — HERO */}
      <div className="hidden lg:flex relative items-center px-20 bg-gradient-to-br from-[#00FFB2] via-black to-black text-white overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-black/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg">
          <p className="uppercase tracking-widest text-sm text-white/70 mb-6">
            Finance Management Platform
          </p>
          <h1 className="text-5xl font-semibold leading-tight mb-6">
            One account.
            <br />
            Full control.
          </h1>
          <p className="text-lg text-white/80">
            Join your Sahakari network and manage everything securely.
          </p>
        </div>
      </div>

      {/* RIGHT — FORM */}
      <div className="flex items-center justify-center px-6 sm:px-10">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">
            Create account
          </h2>
          <p className="text-gray-500 mb-6">Step {step} of 3</p>

          <Stepper currentStep={step} />

          {error && (
            <div className="mb-5 rounded-lg p-4 text-sm bg-red-50 text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {step === 1 && (
              <>
                {["name", "email", "phone", "address"].map((f) => (
                  <div key={f}>
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {f}
                    </label>
                    <input
                      name={f}
                      value={formData[f]}
                      onChange={handleChange}
                      className="mt-2 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00FFB2] focus:outline-none"
                    />
                  </div>
                ))}

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Date of birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="mt-2 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00FFB2]"
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <select
                  name="sahakari"
                  value={formData.sahakari}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00FFB2]"
                >
                  <option value="">Select Sahakari</option>
                  {sahakariList.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>

                {["password", "confirm"].map((f) => (
                  <input
                    key={f}
                    type="password"
                    name={f}
                    placeholder={
                      f === "confirm" ? "Confirm password" : "Password"
                    }
                    value={formData[f]}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00FFB2]"
                  />
                ))}
              </>
            )}

            {step === 3 && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Verification documents
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Upload required documents for account approval
                </p>

                {/* Citizenship */}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Citizenship / NID
                  </label>

                  <div className="mt-2 flex items-center justify-between gap-4 rounded-lg border border-gray-300 px-4 py-3 focus-within:ring-2 focus-within:ring-[#00FFB2]">
                    <input
                      type="file"
                      name="citizenship"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleChange}
                      className="text-sm text-gray-600 file:hidden w-full"
                    />
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      PDF / Image
                    </span>
                  </div>

                  {formData.citizenship && (
                    <p className="mt-2 text-xs text-green-600">
                      ✓ {formData.citizenship.name}
                    </p>
                  )}
                </div>

                {/* Signature */}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Signature
                  </label>

                  <div className="mt-2 flex items-center justify-between gap-4 rounded-lg border border-gray-300 px-4 py-3 focus-within:ring-2 focus-within:ring-[#00FFB2]">
                    <input
                      type="file"
                      name="signature"
                      accept=".png,.jpg,.jpeg"
                      onChange={handleChange}
                      className="text-sm text-gray-600 file:hidden w-full"
                    />
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      Image
                    </span>
                  </div>

                  {formData.signature && (
                    <p className="mt-2 text-xs text-green-600">
                      ✓ {formData.signature.name}
                    </p>
                  )}
                </div>

                {/* Photo */}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Passport size photo
                  </label>

                  <div className="mt-2 flex items-center justify-between gap-4 rounded-lg border border-gray-300 px-4 py-3 focus-within:ring-2 focus-within:ring-[#00FFB2]">
                    <input
                      type="file"
                      name="photo"
                      accept=".png,.jpg,.jpeg"
                      onChange={handleChange}
                      className="text-sm text-gray-600 file:hidden w-full"
                    />
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      Image
                    </span>
                  </div>

                  {formData.photo && (
                    <p className="mt-2 text-xs text-green-600">
                      ✓ {formData.photo.name}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* --- Navigation Buttons --- */}
            <div className="flex justify-between mt-6 items-center">
              {/* Back button */}
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
              ) : (
                <div className="w-24" /> // empty placeholder for alignment
              )}

              {/* Next / Signup button */}
              <button
                type="button"
                onClick={step < 3 ? nextStep : handleSignup}
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-[#00FFB2] text-black font-semibold hover:bg-[#00e6a0] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step < 3 ? "Next" : loading ? "Creating..." : "Sign up"}
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <NavLink to="/" className="font-medium text-[#00FFB2]">
              Sign in
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}
