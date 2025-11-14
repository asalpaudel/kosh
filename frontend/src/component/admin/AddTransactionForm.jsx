import React, { useState, useEffect, useRef } from "react";
import { BanknotesIcon } from "../icons";

const apiBase = "http://localhost:8080/api";

function AddTransactionForm({ onAdded, onClose }) {
  const [formData, setFormData] = useState({
    date: "",
    user: "",
    type: "Deposit",
    amount: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [showUserResults, setShowUserResults] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchBoxRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserSearchChange = (e) => {
    const query = e.target.value;
    setUserSearch(query);

    if (query === "") {
      setFormData((prev) => ({ ...prev, user: "" }));
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2) {
      setUserResults([]);
      setShowUserResults(false);
      return;
    }

    setIsUserLoading(true);
    setShowUserResults(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`${apiBase}/users?search=${query}`);
        if (!response.ok) throw new Error("Failed to fetch users");

        const data = await response.json();
        setUserResults(data);
      } catch (err) {
        console.error("User search error:", err);
        setUserResults([]);
      } finally {
        setIsUserLoading(false);
      }
    }, 300);
  };

  const handleUserSelect = (user) => {
    setFormData((prev) => ({ ...prev, user: user.name }));
    setUserSearch(user.name);
    setShowUserResults(false);
    setUserResults([]);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setShowUserResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchBoxRef]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.user === "" || formData.date === "" || formData.amount === "") {
      setError("Please fill in all fields (Date, User, and Amount).");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiBase}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: `Rs. ${parseFloat(formData.amount).toLocaleString("en-IN")}`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add: ${response.status} - ${errorText}`);
      }

      onAdded();
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex justify-center">
        <BanknotesIcon className="w-16 h-16 text-teal-500" />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative" ref={searchBoxRef}>
          <label className="block font-semibold mb-2">User</label>
          <input
            type="text"
            value={userSearch}
            onChange={handleUserSearchChange}
            onFocus={() => userSearch.length > 1 && setShowUserResults(true)}
            placeholder="Start typing to search for a user..."
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            required
          />
          {showUserResults && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {isUserLoading ? (
                <div className="px-4 py-2 text-gray-500">Loading...</div>
              ) : userResults.length > 0 ? (
                userResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="px-4 py-2 hover:bg-teal-100 cursor-pointer"
                  >
                    {user.name} ({user.email})
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500">No users found.</div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block font-semibold mb-2">Date</label>
          <input
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold mb-2">Transaction Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            required
          >
            <option value="Deposit">Deposit</option>
            <option value="Withdrawal">Withdrawal</option>
            <option value="Loan Payment">Loan Payment</option>
            <option value="Interest Added">Interest Added</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-2">Amount (Rs.)</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={handleChange}
            placeholder="e.g., 5000"
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors mt-4 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {loading ? "Adding..." : "Add Transaction"}
      </button>
    </form>
  );
}

export default AddTransactionForm;
