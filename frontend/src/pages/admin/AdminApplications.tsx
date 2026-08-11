import { useCallback, useEffect, useState, type ChangeEvent, type ComponentType, type FormEvent } from "react";
import { API_BASE as apiBase, apiFetch } from "../../lib/apiClient";
import { parseUserApplications, type ApplicationType, type UserApplication } from "../../lib/applications";
import { isRecord } from "../../lib/validation";
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  XMarkIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from "../../component/icons";
import ConfirmationModal from "../../component/ConfirmationModal";
import { formatDualDate } from "../../lib/nepaliDate";


type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";
const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  WITHDRAWN: "bg-gray-50 text-gray-600 border-gray-200",
};

// --- Helper: Modern Review Modal ---
interface ApprovalForm { approvedAmount: string; duration: string; reviewNotes: string }
const ReviewModal = ({ application, type, onClose, onConfirm }: { application: UserApplication; type: ApplicationType; onClose: () => void; onConfirm: (data: ApprovalForm) => void }) => {
  const isLoan = type === "loan";
  const isFD = type === "fixed-deposit";

  const [formData, setFormData] = useState<ApprovalForm>({
    approvedAmount:
      type === "loan"
        ? String(application.requestedAmount ?? "")
        : type === "fixed-deposit"
          ? String(application.depositAmount ?? "")
          : String(application.initialDeposit ?? ""),
    duration:
      type === "loan"
        ? String(application.maxDuration ?? 12)
        : String(application.depositTerm ?? 0),
    reviewNotes: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onConfirm(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden p-4 sm:p-6">
      {/* Modern Backdrop: Blur + Light Dark */}
      <div
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg transform rounded-2xl bg-white p-6 text-left shadow-2xl transition-all sm:my-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Review Application</h3>
            <p className="text-sm text-gray-500">Approve or reject this request.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Summary Box */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Applicant</span>
              <span className="font-semibold text-gray-900">{application.userName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Package</span>
              <span className="font-semibold text-gray-900">
                {application.packageName}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
              <span className="text-gray-500">Requested Amount</span>
              <span className="font-bold text-gray-900">Rs. {Number(formData.approvedAmount).toLocaleString()}</span>
            </div>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Approved Amount (Rs.)
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">Rs.</span>
              </div>
              <input
                type="number"
                name="approvedAmount"
                value={formData.approvedAmount}
                onChange={handleChange}
                className="block w-full rounded-lg border-gray-300 pl-10 focus:border-teal-500 focus:ring-teal-500 sm:text-sm py-2.5 shadow-sm border"
                min="1"
                required
              />
            </div>
            {isLoan && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Subject to 70% Reserve Limit Check
              </p>
            )}
          </div>

          {/* Duration Field (Loans & Fixed Deposits) */}
          {(isLoan || isFD) && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Approved Duration (Months)
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="block w-full rounded-lg border-gray-300 focus:border-teal-500 focus:ring-teal-500 sm:text-sm py-2.5 shadow-sm border px-3"
                min="1"
                required
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Review Notes <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              name="reviewNotes"
              value={formData.reviewNotes}
              onChange={handleChange}
              rows={3}
              className="block w-full rounded-lg border-gray-300 focus:border-teal-500 focus:ring-teal-500 sm:text-sm px-3 py-2 shadow-sm border resize-none"
              placeholder="Add internal remarks..."
            ></textarea>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all"
            >
              Confirm Approval
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ApplicationCard = ({ application, type, onReview }: { application: UserApplication; type: ApplicationType; onReview: (application: UserApplication, status: "APPROVED" | "REJECTED", type: ApplicationType) => void }) => {
  const isPending = application.status === "PENDING";

  const renderDetails = () => {
    switch (type) {
      case "fixed-deposit":
        return (
          <div className="grid grid-cols-2 gap-2 mt-3 mb-4">
            <div className="bg-gray-50 p-2 rounded-lg">
              <p className="text-xs text-gray-500">Amount</p>
              <p className="font-semibold text-gray-900">Rs. {application.depositAmount?.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg">
              <p className="text-xs text-gray-500">Term</p>
              <p className="font-semibold text-gray-900">{application.depositTerm} M</p>
            </div>
          </div>
        );
      case "saving-account":
        return (
          <div className="mt-3 mb-4 bg-gray-50 p-2 rounded-lg">
            <p className="text-xs text-gray-500">Initial Deposit</p>
            <p className="font-semibold text-gray-900">Rs. {application.initialDeposit?.toLocaleString()}</p>
          </div>
        );
      case "loan":
        return (
          <div className="mt-3 mb-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-xs text-gray-500">Requested</p>
                <p className="font-semibold text-gray-900">Rs. {application.requestedAmount?.toLocaleString()}</p>
              </div>
              {application.approvedAmount ? (
                <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                  <p className="text-xs text-emerald-600">Approved</p>
                  <p className="font-semibold text-emerald-700">Rs. {application.approvedAmount.toLocaleString()}</p>
                </div>
              ) : (
                <div className="bg-gray-50 p-2 rounded-lg">
                  <p className="text-xs text-gray-500">Purpose</p>
                  <p className="font-medium text-gray-900 truncate">{application.purpose}</p>
                </div>
              )}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-teal-100">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600 uppercase">
              {application.userName.charAt(0)}
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">{application.userName}</h4>
              <p className="text-xs text-gray-500">{application.packageName}</p>
            </div>
          </div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${STATUS_STYLES[application.status] ?? STATUS_STYLES.WITHDRAWN ?? "bg-gray-50"}`}>
            {application.status}
          </span>
        </div>

        {renderDetails()}

        <div className="flex items-center gap-2 text-xs text-gray-400 border-t border-gray-50 pt-3">
          <ClockIcon className="w-3.5 h-3.5" />
          <span>{formatDualDate(application.applicationDate)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      {isPending && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => { onReview(application, "APPROVED", type); }}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-teal-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
          >
            <CheckCircleIcon className="w-4 h-4" /> Approve
          </button>
          <button
            onClick={() => { onReview(application, "REJECTED", type); }}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:text-red-600 transition-colors"
          >
            <XCircleIcon className="w-4 h-4" /> Reject
          </button>
        </div>
      )}

      {/* Review Notes Display */}
      {!isPending && application.reviewNotes && (
        <div className="mt-3 rounded-md bg-gray-50 p-3 text-xs text-gray-600">
          <span className="font-semibold text-gray-900">Note:</span> {application.reviewNotes}
        </div>
      )}
    </div>
  );
};

export default function AdminApplications() {
  const [networkId, setNetworkId] = useState<string | null>(null);
  const [applications, setApplications] = useState<{ fd: UserApplication[]; sa: UserApplication[]; loan: UserApplication[] }>({ fd: [], sa: [], loan: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | ReviewStatus>("ALL");
  const [reviewModal, setReviewModal] = useState<{ app: UserApplication; type: ApplicationType } | null>(null);
  const [collapseState, setCollapseState] = useState({ fd: false, sa: false, loan: false });

  // Rejection confirmation
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [appToReject, setAppToReject] = useState<{ app: UserApplication; type: ApplicationType } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch Session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await apiFetch(`${apiBase}/session`);
        const data: unknown = await res.json();
        if (!isRecord(data) || (typeof data.sahakariId !== "string" && typeof data.sahakariId !== "number")) throw new Error("Invalid session response");
        setNetworkId(String(data.sahakariId));
      } catch (caught) { setError(caught instanceof Error ? caught.message : "Session failed to load"); }
    };
    void fetchSession();
  }, []);

  // Fetch Data
  const fetchApplications = useCallback(async (selectedNetworkId: string) => {
    setLoading(true);
    try {
      const [fdRes, saRes, loanRes] = await Promise.all([
        apiFetch(`${apiBase}/applications/fixed-deposit/network/${encodeURIComponent(selectedNetworkId)}`),
        apiFetch(`${apiBase}/applications/saving-account/network/${encodeURIComponent(selectedNetworkId)}`),
        apiFetch(`${apiBase}/applications/loan/network/${encodeURIComponent(selectedNetworkId)}`),
      ]);
      setApplications({
        fd: parseUserApplications(await fdRes.json(), "fixed-deposit"),
        sa: parseUserApplications(await saRes.json(), "saving-account"),
        loan: parseUserApplications(await loanRes.json(), "loan"),
      });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Applications failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (networkId) void fetchApplications(networkId);
  }, [fetchApplications, networkId]);

  // Handlers
  const initiateReview = (app: UserApplication, status: "APPROVED" | "REJECTED", type: ApplicationType) => {
    if (status === "APPROVED") {
      setReviewModal({ app, type });
    } else {
      setAppToReject({ app, type });
      setIsRejectModalOpen(true);
    }
  };

  const confirmRejection = () => {
    if (!appToReject) return;
    const { app, type } = appToReject;
    setIsRejectModalOpen(false);
    void submitReview(app, type, { status: "REJECTED", reviewNotes: "Rejected by Admin" });
    setAppToReject(null);
  };

  const submitReview = async (app: UserApplication, type: ApplicationType, payload: Record<string, string | number>) => {
    try {
      await apiFetch(`${apiBase}/applications/${type}/${encodeURIComponent(app.id)}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setReviewModal(null);
      if (networkId) await fetchApplications(networkId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Application review failed");
    }
  };

  const handleModalConfirm = (data: ApprovalForm) => {
    if (!reviewModal) return;
    void submitReview(reviewModal.app, reviewModal.type, {
      status: "APPROVED",
      approvedAmount: Number(data.approvedAmount), duration: Number(data.duration), reviewNotes: data.reviewNotes,
    });
  };

  const filterApps = (apps: UserApplication[]) => filter === "ALL" ? apps : apps.filter((a) => a.status === filter);

  if (!networkId) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Loading Session...</p>
      </div>
    </div>
  );

  const stats = ["PENDING", "APPROVED", "REJECTED"] as const;
  const statCounts: Record<(typeof stats)[number], number> = {
    PENDING: applications.fd.filter(a => a.status === "PENDING").length + applications.sa.filter(a => a.status === "PENDING").length + applications.loan.filter(a => a.status === "PENDING").length,
    APPROVED: applications.fd.filter(a => a.status === "APPROVED").length + applications.sa.filter(a => a.status === "APPROVED").length + applications.loan.filter(a => a.status === "APPROVED").length,
    REJECTED: applications.fd.filter(a => a.status === "REJECTED").length + applications.sa.filter(a => a.status === "REJECTED").length + applications.loan.filter(a => a.status === "REJECTED").length,
  };
  const totalApplications = applications.fd.length + applications.sa.length + applications.loan.length;

  const sections: Array<{ key: "fd" | "sa" | "loan"; label: string; icon: ComponentType<{ className?: string }>; type: ApplicationType; apps: UserApplication[] }> = [
    { key: "fd", label: "Fixed Deposits", icon: DocumentTextIcon, type: "fixed-deposit", apps: applications.fd },
    { key: "sa", label: "Saving Accounts", icon: CurrencyDollarIcon, type: "saving-account", apps: applications.sa },
    { key: "loan", label: "Loans", icon: BanknotesIcon, type: "loan", apps: applications.loan },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 p-3 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {error && <p className="text-red-600" role="alert">{error}</p>}
        {loading && <p className="text-gray-500">Loading applications...</p>}

        {/* Header Stats */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Application Overview</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total</p>
              <p className="text-3xl font-bold text-gray-900">{totalApplications}</p>
            </div>
            {stats.map(st => (
              <div key={st} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{st}</p>
                <p className={`text-3xl font-bold ${st === 'PENDING' ? 'text-amber-500' : st === 'APPROVED' ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                  {statCounts[st]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <FunnelIcon className="w-5 h-5 text-gray-400 mr-2" />
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => { setFilter(st); }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${filter === st
                ? "bg-teal-600 text-white shadow-md ring-2 ring-teal-600 ring-offset-2"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
            >
              {st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Application Lists */}
        <div className="space-y-6">
          {sections.map((section) => {
            const Icon = section.icon;
            const collapsed = collapseState[section.key];
            const filtered = filterApps(section.apps);

            return (
              <div key={section.key} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <button
                  className="flex w-full items-center justify-between bg-white p-5 hover:bg-gray-50 transition-colors"
                  onClick={() => { setCollapseState((prev) => ({ ...prev, [section.key]: !prev[section.key] })); }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-gray-900">{section.label}</h3>
                      <p className="text-xs text-gray-500">{filtered.length} applications found</p>
                    </div>
                  </div>
                  <span className={`text-gray-400 transition-transform ${collapsed ? "rotate-0" : "rotate-180"}`}>
                    ▼
                  </span>
                </button>

                {!collapsed && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                    {filtered.length > 0 ? (
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((app) => (
                          <ApplicationCard
                            key={app.id}
                            application={app}
                            type={section.type}
                            onReview={initiateReview}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="rounded-full bg-gray-100 p-4 mb-3">
                          <DocumentTextIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">No applications found</p>
                        <p className="text-xs text-gray-500">Try changing the filters</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {reviewModal && (
        <ReviewModal
          application={reviewModal.app}
          type={reviewModal.type}
          onClose={() => { setReviewModal(null); }}
          onConfirm={handleModalConfirm}
        />
      )}

      <ConfirmationModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setAppToReject(null);
        }}
        onConfirm={confirmRejection}
        title="Confirm Rejection"
        message="Are you sure you want to reject this application? This decision will be notified to the user."
        confirmText="Reject"
        type="danger"
      />
    </div>
  );
}
