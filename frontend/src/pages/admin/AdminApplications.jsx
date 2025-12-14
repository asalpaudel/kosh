import React, { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
} from "../../component/icons.jsx";

const apiBase = "http://localhost:8080/api";

const STATUS_STYLES = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  WITHDRAWN: "bg-gray-100 text-gray-800",
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
              Amount: Rs. {application.requestedAmount?.toLocaleString()}
            </p>
            <p className="text-sm">Purpose: {application.purpose}</p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-gray-900">{getPackageName()}</h4>
          <p className="text-xs text-gray-500">
            User: {application.user?.name || `ID: ${application.user?.id}`}
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
        Applied: {new Date(application.applicationDate).toLocaleDateString()}
      </p>

      {application.status === "PENDING" && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onReview(application, "APPROVED")}
            className="flex-1 bg-green-500 text-white py-1.5 rounded-full text-sm font-semibold hover:bg-green-600 transition"
          >
            Approve
          </button>
          <button
            onClick={() => onReview(application, "REJECTED")}
            className="flex-1 bg-red-500 text-white py-1.5 rounded-full text-sm font-semibold hover:bg-red-600 transition"
          >
            Reject
          </button>
        </div>
      )}

      {application.status !== "PENDING" && application.reviewNotes && (
        <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-500">
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

  const handleReview = async (app, status, type) => {
    try {
      const res = await fetch(
        `${apiBase}/applications/${type}/${app.id}/review`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            status,
            reviewNotes: status === "APPROVED" ? "Auto-approved" : "Rejected",
          }),
        }
      );
      if (res.ok) fetchApplications();
      else alert("Failed to update application");
    } catch (err) {
      console.error(err);
      alert("Error updating application");
    }
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
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          {stats.map((st) => (
            <div
              key={st}
              className="bg-white rounded-xl p-4 shadow flex flex-col"
            >
              <p className="text-xs text-gray-500">
                {st.charAt(0) + st.slice(1).toLowerCase()}
              </p>
              <h2 className="text-2xl font-bold text-gray-900">
                {statCounts[st]}
              </h2>
            </div>
          ))}
          <div className="bg-white rounded-xl p-4 shadow flex flex-col">
            <p className="text-xs text-gray-500">Total</p>
            <h2 className="text-2xl font-bold text-gray-900">
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
                  ? "bg-teal-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
              <div key={section.key} className="bg-white rounded-xl shadow p-4">
                <div
                  className="flex justify-between items-center mb-3 cursor-pointer"
                  onClick={() =>
                    setCollapseState((prev) => ({
                      ...prev,
                      [section.key]: !prev[section.key],
                    }))
                  }
                >
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Icon className="w-5 h-5 text-teal-500" /> {section.label}
                  </h3>
                  <span className="text-gray-400">{collapsed ? "+" : "-"}</span>
                </div>

                {!collapsed && (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {filterApps(section.apps).length ? (
                      filterApps(section.apps).map((app) => (
                        <ApplicationCard
                          key={app.id}
                          application={app}
                          type={section.type}
                          onReview={(a, s) => handleReview(a, s, section.type)}
                        />
                      ))
                    ) : (
                      <p className="text-gray-400 text-center py-6">
                        No applications
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
