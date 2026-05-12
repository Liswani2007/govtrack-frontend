'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { Project, Transaction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  stalled: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  suspended: 'bg-red-100 text-red-800',
};

function formatCurrency(amount: number) {
  return `K ${amount.toLocaleString()}`;
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/transactions/project/${id}`)
    ]).then(([projRes, txRes]) => {
      setProject(projRes.data);
      setTransactions(txRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-10 text-slate-500">Loading...</div>;
  if (!project) return <div className="p-10 text-slate-500">Project not found.</div>;

  const remaining = project.budget_allocated - project.budget_spent;
  const spentPct = project.budget_allocated > 0
    ? ((project.budget_spent / project.budget_allocated) * 100).toFixed(1)
    : '0.0';

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/projects">
            <span className="text-slate-500 hover:text-slate-800 cursor-pointer text-sm">← Back to projects</span>
          </Link>
          <Link href="/">
            <h1 className="text-xl font-bold text-slate-800 cursor-pointer">GovTrack</h1>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Project header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{project.title}</h2>
            {project.description && (
              <p className="text-slate-500 mt-1">{project.description}</p>
            )}
            {project.contractor_name && (
              <p className="text-sm text-slate-400 mt-1">Contractor: {project.contractor_name}</p>
            )}
          </div>
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColors[project.status]}`}>
            {project.status}
          </span>
        </div>

        {/* Budget cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-slate-500 font-normal">Allocated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(project.budget_allocated)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-slate-500 font-normal">Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(project.budget_spent)}</p>
              <p className="text-xs text-slate-400 mt-1">{spentPct}% of budget</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-slate-500 font-normal">Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(remaining)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-8 text-sm">
            <div>
              <p className="text-slate-500">Start date</p>
              <p className="font-medium">{project.start_date}</p>
            </div>
            <div>
              <p className="text-slate-500">Deadline</p>
              <p className="font-medium">{project.deadline}</p>
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-slate-400 text-sm">No transactions recorded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Invoice ref</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b last:border-0">
                      <td className="py-2 capitalize">{tx.transaction_type}</td>
                      <td className="py-2 font-medium">{formatCurrency(tx.amount)}</td>
                      <td className="py-2 text-slate-400">{tx.invoice_reference || '—'}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tx.approved_by ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {tx.approved_by ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-2 text-slate-400">{new Date(tx.timestamp).toLocaleDateString()}</td>
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