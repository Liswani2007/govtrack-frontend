'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { Project, Transaction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  stalled: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  suspended: 'bg-red-100 text-red-800',
};

interface ProgressUpdate {
  id: string;
  project_id: string;
  progress_percentage: number;
  description: string | null;
  image_url: string | null;
  created_by: string;
  verified_by: string | null;
  created_at: string;
}

function formatCurrency(amount: number) {
  return `K ${amount.toLocaleString()}`;
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [progress, setProgress] = useState<ProgressUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/transactions/project/${id}`),
      api.get(`/progress/project/${id}`)
    ]).then(([projRes, txRes, progRes]) => {
      setProject(projRes.data);
      setTransactions(txRes.data);
      setProgress(progRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-10 text-slate-500">Loading...</div>;
  if (!project) return <div className="p-10 text-slate-500">Project not found.</div>;

  const remaining = project.budget_allocated - project.budget_spent;
  const spentPct = project.budget_allocated > 0
    ? ((project.budget_spent / project.budget_allocated) * 100).toFixed(1)
    : '0.0';
  const latestProgress = progress.length > 0
    ? progress[progress.length - 1].progress_percentage
    : 0;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/projects">
            <span className="text-slate-500 hover:text-slate-800 cursor-pointer text-sm">Back to projects</span>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

        {/* Progress bar */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Project Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>Progress</span>
              <span className="font-medium">{latestProgress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-blue-500 transition-all"
                style={{ width: `${latestProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-3">
              <span>Start: {project.start_date}</span>
              <span>Deadline: {project.deadline}</span>
            </div>
          </CardContent>
        </Card>

        {/* Progress updates */}
        {progress.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Progress Updates</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {progress.map(u => (
                <div key={u.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm">{u.progress_percentage}% complete</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.verified_by ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {u.verified_by ? 'Verified' : 'Unverified'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {u.description && <p className="text-sm text-slate-500">{u.description}</p>}
                  {u.image_url && (
                    // Uploaded evidence can come from arbitrary storage providers.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.image_url}
                      alt="Site photo"
                      className="mt-2 rounded-lg max-h-48 object-cover"
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

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
                      <td className="py-2 text-slate-400">{tx.invoice_reference || 'N/A'}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tx.approved_at ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {tx.approved_at ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-2 text-slate-400">
                        {new Date(tx.timestamp).toLocaleDateString()}
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
