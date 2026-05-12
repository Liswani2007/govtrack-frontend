'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FraudFlag {
  id: string;
  project_id: string;
  transaction_id: string | null;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggered_by: string;
  status: string;
  created_at: string;
}

interface Transaction {
  id: string;
  project_id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  invoice_reference: string | null;
  created_by: string;
  approved_by: string | null;
  timestamp: string;
}

const severityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

function formatCurrency(amount: number) {
  return `K ${amount.toLocaleString()}`;
}

export default function AuditorDashboard() {
  const router = useRouter();
  const [flags, setFlags] = useState<FraudFlag[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    Promise.all([
      api.get('/fraud-flags/'),
      api.get('/transactions/')
    ]).then(([flagsRes, txRes]) => {
      setFlags(flagsRes.data);
      setTransactions(txRes.data);
    }).catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, []);

  async function approveTransaction(id: string) {
    setApprovingId(id);
    try {
      await api.post(`/transactions/${id}/approve`, { approved: true });
      const txRes = await api.get('/transactions/');
      setTransactions(txRes.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Could not approve transaction.');
    } finally {
      setApprovingId(null);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/login');
  }

  const pending = transactions.filter(t => !t.approved_by);
  const openFlags = flags.filter(f => f.status === 'open');

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-800">GovTrack</h1>
            <p className="text-sm text-slate-500">Auditor Dashboard</p>
          </div>
          <div className="flex gap-3">
            <Link href="/projects">
              <Button variant="outline" size="sm">Public Portal</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-slate-500 font-normal">Open Fraud Flags</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{openFlags.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-slate-500 font-normal">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{pending.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-slate-500 font-normal">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-800">{transactions.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Fraud flags */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Fraud Flags</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400 text-sm">Loading...</p>
            ) : flags.length === 0 ? (
              <p className="text-slate-400 text-sm">No fraud flags detected.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="pb-2">Severity</th>
                    <th className="pb-2">Reason</th>
                    <th className="pb-2">Triggered by</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {flags.map(flag => (
                    <tr key={flag.id} className="border-b last:border-0">
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityColors[flag.severity]}`}>
                          {flag.severity}
                        </span>
                      </td>
                      <td className="py-2 text-slate-600 max-w-sm">{flag.reason}</td>
                      <td className="py-2 text-slate-400">{flag.triggered_by}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${flag.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {flag.status}
                        </span>
                      </td>
                      <td className="py-2 text-slate-400">
                        {new Date(flag.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Pending approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transactions Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400 text-sm">Loading...</p>
            ) : pending.length === 0 ? (
              <p className="text-slate-400 text-sm">No pending transactions.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Invoice ref</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(tx => (
                    <tr key={tx.id} className="border-b last:border-0">
                      <td className="py-2 capitalize">{tx.transaction_type}</td>
                      <td className="py-2 font-medium">{formatCurrency(tx.amount)}</td>
                      <td className="py-2 text-slate-400">{tx.invoice_reference || '—'}</td>
                      <td className="py-2 text-slate-400">{tx.description || '—'}</td>
                      <td className="py-2 text-slate-400">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-2">
                        <Button
                          size="sm"
                          onClick={() => approveTransaction(tx.id)}
                          disabled={approvingId === tx.id}
                        >
                          {approvingId === tx.id ? 'Approving...' : 'Approve'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}