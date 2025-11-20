import React, { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "../../component/icons.jsx";
import Modal from "../../component/superadmin/Modal.jsx";

const apiBase = "http://localhost:8080/api";

const ApplicationCard = ({ application, type, onReview }) => {
  const getStatusBadge = (status) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      WITHDRAWN: "bg-gray-100 text-gray-800",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const getPackageName = () => {
    switch (type) {
      case "fixed-deposit":
        return application.fixedDeposit?.name;
      case "saving-account":
        return application.savingAccount?.name;
      case "loan":
        return application.loanPackage?.name;
      default:
        return "N/A";
    }
  };

  const getDetails = () => {
    switch (type) {
      case "fixed-deposit":
        return (
          <>
            <p><strong>Amount:</strong> Rs. {application.depositAmount?.toLocaleString()}</p>
            <p><strong>Term:</strong> {application.depositTerm} months</p>
          </>
        );
      case "saving-account":
        return (
          <p><strong>Initial Deposit:</strong> Rs. {application.initialDeposit?.toLocaleString()}</p>
        );
      case "loan":
        return (
          <>
            <p><strong>Amount:</strong> Rs. {application.requestedAmount?.toLocaleString()}</p>
            <p><strong>Purpose:</strong> {application.purpose}</p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{getPackageName()}</h4>
          <p className="text-sm text-gray-600">User ID: {application.user?.id}</p>
        </div>
        {getStatusBadge(application.status)}
      </div>
      
      <div className="text-sm text-gray-700 space-y-1 mb-3">
        {getDetails()}
        <p className="text-xs text-gray-500 mt-2">
          Applied: {new Date(application.applicationDate).toLocaleDateString()}
        </p>
      </div>

      {application.status === "PENDING" && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onReview(application, "APPROVED")}
            className="flex-1 bg-green-500 text-white py-2 px-4 rounded-full hover:bg-green-600 transition-colors text-sm font-semibold"
          >
            Approve
          </button>
          <button
            onClick={() => onReview(application, "REJECTED")}
            className="flex-1 bg-red-500 text-white py-2 px-4 rounded-full hover:bg-red-600 transition-colors text-sm font-semibold"
          >
            Reject
          </button>
        </div>
      )}

      {application.status !== "PENDING" && application.reviewNotes && (
        <div className="mt-3 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
          <strong>Notes:</strong> {application.reviewNotes}
        </div>
      )}
    </div>
  );
};

const ReviewModal = ({ isOpen, onClose, application, type, onSubmit }) => {
  const [status, setStatus] = useState("APPROVED");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(application.id, status, notes);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review Application" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block font-semibold mb-2">Decision *</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-teal-500"
            required
          >
            <option value="APPROVED">Approve</option>
            <option value="REJECTED">Reject</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-2">Review Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any comments or reasons for your decision..."
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-teal-500 resize-none"
          />
        </div>

        <div className="flex gap-4 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 bg-gray-200 text-gray-800 font-semibold py-3 rounded-full hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-1/2 bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors"
          >
            Submit Review
          </button>
        </div>
      </form>
    </Modal>
  );
};

