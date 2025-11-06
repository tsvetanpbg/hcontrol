"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAuthToken, getAuthUser, logout, isAdmin } from '@/lib/auth';
import { LogOut, Users, Building2, Activity, TrendingUp, FileText, Thermometer, ClipboardCheck } from 'lucide-react';
import BusinessListSection from '@/components/admin/BusinessListSection';
import SystemMonitoringSection from '@/components/admin/SystemMonitoringSection';
import EstablishmentsSection from '@/components/admin/EstablishmentsSection';
import DiaryDevicesSection from '@/components/admin/DiaryDevicesSection';
import UsersSection from '@/components/admin/UsersSection';
import IncomingControlsSection from '@/components/admin/IncomingControlsSection';
import HealthBooksExpiringSection from '@/components/admin/HealthBooksExpiringSection';

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    totalEstablishments: 0,
    totalDevices: 0,
    totalLogs: 0,
    activeToday: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('users');

  useEffect(() => {
    const token = getAuthToken();
    const userData = getAuthUser();

    if (!token || !userData || !isAdmin()) {
      router.push('/login-admin');
      return;
    }

    setUser(userData);
    fetchStats(token);
  }, [router]);

  useEffect(() => {
    // Check for action parameter to open add user dialog
    const actionParam = searchParams.get('action');
    if (actionParam === 'add') {
      setActiveTab('users');
      // Trigger add user dialog in UsersSection via ref or event
    }
  }, [searchParams]);

  const fetchStats = async (token: string) => {
    try {
      const [businessesRes, establishmentsRes, devicesRes, usersRes] = await Promise.all([
      fetch('/api/admin/businesses?limit=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch('/api/admin/establishments?limit=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => null),
      fetch('/api/admin/diary-devices?limit=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => null),
      fetch('/api/admin/users?limit=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => null)]
      );

      if (businessesRes.ok) {
        const businessesData = await businessesRes.json();
        setStats((prev) => ({
          ...prev,
          totalBusinesses: businessesData.total || businessesData.businesses?.length || 0
        }));
      }

      if (establishmentsRes && establishmentsRes.ok) {
        const establishmentsData = await establishmentsRes.json();
        setStats((prev) => ({
          ...prev,
          totalEstablishments: establishmentsData.total || 0
        }));
      }

      if (devicesRes && devicesRes.ok) {
        const devicesData = await devicesRes.json();
        setStats((prev) => ({
          ...prev,
          totalDevices: devicesData.total || 0
        }));
      }

      if (usersRes && usersRes.ok) {
        const usersData = await usersRes.json();
        setStats((prev) => ({
          ...prev,
          totalUsers: usersData.total || 0
        }));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Зареждане...</p>
          </div>
        </main>
        <Footer />
      </div>);

  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Activity className="h-8 w-8 text-blue-600" />
                Администраторски панел
              </h1>
              <p className="text-gray-600 mt-1">Добре дошли, {user?.email}</p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Изход
            </Button>
          </div>

          {/* Stats Cards - Only visible to administrators */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card className="!w-[172px] !h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Потребители</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Регистрирани (само за админи)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Регистрирани обекти</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBusinesses}</div>
                <p className="text-xs text-muted-foreground">
                  Общо в системата
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Заведения</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEstablishments}</div>
                <p className="text-xs text-muted-foreground">
                  Справочници
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Устройства</CardTitle>
                <Thermometer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDevices}</div>
                <p className="text-xs text-muted-foreground">
                  Дневници
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Системна активност</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Активна</div>
                <p className="text-xs text-muted-foreground">
                  Всички системи работят нормално
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="users">Потребители</TabsTrigger>
              <TabsTrigger value="businesses">Обекти</TabsTrigger>
              <TabsTrigger value="establishments">Справочници</TabsTrigger>
              <TabsTrigger value="diary-devices">Дневници</TabsTrigger>
              <TabsTrigger value="incoming-controls">Входящ контрол</TabsTrigger>
              <TabsTrigger value="health-books">Здравни книжки</TabsTrigger>
              <TabsTrigger value="monitoring">Мониторинг</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <UsersSection openAddDialog={searchParams.get('action') === 'add'} />
            </TabsContent>

            <TabsContent value="businesses" className="space-y-4">
              <BusinessListSection />
            </TabsContent>

            <TabsContent value="establishments" className="space-y-4">
              <EstablishmentsSection />
            </TabsContent>

            <TabsContent value="diary-devices" className="space-y-4">
              <DiaryDevicesSection />
            </TabsContent>

            <TabsContent value="incoming-controls" className="space-y-4">
              <IncomingControlsSection />
            </TabsContent>

            <TabsContent value="health-books" className="space-y-4">
              <HealthBooksExpiringSection />
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-4">
              <SystemMonitoringSection />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>);

}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Зареждане...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}