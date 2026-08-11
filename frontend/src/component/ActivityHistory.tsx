import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE, apiFetch } from "../lib/apiClient";
import { parseActivityLogs, type ActivityLog } from "../lib/activityLogs";
import { SearchIcon } from "./icons";

interface ActivityHistoryProps {
  scope: "admin" | "superadmin";
}

function actionStyle(action: string): string {
  const styles: Record<string, string> = {
    LOGIN: "border-green-200 bg-green-50 text-green-700",
    LOGOUT: "border-gray-200 bg-gray-50 text-gray-600",
    ADD_TRANSACTION: "border-indigo-200 bg-indigo-50 text-indigo-700",
    CREATE_USER: "border-purple-200 bg-purple-50 text-purple-700",
    APPROVE_USER: "border-teal-200 bg-teal-50 text-teal-700",
    CREATE_NETWORK: "border-blue-200 bg-blue-50 text-blue-700",
    UPDATE_NETWORK: "border-amber-200 bg-amber-50 text-amber-700",
    DELETE_NETWORK: "border-red-200 bg-red-50 text-red-700",
  };
  return styles[action.toUpperCase()] ?? "border-gray-200 bg-gray-50 text-gray-700";
}

function formatDate(timestamp: string): string {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function logDetails(log: ActivityLog): ReactNode {
  const match = log.action === "ADD_TRANSACTION"
    ? /Rs\.\s*(-?[\d,]+(?:\.\d+)?)/.exec(log.details)
    : null;
  const rawAmount = match?.[1]?.replace(/,/g, "");
  const amount = rawAmount ? Number(rawAmount) : Number.NaN;
  if (!Number.isFinite(amount)) return <span className="text-gray-700">{log.details}</span>;

  const type = /Added\s+(.*?)\s+transaction/.exec(log.details)?.[1] ?? "Transaction";
  const userName = log.details.split(" for ")[1] ?? "";
  return (
    <span>
      <span className={`font-bold ${amount < 0 ? "text-red-600" : "text-green-600"}`}>
        {amount < 0 ? "Withdrawn" : "Deposited"}
      </span>
      <span className="font-medium text-gray-900">
        {` Rs. ${Math.abs(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      </span>
      <span className="ml-1 text-xs text-gray-500">({type})</span>
      {userName && <span className="text-gray-600"> for {userName}</span>}
    </span>
  );
}

export default function ActivityHistory({ scope }: ActivityHistoryProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(`${API_BASE}/history/${scope}`);
      setLogs(parseActivityLogs(await response.json()));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load activity history");
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const filteredLogs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter((log) =>
      [log.actorName, log.action, log.details].some((value) => value.toLowerCase().includes(query)),
    );
  }, [logs, searchTerm]);

  return (
    <div className="min-h-[calc(100vh-8.5rem)] rounded-2xl border border-gray-100 bg-white p-3 shadow-sm md:p-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-800">
            {scope === "superadmin" ? "System Activity Logs" : "Activity Log"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">Append-only audit trail for authorized activity</p>
        </div>
        <div className="flex w-full gap-3 sm:w-auto">
          <div className="relative flex-grow">
            <SearchIcon className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
              }}
              className="w-full rounded-xl border border-gray-100 bg-gray-50 py-2.5 pl-11 pr-4 text-sm focus:border-indigo-300 focus:bg-white focus:outline-none sm:w-72"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              void fetchHistory();
            }}
            className="rounded-xl bg-[#21ab87] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1e9e7c]"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="w-full overflow-x-auto rounded-xl border border-gray-100">
        <table className="min-w-[800px] w-full text-left">
          <thead><tr className="border-b border-gray-100 bg-gray-50">
            {['Timestamp', 'Actor', 'Action', 'Event Details'].map((heading) => (
              <th key={heading} className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">{heading}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={4} className="py-12 text-center text-gray-500">Loading activities...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan={4} className="py-12 text-center text-gray-500">No activity logs found.</td></tr>
            ) : filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">{formatDate(log.timestamp)}</td>
                <td className="px-4 py-4"><div className="font-semibold text-gray-900">{log.actorName || "System"}</div><div className="text-xs capitalize text-gray-500">{log.role || "N/A"}</div></td>
                <td className="px-4 py-4"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${actionStyle(log.action)}`}>{log.action.replace(/_/g, " ")}</span></td>
                <td className="px-4 py-4 text-sm">{logDetails(log)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
