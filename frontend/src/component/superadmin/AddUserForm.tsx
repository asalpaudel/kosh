import { useEffect, useState, type ChangeEvent } from "react";
import { API_BASE, ApiError, apiFetch } from "../../lib/apiClient";
import { parseNetworks, type NetworkSummary } from "../../lib/networks";
import { parseManagedUser, type ManagedUser } from "../../lib/users";
import { UserCircleIcon } from "../icons";
import BsDatePicker from "../BsDatePicker";

const Stepper = ({ currentStep }: { currentStep: number }) => (
  <div className="flex items-center justify-center w-full mb-4">
    <div
      className={`flex flex-col items-center ${currentStep >= 1 ? "text-teal-500" : "text-gray-400"
        }`}
    >
      <div
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${currentStep >= 1 ? "border-teal-500" : "border-gray-400"
          }`}
      >
        1
      </div>
      <span className="text-xs font-semibold mt-1">Details</span>
    </div>

    <div
      className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? "bg-teal-500" : "bg-gray-300"
        }`}
    ></div>

    <div
      className={`flex flex-col items-center ${currentStep >= 2 ? "text-teal-500" : "text-gray-400"
        }`}
    >
      <div
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${currentStep >= 2 ? "border-teal-500" : "border-gray-400"
          }`}
      >
        2
      </div>
      <span className="text-xs font-semibold mt-1">Photo</span>
    </div>
  </div>
);

export default function AddUserForm({
  onClose,
  onUserAdded,
  apiBase = API_BASE,
}: {
  onClose: () => void;
  onUserAdded: (user: ManagedUser) => void;
  apiBase?: string;
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<{
    name: string; email: string; phone: string; dob: string; address: string;
    sahakari: string; password: string; role: "admin" | "auditor"; photo: File | null;
  }>({
    name: "",
    email: "",
    phone: "",
    dob: "",
    address: "",
    sahakari: "",
    password: "",
    role: "admin",
    photo: null,
  });

  const [sahakariList, setSahakariList] = useState<NetworkSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch sahakari (networks) from backend
  useEffect(() => {
    const fetchSahakaris = async () => {
      try {
        const res = await apiFetch(`${apiBase}/networks`);
        setSahakariList(parseNetworks(await res.json()));
      } catch {
        setError("Could not load sahakari list.");
      } finally {
        setLoading(false);
      }
    };

    void fetchSahakaris();
  }, [apiBase]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (e.target instanceof HTMLInputElement && e.target.type === "file") {
      const file = e.target.files?.item(0) ?? null;
      if (file && (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024)) {
        setError("Photo must be a JPG or PNG no larger than 2MB.");
        return;
      }
      setFormData((previous) => ({ ...previous, photo: file }));
      return;
    }
    if (name === "name" || name === "email" || name === "phone" || name === "dob" || name === "address" || name === "sahakari" || name === "password" || name === "role") {
      setFormData((previous) => ({ ...previous, [name]: value }));
    }
  };

  const handleSubmit = async () => {

    // Final validation
    const { name, email, phone, dob, address, sahakari, password, photo } = formData;

    if (!name || !email || !phone || !dob || !address || !sahakari || !password) {
      setError("Please fill in all required fields in Step 1.");
      return;
    }
    if (password.length < 12) {
      setError("Temporary password must contain at least 12 characters.");
      return;
    }

    if (!photo) {
      setError("Please upload admin's photo.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("email", formData.email);
      form.append("phone", formData.phone);
      form.append("dob", formData.dob);
      form.append("address", formData.address);
      form.append("role", formData.role);
      form.append("sahakari", formData.sahakari);
      form.append("password", formData.password);
      form.append("status", "Active");

      // For admins, the backend might expect 'document' instead of 'photo'
      if (formData.photo) {
        form.append("photo", formData.photo);
      }

      // Clean the apiBase to ensure no trailing slashes or extra characters
      const cleanApiBase = apiBase.replace(/\/+$/, '');
      const endpoint = `${cleanApiBase}/users`;

      const res = await apiFetch(endpoint, {
        method: "POST",
        body: form,
      });
      const saved = parseManagedUser(await res.json());
      onUserAdded(saved);
      window.alert(`${formData.role === "auditor" ? "Auditor" : "Admin"} "${saved.name}" added successfully to ${formData.sahakari}.`);
      onClose();
    } catch (caught) {
      let displayError = caught instanceof ApiError || caught instanceof Error ? caught.message : "Unable to add admin";
      if (displayError.includes("Network not found")) {
        displayError = "The selected sahakari network was not found.";
      }

      setError(displayError);
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone || !formData.dob || !formData.address || !formData.sahakari || !formData.password) {
        setError("Please fill in all required fields.");
        return;
      }
    }
    setError("");
    if (step < 2) {
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    setError("");
    if (step > 1) {
      setStep((s) => s - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  // Get selected network info to show admin limit
  const selectedNetwork = sahakariList.find(
    (net) => net.name === formData.sahakari
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-center">
        <UserCircleIcon className="w-16 h-16 text-teal-500" />
      </div>

      <Stepper currentStep={step} />

      {/* Step 1: Admin Details */}
      {step === 1 && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 -mb-2 text-center">
            Cooperative Staff Details
          </h3>

          <div>
            <label className="block font-semibold mb-2">Access role</label>
            <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black">
              <option value="admin">Administrator</option>
              <option value="auditor">Read-only auditor</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter admin's full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter admin's email"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="98XXXXXXXX"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <BsDatePicker value={formData.dob} onChange={(dob) => { setFormData((current) => ({ ...current, dob })); }} ariaLabel="Administrator date of birth in Bikram Sambat" />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter admin's full address"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Select Sahakari <span className="text-red-500">*</span>
            </label>
            <select
              name="sahakari"
              value={formData.sahakari}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            >
              <option value="">Choose Sahakari</option>
              {sahakariList.map((net) => (
                <option key={net.id} value={net.name}>
                  {net.name} (Admin Limit: {net.adminLimit || "N/A"})
                </option>
              ))}
            </select>

            {selectedNetwork && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p className="font-semibold text-blue-900">
                  {selectedNetwork.name}
                </p>
                <p className="text-blue-700">
                  Admin Limit: {selectedNetwork.adminLimit || "Unlimited"} |
                  User Limit: {selectedNetwork.userLimit || "Unlimited"}
                </p>
                <p className="text-blue-600">
                  Package: {selectedNetwork.packageType}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Temporary Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              minLength={12}
              placeholder="Enter a temporary password"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            />
            <p className="text-xs text-gray-500 mt-1 px-2">
              Admin can change this password after first login
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Note:</span> This account will be immediately active. The admin can log in right away.
            </p>
          </div>
        </>
      )}

      {/* Step 2: Photo */}
      {step === 2 && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 -mb-2 text-center">
            Admin Photo
          </h3>

          <div>
            <label className="block font-semibold mb-2">
              Admin's Photo (Image) <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              name="photo"
              accept=".png, .jpg, .jpeg"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-teal-500 file:text-white file:font-semibold hover:file:bg-teal-600 transition"
            />
            {formData.photo && (
              <p className="text-xs text-green-600 mt-1 px-2">
                ✓ {formData.photo.name}
              </p>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center -mt-2">
            <span className="text-red-500">*</span> Photo is required for admin profile
          </p>
        </>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        {step > 1 ? (
          <button
            type="button"
            onClick={prevStep}
            disabled={saving}
            className="bg-gray-200 text-gray-800 font-semibold py-3 px-8 rounded-full hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Back
          </button>
        ) : (
          <div></div>
        )}

        {step < 2 ? (
          <button
            type="button"
            onClick={nextStep}
            className="bg-black text-white font-semibold py-3 px-8 rounded-full hover:bg-gray-800 transition-colors"
          >
            Next
          </button>
        ) : null}

        {step === 2 ? (
          <button
            type="button"
            onClick={() => { void handleSubmit(); }}
            disabled={saving}
            className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : `Add ${formData.role === "auditor" ? "Auditor" : "Admin"}`}
          </button>
        ) : null}
      </div>
    </div>
  );
}
