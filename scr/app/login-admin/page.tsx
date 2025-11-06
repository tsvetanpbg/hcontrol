"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

export default function LoginAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Грешка при вход');
      }

      // Check if user is admin
      if (data.user.role !== 'admin') {
        throw new Error('Нямате администраторски права');
      }

      // Store token in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Dispatch custom event to update header
      window.dispatchEvent(new Event('auth-change'));

      // Redirect to admin panel
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Възникна грешка при влизането');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-md">
          <Button asChild variant="ghost" className="mb-6">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Върни се назад
            </Link>
          </Button>

          <Card className="border-blue-200">
            <CardHeader className="bg-blue-50">
              <div className="flex items-center justify-center mb-2">
                <Shield className="w-12 h-12 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-center">Администраторски вход</CardTitle>
              <CardDescription className="text-center">
                Само за упълномощени администратори
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Парола</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Влизане...' : 'Влез като администратор'}
                </Button>

                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-600 mb-2">Демо админ данни:</p>
                  <p className="text-xs text-gray-500">
                    Email: admin@hei-clone.bg<br />
                    Парола: admin123
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}