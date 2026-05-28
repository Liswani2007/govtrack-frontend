'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  stalled: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  suspended: 'bg-red-100 text-red-800',
};

function formatCurrency(amount: number) {
  return `K ${amount.toLocaleString()}`;
}

function ProgressBar({ spent, allocated }: { spent: number; allocated: number }) {
  const pct = Math.min((spent / allocated) * 100, 100);
  const color = pct > 90 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
      <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects/')
      .then(res => setProjects(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.contractor_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">GovTrack</h1>
          <p className="text-sm text-slate-500">Public Finance Transparency Portal</p>
        </div>
        <Link href="/login" className="text-sm text-blue-600 hover:underline">
          Officer / Auditor login -&gt;
        </Link>
      </div>

      {/* Stats */}
      <div className="px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{projects.length}</div>
            <div className="text-sm text-slate-500">Total projects</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'active').length}
            </div>
            <div className="text-sm text-slate-500">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {formatCurrency(projects.reduce((s, p) => s + p.budget_allocated, 0))}
            </div>
            <div className="text-sm text-slate-500">Total allocated</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {formatCurrency(projects.reduce((s, p) => s + p.budget_spent, 0))}
            </div>
            <div className="text-sm text-slate-500">Total spent</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="px-6 mb-4">
        <Input
          placeholder="Search projects or contractors..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Projects */}
      <div className="px-6 pb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && <p className="text-slate-500">Loading projects...</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-slate-500">No projects found.</p>
        )}
        {filtered.map(project => (
          <Link href={`/projects/${project.id}`} key={project.id}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{project.title}</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusColors[project.status]}`}>
                    {project.status}
                  </span>
                </div>
                {project.contractor_name && (
                  <p className="text-xs text-slate-500">{project.contractor_name}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Allocated</span>
                    <span className="font-medium">{formatCurrency(project.budget_allocated)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Spent</span>
                    <span className="font-medium">{formatCurrency(project.budget_spent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Remaining</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(project.budget_allocated - project.budget_spent)}
                    </span>
                  </div>
                </div>
                <ProgressBar spent={project.budget_spent} allocated={project.budget_allocated} />
                <div className="mt-2 text-xs text-slate-400">
                  Deadline: {new Date(project.deadline).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