function AdminApplications() {
  const [selectedNetworkId, setSelectedNetworkId] = useState(null);
  const [fdApplications, setFdApplications] = useState([]);
  const [saApplications, setSaApplications] = useState([]);
  const [loanApplications, setLoanApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [currentReviewApp, setCurrentReviewApp] = useState(null);
  const [currentReviewType, setCurrentReviewType] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`${apiBase}/session`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setSelectedNetworkId(data.sahakariId);
        } else {
          console.error("Failed to fetch session data");
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setSessionLoading(false);
      }
    };

    fetchSession();
  }, []);

  const fetchApplications = async () => {
    if (!selectedNetworkId) return;
    setLoading(true);
    try {
      const [fdRes, saRes, loanRes] = await Promise.all([
        fetch(`${apiBase}/applications/fixed-deposit/network/${selectedNetworkId}`, {
          credentials: "include",
        }),
        fetch(`${apiBase}/applications/saving-account/network/${selectedNetworkId}`, {
          credentials: "include",
        }),
        fetch(`${apiBase}/applications/loan/network/${selectedNetworkId}`, {
          credentials: "include",
        }),
      ]);

      setFdApplications(await fdRes.json());
      setSaApplications(await saRes.json());
      setLoanApplications(await loanRes.json());
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedNetworkId) {
      fetchApplications();
    }
  }, [selectedNetworkId]);

  const handleQuickReview = async (application, status, type) => {
    try {
      const endpoint = `${apiBase}/applications/${type}/${application.id}/review`;
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchApplications();
      } else {
        alert("Failed to update application status");
      }
    } catch (error) {
      console.error("Error reviewing application:", error);
      alert("An error occurred while reviewing the application");
    }
  };

  const handleDetailedReview = (application, type) => {
    setCurrentReviewApp(application);
    setCurrentReviewType(type);
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (applicationId, status, notes) => {
    try {
      const endpoint = `${apiBase}/applications/${currentReviewType}/${applicationId}/review`;
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status, reviewNotes: notes }),
      });

      if (response.ok) {
        setReviewModalOpen(false);
        setCurrentReviewApp(null);
        setCurrentReviewType(null);
        fetchApplications();
      } else {
        alert("Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("An error occurred while submitting the review");
    }
  };

  const filterApplications = (apps) => {
    if (filterStatus === "ALL") return apps;
    return apps.filter((app) => app.status === filterStatus);
  };

  if (sessionLoading) {
    return (
      <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)] rounded-lg shadow-md flex items-center justify-center">
        <p className="text-center text-gray-500">Loading session...</p>
      </div>
    );
  }

  if (!selectedNetworkId) {
    return (
      <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)] rounded-lg shadow-md flex items-center justify-center">
        <p className="text-center text-red-500">
          Unable to load session. Please login again.
        </p>
      </div>
    );
  }

  const stats = {
    pending:
      fdApplications.filter((a) => a.status === "PENDING").length +
      saApplications.filter((a) => a.status === "PENDING").length +
      loanApplications.filter((a) => a.status === "PENDING").length,
    approved:
      fdApplications.filter((a) => a.status === "APPROVED").length +
      saApplications.filter((a) => a.status === "APPROVED").length +
      loanApplications.filter((a) => a.status === "APPROVED").length,
    rejected:
      fdApplications.filter((a) => a.status === "REJECTED").length +
      saApplications.filter((a) => a.status === "REJECTED").length +
      loanApplications.filter((a) => a.status === "REJECTED").length,
  };

  return (
    <>
      <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)] rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Application Management</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                filterStatus === "ALL"
                  ? "bg-teal-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus("PENDING")}
              className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                filterStatus === "PENDING"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setFilterStatus("APPROVED")}
              className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                filterStatus === "APPROVED"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Approved ({stats.approved})
            </button>
            <button
              onClick={() => setFilterStatus("REJECTED")}
              className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                filterStatus === "REJECTED"
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Rejected ({stats.rejected})
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading applications...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Fixed Deposit Applications */}
            <div className="border border-gray-200 rounded-lg p-4 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-teal-500" />
                Fixed Deposit Applications
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filterApplications(fdApplications).length > 0 ? (
                  filterApplications(fdApplications).map((app) => (
                    <ApplicationCard
                      key={app.id}
                      application={app}
                      type="fixed-deposit"
                      onReview={(app, status) => handleQuickReview(app, status, "fixed-deposit")}
                    />
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-8">No applications</p>
                )}
              </div>
            </div>

            {/* Saving Account Applications */}
            <div className="border border-gray-200 rounded-lg p-4 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <CurrencyDollarIcon className="w-5 h-5 text-teal-500" />
                Saving Account Applications
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filterApplications(saApplications).length > 0 ? (
                  filterApplications(saApplications).map((app) => (
                    <ApplicationCard
                      key={app.id}
                      application={app}
                      type="saving-account"
                      onReview={(app, status) => handleQuickReview(app, status, "saving-account")}
                    />
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-8">No applications</p>
                )}
              </div>
            </div>

            {/* Loan Applications */}
            <div className="border border-gray-200 rounded-lg p-4 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <BanknotesIcon className="w-5 h-5 text-teal-500" />
                Loan Applications
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filterApplications(loanApplications).length > 0 ? (
                  filterApplications(loanApplications).map((app) => (
                    <ApplicationCard
                      key={app.id}
                      application={app}
                      type="loan"
                      onReview={(app, status) => handleQuickReview(app, status, "loan")}
                    />
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-8">No applications</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setCurrentReviewApp(null);
          setCurrentReviewType(null);
        }}
        application={currentReviewApp}
        type={currentReviewType}
        onSubmit={handleSubmitReview}
      />
    </>
  );
}

export default AdminApplications;