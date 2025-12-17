import React, { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  XMarkIcon, // Ensure you have this or use a generic 'X'
} from "../../component/icons.jsx";

const apiBase = "http://localhost:8080/api";

const STATUS_STYLES = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  WITHDRAWN: "bg-gray-100 text-gray-800",
};

// --- Helper: Review Modal ---
const ReviewModal = ({ application, type, onClose, onConfirm }) => {
  const isLoan = type === "loan";
  const [formData, setFormData] = useState({
    approvedAmount:
      type === "loan"
        ? application.requestedAmount
        : type === "fixed-deposit"
        ? application.depositAmount
        : application.initialDeposit,
    duration:
      type === "loan"
        ? application.loanPackage?.maxDuration || 12
        : application.depositTerm || 0,
    reviewNotes: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-teal-600 px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg">Approve Application</h3>
          <button onClick={onClose} className="text-teal-100 hover:text-white">
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-4">
            <p><strong>User:</strong> {application.user?.name}</p>
            <p><strong>Package:</strong> {isLoan ? application.loanPackage?.name : application.fixedDeposit?.name || application.savingAccount?.name}</p>
            <p><strong>Requested:</strong> Rs. {formData.approvedAmount?.toLocaleString()}</p>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Approved Amount (Rs.)
            </label>
            <input
              type="number"
              name="approvedAmount"
              value={formData.approvedAmount}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
              min="1"
              required
            />
            {isLoan && (
              <p className="text-xs text-gray-500 mt-1">
                Adjusting this will affect the 70% Reserve Check.
              </p>
            )}
          </div>

          {/* Duration Field (Loans Only) */}
          {isLoan && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Duration (Months)
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                min="1"
                required
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Review Notes
            </label>
            <textarea
              name="reviewNotes"
              value={formData.reviewNotes}
              onChange={handleChange}
              rows="3"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none resize-none"
              placeholder="Enter remarks..."
            ></textarea>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold shadow-md"
            >
              Confirm Approval
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ApplicationCard = ({ application, type, onReview }) => {
  const getPackageName = () => {
    switch (type) {
      case "fixed-deposit":
        return application.fixedDeposit?.name || "N/A";
      case "saving-account":
        return application.savingAccount?.name || "N/A";
      case "loan":
        return application.loanPackage?.name || "N/A";
      default:
        return "N/A";
    }
  };

  const getDetails = () => {
    switch (type) {
      case "fixed-deposit":
        return (
          <>
            <p className="text-sm">
              Amount: Rs. {application.depositAmount?.toLocaleString()}
            </p>
            <p className="text-sm">Term: {application.depositTerm} months</p>
          </>
        );
      case "saving-account":
        return (
          <p className="text-sm">
            Initial Deposit: Rs. {application.initialDeposit?.toLocaleString()}
          </p>
        );
      case "loan":
        return (
          <>
            <p className="text-sm">
              Requested: Rs. {application.requestedAmount?.toLocaleString()}
            </p>
            {application.approvedAmount && (
               <p className="text-sm text-teal-600 font-semibold">
               Approved: Rs. {application.approvedAmount?.toLocaleString()}
             </p>
            )}
            <p className="text-sm">Purpose: {application.purpose}</p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between bg-white">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-semibold text-gray-900">{getPackageName()}</h4>
            <p className="text-xs text-gray-500">
              User: {application.user?.name}
            </p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              STATUS_STYLES[application.status]
            }`}
          >
            {application.status}
          </span>
        </div>

        <div className="mb-2 space-y-1">{getDetails()}</div>
        <p className="text-xs text-gray-400 mb-2">
          Date: {new Date(application.applicationDate).toLocaleDateString()}
        </p>
      </div>

      {application.status === "PENDING" && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onReview(application, "APPROVED")}
            className="flex-1 bg-green-500 text-white py-1.5 rounded-lg text-sm font-semibold hover:bg-green-600 transition shadow-sm"
          >
            Approve
          </button>
          <button
            onClick={() => onReview(application, "REJECTED")}
            className="flex-1 bg-red-500 text-white py-1.5 rounded-lg text-sm font-semibold hover:bg-red-600 transition shadow-sm"
          >
            Reject
          </button>
        </div>
      )}

      {application.status !== "PENDING" && application.reviewNotes && (
        <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-500 border border-gray-100">
          Notes: {application.reviewNotes}
        </div>
      )}
    </div>
  );
};

export default function AdminApplications() {
  const [networkId, setNetworkId] = useState(null);
  const [applications, setApplications] = useState({
    fd: [],
    sa: [],
    loan: [],
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  
  // Modal State
  const [reviewModal, setReviewModal] = useState(null); // { app, type, action }

  const [collapseState, setCollapseState] = useState({
    fd: false,
    sa: false,
    loan: false,
  });

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`${apiBase}/session`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setNetworkId(data.sahakariId);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSession();
  }, []);

  const fetchApplications = async () => {
    if (!networkId) return;
    setLoading(true);
    try {
      const [fdRes, saRes, loanRes] = await Promise.all([
        fetch(`${apiBase}/applications/fixed-deposit/network/${networkId}`, {
          credentials: "include",
        }),
        fetch(`${apiBase}/applications/saving-account/network/${networkId}`, {
          credentials: "include",
        }),
        fetch(`${apiBase}/applications/loan/network/${networkId}`, {
          credentials: "include",
        }),
      ]);
      setApplications({
        fd: await fdRes.json(),
        sa: await saRes.json(),
        loan: await loanRes.json(),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (networkId) fetchApplications();
  }, [networkId]);

  // Open Modal or Reject immediately
  const initiateReview = (app, status, type) => {
    if (status === "APPROVED") {
      setReviewModal({ app, type });
    } else {
      // Direct Reject
      submitReview(app, type, { status: "REJECTED", reviewNotes: "Rejected by Admin" });
    }
  };

  const submitReview = async (app, type, payload) => {
    try {
      const res = await fetch(
        `${apiBase}/applications/${type}/${app.id}/review`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );
      
      if (res.ok) {
        setReviewModal(null);
        fetchApplications();
      } else {
        const err = await res.text();
        alert("Failed: " + err);
      }
    } catch (err) {
      console.error(err);
      alert("Error updating application");
    }
  };

  const handleModalConfirm = (data) => {
    if (!reviewModal) return;
    submitReview(reviewModal.app, reviewModal.type, {
        status: "APPROVED",
        ...data // This contains approvedAmount, duration, reviewNotes
    });
  };

  const filterApps = (apps) =>
    filter === "ALL" ? apps : apps.filter((a) => a.status === filter);

  if (!networkId)
    return (
      <p className="text-center text-red-500 mt-10">
        Unable to load session. Please login again.
      </p>
    );

  const stats = ["PENDING", "APPROVED", "REJECTED"];
  const statCounts = {
    PENDING:
      applications.fd.filter((a) => a.status === "PENDING").length +
      applications.sa.filter((a) => a.status === "PENDING").length +
      applications.loan.filter((a) => a.status === "PENDING").length,
    APPROVED:
      applications.fd.filter((a) => a.status === "APPROVED").length +
      applications.sa.filter((a) => a.status === "APPROVED").length +
      applications.loan.filter((a) => a.status === "APPROVED").length,
    REJECTED:
      applications.fd.filter((a) => a.status === "REJECTED").length +
      applications.sa.filter((a) => a.status === "REJECTED").length +
      applications.loan.filter((a) => a.status === "REJECTED").length,
  };
  const totalApplications =
    applications.fd.length + applications.sa.length + applications.loan.length;

  const applicationSections = [
    {
      key: "fd",
      label: "Fixed Deposit",
      icon: DocumentTextIcon,
      type: "fixed-deposit",
      apps: applications.fd,
    },
    {
      key: "sa",
      label: "Saving Account",
      icon: CurrencyDollarIcon,
      type: "saving-account",
      apps: applications.sa,
    },
    {
      key: "loan",
      label: "Loans",
      icon: BanknotesIcon,
      type: "loan",
      apps: applications.loan,
    },
  ];

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          {stats.map((st) => (
            <div
              key={st}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col"
            >
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                {st.charAt(0) + st.slice(1).toLowerCase()}
              </p>
              <h2 className="text-3xl font-bold text-gray-800">
                {statCounts[st]}
              </h2>
            </div>
          ))}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total</p>
            <h2 className="text-3xl font-bold text-teal-600">
              {totalApplications}
            </h2>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-4 py-2 rounded-full font-semibold text-sm transition ${
                filter === st
                  ? "bg-teal-600 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Application Sections */}
        <div className="space-y-6">
          {applicationSections.map((section) => {
            const Icon = section.icon;
            const collapsed = collapseState[section.key];
            return (
              <div key={section.key} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div
                  className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer border-b border-gray-100 hover:bg-gray-100 transition"
                  onClick={() =>
                    setCollapseState((prev) => ({
                      ...prev,
                      [section.key]: !prev[section.key],
                    }))
                  }
                >
                  <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <Icon className="w-5 h-5 text-teal-600" /> 
                    </div>
                    {section.label}
                  </h3>
                  <span className="text-gray-400 font-mono text-xl">{collapsed ? "+" : "−"}</span>
                </div>

                {!collapsed && (
                  <div className="p-4 bg-gray-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filterApps(section.apps).length ? (
                        filterApps(section.apps).map((app) => (
                          <ApplicationCard
                            key={app.id}
                            application={app}
                            type={section.type}
                            onReview={initiateReview}
                          />
                        ))
                      ) : (
                        <div className="col-span-full py-8 text-center">
                          <p className="text-gray-400 text-sm">No applications found</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <ReviewModal
          application={reviewModal.app}
          type={reviewModal.type}
          onClose={() => setReviewModal(null)}
          onConfirm={handleModalConfirm}
        />
      )}
    </div>
  );
}