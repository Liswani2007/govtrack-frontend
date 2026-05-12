'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res.data.access_token;
      localStorage.setItem('token', token);

      // Decode role from token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role;
      localStorage.setItem('role', role);

      if (role === 'auditor') {
        router.push('/dashboard/auditor');
      } else if (role === 'officer' || role === 'super_admin') {
        router.push('/dashboard/officer');
      } else {
        router.push('/projects');
      }
    } catch (err: any) {
      setError('Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-800">GovTrack</CardTitle>
          <p className="text-slate-500 text-sm">Staff login — officers and auditors only</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@govtrack.zm"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button onClick={handleLogin} disabled={loading} className="w-full">
            {loading ? 'Logging in...' : 'Login'}
          </Button>
          <p className="text-center text-sm text-slate-400">
            <a href="/projects" className="hover:text-slate-600">← Back to public portal</a>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}