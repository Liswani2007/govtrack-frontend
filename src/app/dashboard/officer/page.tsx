'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  stalled: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  suspended: 'bg-red-100 text-red-800',
};

function formatCurrency(amount: number) {
  return `K ${amount.toLocaleString()}`;
}

export default function OfficerDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    api.get('/projects/')
      .then(res => setProjects(res.data))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/login');
  }

  const totalAllocated = projects.reduce((sum, p) => sum + p.budget_allocated, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.budget_spent, 0);
  const activeCount = projects.filter(p => p.status === 'active').length;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-800">GovTrack</h1>
            <p className="text-sm text-slate-500">Officer Dashboard</p>
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
              <CardTitle className="text-sm text-slate-500 font-normal">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-800">{projects.length}</p>
              <p className="text-xs text-slate-400 mt-1">{activeCount} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-slate-500 font-normal">Total Allocated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-800">{formatCurrency(totalAllocated)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-slate-500 font-normal">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalSpent)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Projects table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400 text-sm">Loading...</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="pb-2">Project</th>
                    <th className="pb-2">Contractor</th>
                    <th className="pb-2">Allocated</th>
                    <th className="pb-2">Spent</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(p => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 font-medium">
                        <Link href={`/projects/${p.id}`} className="hover:text-blue-600">
                          {p.title}
                        </Link>
                      </td>
                      <td className="py-2 text-slate-400">{p.contractor_name || '—'}</td>
                      <td className="py-2">{formatCurrency(p.budget_allocated)}</td>
                      <td className="py-2">{formatCurrency(p.budget_spent)}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status]}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2 text-slate-400">{p.deadline}</td>
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