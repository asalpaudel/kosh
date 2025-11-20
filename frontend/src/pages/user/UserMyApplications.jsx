import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "../../component/icons.jsx";

const apiBase = "http://localhost:8080/api";

const StatusIcon = ({ status }) => {
  switch (status) {
    case "PENDING":
      return <ClockIcon className="w-5 h-5 text-yellow-500" />;
    case "APPROVED":
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    case "REJECTED":
      return <XCircleIcon className="w-5 h-5 text-red-500" />;
    default:
      return <ClockIcon className="w-5 h-5 text-gray-500" />;
  }
};

const ApplicationCard = ({ application, type }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-300";
      case "WITHDRAWN":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
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

  const getIcon = () => {
    switch (type) {
      case "fixed-deposit":
        return <DocumentTextIcon className="w-6 h-6 text-teal-500" />;
      case "saving-account":
        return <CurrencyDollarIcon className="w-6 h-6 text-teal-500" />;
      case "loan":
        return <BanknotesIcon className="w-6 h-6 text-teal-500" />;
      default:
        return null;
    }
  };

  const getDetails = () => {
    switch (type) {
      case "fixed-deposit":
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold">Rs. {application.depositAmount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Term:</span>
              <span className="font-semibold">{application.depositTerm} months</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Interest Rate:</span>
              <span className="font-semibold">{application.fixedDeposit?.interestRate}%</span>
            </div>
          </div>
        );
      case "saving-account":
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Initial Deposit:</span>
              <span className="font-semibold">Rs. {application.initialDeposit?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Interest Rate:</span>
              <span className="font-semibold">{application.savingAccount?.interestRate}%</span>
            </div>
          </div>
        );
      case "loan":
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold">Rs. {application.requestedAmount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Interest Rate:</span>
              <span className="font-semibold">{application.loanPackage?.interestRate}%</span>
            </div>
            <div className="mt-2">
              <span className="text-gray-600">Purpose:</span>
              <p className="text-sm mt-1 text-gray-700">{application.purpose}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <h4 className="font-semibold text-gray-900 text-lg">{getPackageName()}</h4>
            <p className="text-sm text-gray-500">
              Applied on {new Date(application.applicationDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(application.status)}`}>
          <StatusIcon status={application.status} />
          <span className="font-semibold text-sm">{application.status}</span>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        {getDetails()}
      </div>

      {application.reviewNotes && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs font-semibold text-gray-700 mb-1">Admin Notes:</p>
          <p className="text-sm text-gray-600">{application.reviewNotes}</p>
        </div>
      )}

      {application.reviewDate && (
        <div className="mt-3 text-xs text-gray-500">
          Reviewed on {new Date(application.reviewDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

function UserMyApplications() {
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState(null);
  const [fdApplications, setFdApplications] = useState([]);
  const [saApplications, setSaApplications] = useState([]);
  const [loanApplications, setLoanApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`${apiBase}/session`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Session data:", data);
          
          // Check if session has error (no userEmail)
          if (data.error) {
            console.error("Session error:", data.error);
            navigate('/');
            return;
          }
          
          setSessionData(data);

          // If user doesn't have sahakariId, redirect to login
          if (!data.sahakariId && data.userRole !== "superadmin") {
            console.error("No sahakariId found in session");
            navigate('/');
            return;
          }

          // Fetch applications after session is validated
          fetchApplications();
        } else if (response.status === 401) {
          console.error("Unauthorized - no session");
          navigate('/');
        } else {
          console.error("Failed to fetch session data");
          navigate('/');
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        navigate('/');
      } finally {
        setSessionLoading(false);
      }
    };

    fetchSession();
  }, [navigate]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const [fdRes, saRes, loanRes] = await Promise.all([
        fetch(`${apiBase}/applications/fixed-deposit/user`, {
          credentials: "include",
        }),
        fetch(`${apiBase}/applications/saving-account/user`, {
          credentials: "include",
        }),
        fetch(`${apiBase}/applications/loan/user`, {
          credentials: "include",
        }),
      ]);

      if (fdRes.ok) setFdApplications(await fdRes.json());
      if (saRes.ok) setSaApplications(await saRes.json());
      if (loanRes.ok) setLoanApplications(await loanRes.json());
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = (apps) => {
    if (filterStatus === "ALL") return apps;
    return apps.filter((app) => app.status === filterStatus);
  };

  const allApplications = [
    ...filterApplications(fdApplications).map((app) => ({ ...app, type: "fixed-deposit" })),
    ...filterApplications(saApplications).map((app) => ({ ...app, type: "saving-account" })),
    ...filterApplications(loanApplications).map((app) => ({ ...app, type: "loan" })),
  ].sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!sessionData?.userEmail) {
    return null; // Will redirect via useEffect
  }

  const stats = {
    total: fdApplications.length + saApplications.length + loanApplications.length,
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
    <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)] rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">My Applications</h2>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 font-semibold">Total</p>
            <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-600 font-semibold">Pending</p>
            <p className="text-3xl font-bold text-yellow-700">{stats.pending}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-600 font-semibold">Approved</p>
            <p className="text-3xl font-bold text-green-700">{stats.approved}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-red-600 font-semibold">Rejected</p>
            <p className="text-3xl font-bold text-red-700">{stats.rejected}</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
              filterStatus === "ALL"
                ? "bg-teal-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All Applications
          </button>
          <button
            onClick={() => setFilterStatus("PENDING")}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
              filterStatus === "PENDING"
                ? "bg-yellow-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus("APPROVED")}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
              filterStatus === "APPROVED"
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilterStatus("REJECTED")}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
              filterStatus === "REJECTED"
                ? "bg-red-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-12">Loading your applications...</p>
      ) : allApplications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allApplications.map((app) => (
            <ApplicationCard
              key={`${app.type}-${app.id}`}
              application={app}
              type={app.type}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-2">No applications found</p>
          <p className="text-gray-500 text-sm">
            {filterStatus === "ALL"
              ? "You haven't applied for any packages yet."
              : `You don't have any ${filterStatus.toLowerCase()} applications.`}
          </p>
        </div>
      )}
    </div>
  );
}

export default UserMyApplications;