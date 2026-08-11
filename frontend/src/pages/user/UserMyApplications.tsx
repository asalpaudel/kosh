import { useCallback, useEffect, useState } from "react";
import { API_BASE as apiBase, ApiError, apiFetch } from "../../lib/apiClient";
import { parseUserApplications, type UserApplication } from "../../lib/applications";
import { isRecord } from "../../lib/validation";
import { useNavigate } from "react-router-dom";
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "../../component/icons";


const StatusIcon = ({ status }: { status: string }) => {
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

const ApplicationCard = ({ application }: { application: UserApplication }) => {
  const { type } = application;
  const getStatusColor = (status: string) => {
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
              <span className="font-semibold">
                {application.interestRate ?? 0}%
              </span>
            </div>
            {/* ⭐ NEW: Maturity Info */}
            {application.maturityDate && (
              <div className="flex justify-between border-t border-dashed pt-2 mt-2">
                <span className="text-teal-700 font-medium">Maturity Date:</span>
                <span className="font-bold text-teal-700">{new Date(application.maturityDate).toLocaleDateString()}</span>
              </div>
            )}
            {application.maturityAmount && (
              <div className="flex justify-between">
                <span className="text-teal-700 font-medium">Maturity Amt:</span>
                <span className="font-bold text-teal-700">Rs. {application.maturityAmount.toLocaleString()}</span>
              </div>
            )}
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
              <span className="font-semibold">{application.interestRate ?? 0}%</span>
            </div>
          </div>
        );
      case "loan":
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Requested:</span>
              <span className="font-semibold">Rs. {application.requestedAmount?.toLocaleString()}</span>
            </div>
            {/* ⭐ NEW: Approved Amount */}
            {application.approvedAmount && (
              <div className="flex justify-between text-teal-700 bg-teal-50 px-2 py-1 rounded">
                <span className="font-medium">Approved:</span>
                <span className="font-bold">Rs. {application.approvedAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Interest Rate:</span>
              <span className="font-semibold">
                {application.interestRate ?? 0}%
              </span>
            </div>
            {/* ⭐ NEW: Next Payment Date */}
            {application.nextPaymentDate && (
              <div className="flex justify-between border-t border-dashed pt-2 mt-2">
                <span className="text-orange-700 font-medium">Next Due:</span>
                <span className="font-bold text-orange-700">{new Date(application.nextPaymentDate).toLocaleDateString()}</span>
              </div>
            )}
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
      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between mb-4 gap-2">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <h4 className="font-semibold text-gray-900 text-lg">{application.packageName}</h4>
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
  const [authorized, setAuthorized] = useState(false);
  const [fdApplications, setFdApplications] = useState<UserApplication[]>([]);
  const [saApplications, setSaApplications] = useState<UserApplication[]>([]);
  const [loanApplications, setLoanApplications] = useState<UserApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fdRes, saRes, loanRes] = await Promise.all([
        apiFetch(`${apiBase}/applications/fixed-deposit/user`),
        apiFetch(`${apiBase}/applications/saving-account/user`),
        apiFetch(`${apiBase}/applications/loan/user`),
      ]);
      const fdBody: unknown = await fdRes.json();
      const saBody: unknown = await saRes.json();
      const loanBody: unknown = await loanRes.json();
      setFdApplications(parseUserApplications(fdBody, "fixed-deposit"));
      setSaApplications(parseUserApplications(saBody, "saving-account"));
      setLoanApplications(parseUserApplications(loanBody, "loan"));
    } catch (caught) {
      setError(caught instanceof ApiError || caught instanceof Error ? caught.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await apiFetch(`${apiBase}/session`);
        const data: unknown = await response.json();
        if (!isRecord(data) || typeof data.userEmail !== "string") throw new Error("Invalid session");
        setAuthorized(true);
        await fetchApplications();
      } catch {
        void navigate("/");
      } finally {
        setSessionLoading(false);
      }
    };

    void fetchSession();
  }, [fetchApplications, navigate]);

  const filterApplications = (apps: UserApplication[]) => {
    if (filterStatus === "ALL") return apps;
    return apps.filter((app) => app.status === filterStatus);
  };

  const allApplications = [
    ...filterApplications(fdApplications),
    ...filterApplications(saApplications),
    ...filterApplications(loanApplications),
  ].sort((a, b) => Date.parse(b.applicationDate) - Date.parse(a.applicationDate));

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

  if (!authorized) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)] rounded-lg shadow-md">
      <div className="mb-6">
        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setFilterStatus("ALL"); }}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${filterStatus === "ALL"
                ? "bg-teal-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            All Applications
          </button>
          <button
            onClick={() => { setFilterStatus("PENDING"); }}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${filterStatus === "PENDING"
                ? "bg-teal-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            Pending
          </button>
          <button
            onClick={() => { setFilterStatus("APPROVED"); }}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${filterStatus === "APPROVED"
                ? "bg-teal-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            Approved
          </button>
          <button
            onClick={() => { setFilterStatus("REJECTED"); }}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${filterStatus === "REJECTED"
                ? "bg-teal-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-center text-red-600 py-12" role="alert">{error}</p>
      ) : loading ? (
        <p className="text-center text-gray-500 py-12">Loading your applications...</p>
      ) : allApplications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allApplications.map((app) => (
            <ApplicationCard
              key={`${app.type}-${app.id}`}
              application={app}
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
