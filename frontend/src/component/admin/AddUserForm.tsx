import { useEffect, useState, type ChangeEvent } from "react";
import { API_BASE, ApiError, apiFetch } from "../../lib/apiClient";
import { parseNetwork, type NetworkSummary } from "../../lib/networks";
import { parseManagedUser, parseManagedUsers, type ManagedUser } from "../../lib/users";
import { isRecord } from "../../lib/validation";
import { UserCircleIcon } from "../icons";

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
      <span className="text-xs font-semibold mt-1">Documents</span>
    </div>
  </div>
);

function AddUserForm({
  onClose,
  onUserAdded,
  apiBase = API_BASE,
}: { onClose: () => void; onUserAdded: (user: ManagedUser) => void; apiBase?: string }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<{
    name: string; email: string; phone: string; dob: string; address: string;
    role: string; password: string; citizenship: File | null; signature: File | null; photo: File | null;
  }>({
    name: "",
    email: "",
    phone: "",
    dob: "",
    address: "",
    role: "member",
    password: "",
    citizenship: null,
    signature: null,
    photo: null,
  });

  const [adminSahakari, setAdminSahakari] = useState<string | null>(null);
  const [networkData, setNetworkData] = useState<NetworkSummary | null>(null);
  const [currentUserCount, setCurrentUserCount] = useState(0);
  const [loadingSahakari, setLoadingSahakari] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAdminSahakari = async () => {
      try {
        const res = await apiFetch(`${apiBase}/session`);
        const data: unknown = await res.json();
        if (!isRecord(data) || (typeof data.sahakariId !== "string" && typeof data.sahakariId !== "number")) throw new Error("Invalid session response");
        const cleanId = encodeURIComponent(String(data.sahakariId));
        const networkRes = await apiFetch(`${apiBase}/networks/${cleanId}`);
        const network = parseNetwork(await networkRes.json());
            setAdminSahakari(network.name);
            setNetworkData(network);

        const usersRes = await apiFetch(`${apiBase}/users/network/${cleanId}`);
        const users = parseManagedUsers(await usersRes.json());
              const memberCount = users.filter(
                (u) => u.role === "member" && u.status === "Active"
              ).length;
              setCurrentUserCount(memberCount);
      } catch {
        setError("Could not load sahakari information.");
      } finally {
        setLoadingSahakari(false);
      }
    };

    void fetchAdminSahakari();
  }, [apiBase]);

  const isCapacityReached = () => {
    if (!networkData || networkData.userLimit === 0) return false;
    return currentUserCount >= networkData.userLimit;
  };

  const getRemainingSlots = () => {
    if (!networkData || networkData.userLimit === 0) return "Unlimited";
    const remaining = networkData.userLimit - currentUserCount;
    return remaining > 0 ? remaining : 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (e.target.type === "file") {
      const file = e.target.files?.item(0) ?? null;
      if (name === "citizenship" || name === "signature" || name === "photo") setFormData((previous) => ({ ...previous, [name]: file }));
    } else if (name === "name" || name === "email" || name === "phone" || name === "dob" || name === "address" || name === "password") {
      setFormData((previous) => ({ ...previous, [name]: value }));
    }
  };

  const handleSubmit = async () => {

    if (!adminSahakari) {
      setError("Sahakari information not loaded. Please try again.");
      return;
    }

    if (isCapacityReached()) {
      setError(
        "Member capacity limit reached. Please contact support to upgrade your package."
      );
      return;
    }

    // Final validation
    const { name, email, phone, dob, address, password, citizenship, signature, photo } = formData;

    if (!name || !email || !phone || !dob || !address || !password) {
      setError("Please fill in all required fields in Step 1.");
      return;
    }
    if (password.length < 12) {
      setError("Temporary password must contain at least 12 characters.");
      return;
    }

    if (!citizenship || !signature || !photo) {
      setError("Please upload all required documents (Citizenship, Signature, and Photo).");
      return;
    }

    // Check file sizes (limit to 5MB each)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (citizenship.size > maxSize) {
      setError(`Citizenship file is too large (${(citizenship.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB.`);
      return;
    }
    if (signature.size > maxSize) {
      setError(`Signature file is too large (${(signature.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB.`);
      return;
    }
    if (photo.size > maxSize) {
      setError(`Photo file is too large (${(photo.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB.`);
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
      form.append("sahakari", adminSahakari);
      form.append("password", formData.password);
      form.append("status", "Active");

      // Append documents with correct field names
      form.append("citizenship", citizenship);
      form.append("signature", signature);
      form.append("photo", photo);

      // Clean the apiBase to ensure no trailing slashes
      const cleanApiBase = apiBase.replace(/\/+$/, '');
      const endpoint = `${cleanApiBase}/users`;

      const res = await apiFetch(endpoint, {
        method: "POST",
        body: form,
      });
      const saved = parseManagedUser(await res.json());
      onUserAdded(saved);
      window.alert(`User "${saved.name}" added successfully to ${adminSahakari}.`);
      onClose();
    } catch (caught) {
      setError(caught instanceof ApiError || caught instanceof Error ? caught.message : "Unable to add member");
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone || !formData.dob || !formData.address || !formData.password) {
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

  if (loadingSahakari) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!adminSahakari) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-red-500">
          Unable to load sahakari. Please try again.
        </p>
      </div>
    );
  }

  const capacityReached = isCapacityReached();
  const remainingSlots = getRemainingSlots();

  return (
    <div className="flex flex-col gap-5 pr-2">
      <div className="flex justify-center">
        <UserCircleIcon className="w-16 h-16 text-teal-500" />
      </div>

      <Stepper currentStep={step} />

      {/* Step 1: User Details */}
      {step === 1 && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 -mb-2 text-center">
            User Details
          </h3>

          <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
            <p className="text-sm text-teal-700">
              <span className="font-semibold">Adding user to:</span>{" "}
              {adminSahakari}
            </p>
          </div>

          {/* Capacity Display */}
          <div
            className={`border rounded-lg px-4 py-3 ${capacityReached
                ? "bg-red-50 border-red-300"
                : "bg-blue-50 border-blue-200"
              }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span
                className={`text-sm font-semibold ${capacityReached ? "text-red-700" : "text-blue-700"
                  }`}
              >
                Member Capacity
              </span>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${capacityReached
                    ? "bg-red-200 text-red-800"
                    : "bg-blue-200 text-blue-800"
                  }`}
              >
                {networkData?.packageType === "package1"
                  ? "Starter"
                  : networkData?.packageType === "package2"
                    ? "Professional"
                    : networkData?.packageType === "package3"
                      ? "Enterprise"
                      : "Custom"}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold ${capacityReached ? "text-red-600" : "text-blue-600"
                  }`}
              >
                {currentUserCount}
              </span>
              <span className="text-gray-600">/</span>
              <span className="text-lg font-semibold text-gray-700">
                {networkData?.userLimit && networkData.userLimit > 0
                  ? networkData.userLimit
                  : "∞"}
              </span>
              <span className="text-sm text-gray-600 ml-auto">
                {remainingSlots === "Unlimited" ? (
                  <span className="text-green-600 font-medium">
                    Unlimited slots
                  </span>
                ) : (
                  <span
                    className={
                      remainingSlots === 0
                        ? "text-red-600 font-medium"
                        : "text-gray-600"
                    }
                  >
                    {remainingSlots} slot{remainingSlots !== 1 ? "s" : ""}{" "}
                    remaining
                  </span>
                )}
              </span>
            </div>

            {networkData?.userLimit && networkData.userLimit > 0 && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${capacityReached ? "bg-red-500" : "bg-blue-500"
                      }`}
                    style={{
                      width: `${String(Math.min(
                        (currentUserCount / networkData.userLimit) * 100,
                        100
                      ))}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}

            {capacityReached && (
              <div className="mt-3 text-xs text-red-700 font-medium">
                ⚠️ Maximum capacity reached. Contact support to upgrade your
                package.
              </div>
            )}
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
              placeholder="Enter user's full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
              disabled={capacityReached}
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
              placeholder="Enter user's email"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
              disabled={capacityReached}
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
              disabled={capacityReached}
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
              disabled={capacityReached}
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter user's full address"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
              disabled={capacityReached}
            />
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
              disabled={capacityReached}
            />
            <p className="text-xs text-gray-500 mt-1 px-2">
              User can change this password after first login
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Note:</span> This account will be immediately active. The user can log in right away.
            </p>
          </div>
        </>
      )}

      {/* Step 2: Documents */}
      {step === 2 && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 -mb-2 text-center">
            User Documents
          </h3>

          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm">
            <p className="text-blue-800">
              <span className="font-semibold">💡 Tip:</span> Keep file sizes under 2MB each for faster upload. Compress large PDFs or images before uploading.
            </p>
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Citizenship/NID Card (PDF / Image){" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              name="citizenship"
              accept=".pdf, .png, .jpg, .jpeg"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-teal-500 file:text-white file:font-semibold hover:file:bg-teal-600 transition"
            />
            {formData.citizenship && (
              <p className="text-xs text-green-600 mt-1 px-2">
                ✓ {formData.citizenship.name} ({(formData.citizenship.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div>
            <label className="block font-semibold mb-2">
              User's Signature (Image) <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              name="signature"
              accept=".png, .jpg, .jpeg"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-teal-500 file:text-white file:font-semibold hover:file:bg-teal-600 transition"
            />
            {formData.signature && (
              <p className="text-xs text-green-600 mt-1 px-2">
                ✓ {formData.signature.name} ({(formData.signature.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div>
            <label className="block font-semibold mb-2">
              User's Photo (Image) <span className="text-red-500">*</span>
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
                ✓ {formData.photo.name} ({(formData.photo.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center -mt-2">
            <span className="text-red-500">*</span> All documents are required
            for verification
          </p>
        </>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
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
            disabled={capacityReached}
            className="bg-black text-white font-semibold py-3 px-8 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        ) : null}

        {step === 2 ? (
          <button
            type="button"
            onClick={() => { void handleSubmit(); }}
            disabled={saving || capacityReached}
            className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Uploading..." : "Add User"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default AddUserForm;
