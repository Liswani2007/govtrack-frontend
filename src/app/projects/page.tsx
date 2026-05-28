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

function ProgressBar({ allocated, spent }: { allocated: number; spent: number }) {
  const pct = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
      <div
        className="h-2 rounded-full bg-blue-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects/')
      .then(res => setProjects(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.contractor_name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-slate-800 cursor-pointer">GovTrack</h1>
          </Link>
          <Link href="/login">
            <span className="text-sm text-slate-500 hover:text-slate-800 cursor-pointer">Staff Login</span>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Public Projects</h2>
            <p className="text-slate-500 text-sm mt-1">{projects.length} projects tracked</p>
          </div>
          <Input
            placeholder="Search by title or contractor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-64"
          />
        </div>

        {loading ? (
          <p className="text-slate-500">Loading projects...</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-500">No projects found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(project => {
              const spentPct = project.budget_allocated > 0
                ? ((project.budget_spent / project.budget_allocated) * 100).toFixed(1)
                : '0.0';
              return (
                <Link href={`/projects/${project.id}`} key={project.id}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base">{project.title}</CardTitle>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusColors[project.status]}`}>
                          {project.status}
                        </span>
                      </div>
                      {project.contractor_name && (
                        <p className="text-xs text-slate-500">Contractor: {project.contractor_name}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">Budget</span>
                        <span className="font-medium">{formatCurrency(project.budget_allocated)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">Spent</span>
                        <span className="font-medium">{formatCurrency(project.budget_spent)}</span>
                      </div>
                      <ProgressBar allocated={project.budget_allocated} spent={project.budget_spent} />
                      <p className="text-xs text-slate-400 mt-1 text-right">{spentPct}% utilised</p>
                      <div className="flex justify-between text-xs text-slate-400 mt-3">
                        <span>Start: {project.start_date}</span>
                        <span>Deadline: {project.deadline}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
