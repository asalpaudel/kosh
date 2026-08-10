import { API_BASE as apiBase } from "../../lib/apiClient";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountSummary from '../../component/user/AccountSummary';
import FinancialChart from '../../component/user/FinancialChart';
import TransactionsList from '../../component/user/TransactionsList';
import LoanAd from '../../component/user/LoanAd';
import { isRecord, stringField } from '../../lib/validation';

interface SessionData {
  userEmail: string;
  sahakariId: number;
  userRole: string;
}

function parseSession(value: unknown): SessionData | null {
  if (!isRecord(value) || typeof value.sahakariId !== "number") return null;
  const userEmail = stringField(value, "userEmail");
  const userRole = stringField(value, "userRole");
  return userEmail && userRole ? { userEmail, userRole, sahakariId: value.sahakariId } : null;
}


function Dashboard() {
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async (): Promise<void> => {
      try {
        const response = await fetch(`${apiBase}/session`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = parseSession(await response.json());
          if (data) setSessionData(data);
          else void navigate('/');
        } else {
          void navigate('/');
        }
      } catch {
        void navigate('/');
      } finally {
        setLoading(false);
      }
    };

    void fetchSession();
  }, [navigate]);

  if (loading) {
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

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div className="col-span-full">
            <AccountSummary />
          </div>

          <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-6">
            <FinancialChart />
            <TransactionsList />
          </div>

          <div className="md:col-span-1 lg:col-span-1">
            <LoanAd />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
