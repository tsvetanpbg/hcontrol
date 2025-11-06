"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAuthToken, getAuthUser, logout, isAdmin } from '@/lib/auth';
import { LogOut, Download, Building2, Thermometer, Users, Activity, TrendingUp, FileText, ClipboardCheck, Calendar, Camera, Sparkles, User, AlertCircle } from 'lucide-react';
import ProfileSection from '@/components/dashboard/ProfileSection';
import TemperatureLogsSection from '@/components/dashboard/TemperatureLogsSection';
import BusinessListSection from '@/components/admin/BusinessListSection';
import SystemMonitoringSection from '@/components/admin/SystemMonitoringSection';
import EstablishmentsSection from '@/components/admin/EstablishmentsSection';
import DiaryDevicesSection from '@/components/admin/DiaryDevicesSection';
import UsersSection from '@/components/admin/UsersSection';
import IncomingControlsSection from '@/components/admin/IncomingControlsSection';
import HealthBooksExpiringSection from '@/components/admin/HealthBooksExpiringSection';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState({
    totalBusinesses: 0,
    totalEstablishments: 0,
    totalDevices: 0,
    totalUsers: 0
  });

  // User stats
  const [userStats, setUserStats] = useState({
    establishments: 0,
    personnel: 0,
    diaryDevices: 0,
    incomingControls: 0,
    cleaningTemplates: 0,
    expiringHealthBooks: 0
  });

  const [establishments, setEstablishments] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [diaryDevices, setDiaryDevices] = useState<any[]>([]);
  const [incomingControls, setIncomingControls] = useState<any[]>([]);
  const [cleaningTemplates, setCleaningTemplates] = useState<any[]>([]);

  const userIsAdmin = isAdmin();

  useEffect(() => {
    const token = getAuthToken();
    const userData = getAuthUser();

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(userData);
    
    if (userIsAdmin) {
      fetchAdminStats(token);
    } else {
      fetchUserData(token);
    }
  }, [router, userIsAdmin]);

  const fetchBusiness = async (userId: number, token: string) => {
    try {
      const response = await fetch(`/api/admin/businesses?limit=1&offset=0`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok && data.businesses && data.businesses.length > 0) {
        const userBusiness = data.businesses.find((b: any) => b.userId === userId);
        if (userBusiness) {
          setBusiness(userBusiness);
        }
      }
    } catch (error) {
      console.error('Error fetching business:', error);
    }
  };

  const fetchUserData = async (token: string) => {
    try {
      const [
        establishmentsRes,
        personnelRes,
        diaryDevicesRes,
        incomingControlsRes,
        cleaningTemplatesRes
      ] = await Promise.all([
        fetch('/api/establishments/user', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/personnel', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/diary-devices/user', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/incoming-controls/user', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/cleaning-templates', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      let establishmentsData: any[] = [];
      let personnelData: any[] = [];
      let diaryDevicesData: any[] = [];
      let incomingControlsData: any[] = [];
      let cleaningTemplatesData: any[] = [];

      if (establishmentsRes.ok) {
        const data = await establishmentsRes.json();
        establishmentsData = data.establishments || [];
        setEstablishments(establishmentsData);
      }

      if (personnelRes.ok) {
        const data = await personnelRes.json();
        personnelData = data.personnel || [];
        setPersonnel(personnelData);
      }

      if (diaryDevicesRes.ok) {
        const data = await diaryDevicesRes.json();
        diaryDevicesData = Array.isArray(data) ? data : [];
        setDiaryDevices(diaryDevicesData);
      }

      if (incomingControlsRes.ok) {
        const data = await incomingControlsRes.json();
        incomingControlsData = Array.isArray(data) ? data : [];
        setIncomingControls(incomingControlsData);
      }

      if (cleaningTemplatesRes.ok) {
        const data = await cleaningTemplatesRes.json();
        cleaningTemplatesData = data.templates || [];
        setCleaningTemplates(cleaningTemplatesData);
      }

      // Count expiring health books (within 30 days)
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiringCount = personnelData.filter((p: any) => {
        const validityDate = new Date(p.healthBookValidity);
        return validityDate >= today && validityDate <= thirtyDaysFromNow;
      }).length;

      setUserStats({
        establishments: establishmentsData.length,
        personnel: personnelData.length,
        diaryDevices: diaryDevicesData.length,
        incomingControls: incomingControlsData.length,
        cleaningTemplates: cleaningTemplatesData.length,
        expiringHealthBooks: expiringCount
      });

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminStats = async (token: string) => {
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
        }).catch(() => null)
      ]);

      if (businessesRes.ok) {
        const businessesData = await businessesRes.json();
        setAdminStats((prev) => ({
          ...prev,
          totalBusinesses: businessesData.total || businessesData.businesses?.length || 0
        }));
      }

      if (establishmentsRes && establishmentsRes.ok) {
        const establishmentsData = await establishmentsRes.json();
        setAdminStats((prev) => ({
          ...prev,
          totalEstablishments: establishmentsData.total || 0
        }));
      }

      if (devicesRes && devicesRes.ok) {
        const devicesData = await devicesRes.json();
        setAdminStats((prev) => ({
          ...prev,
          totalDevices: devicesData.total || 0
        }));
      }

      if (usersRes && usersRes.ok) {
        const usersData = await usersRes.json();
        setAdminStats((prev) => ({
          ...prev,
          totalUsers: usersData.total || 0
        }));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
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
      </div>
    );
  }

  // Admin Dashboard View
  if (userIsAdmin) {
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
                  Табло - Администраторски панел
                </h1>
                <p className="text-gray-600 mt-1">Добре дошли, {user?.email}</p>
              </div>
              <Button onClick={handleLogout} variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                Изход
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Потребители</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Регистрирани
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Регистрирани обекти</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.totalBusinesses}</div>
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
                  <div className="text-2xl font-bold">{adminStats.totalEstablishments}</div>
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
                  <div className="text-2xl font-bold">{adminStats.totalDevices}</div>
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
            <Tabs defaultValue="users" className="space-y-4">
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
                <UsersSection />
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
      </div>
    );
  }

  // User Dashboard View - БОГАТ И УДОБЕН
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-blue-600" />
                Табло - Потребителски панел
              </h1>
              <p className="text-gray-600 mt-1">Добре дошли, {user?.email}</p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Изход
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Заведения</CardTitle>
                <Building2 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.establishments}</div>
                <p className="text-xs text-muted-foreground">
                  Регистрирани
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Служители</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.personnel}</div>
                <p className="text-xs text-muted-foreground">
                  Активни
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Дневници</CardTitle>
                <Thermometer className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.diaryDevices}</div>
                <p className="text-xs text-muted-foreground">
                  Устройства
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Контроли</CardTitle>
                <Camera className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.incomingControls}</div>
                <p className="text-xs text-muted-foreground">
                  Входящи
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Почистване</CardTitle>
                <Sparkles className="h-4 w-4 text-cyan-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.cleaningTemplates}</div>
                <p className="text-xs text-muted-foreground">
                  Шаблони
                </p>
              </CardContent>
            </Card>

            <Card className={`hover:shadow-lg transition-shadow ${userStats.expiringHealthBooks > 0 ? 'border-red-300 bg-red-50' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Здравни книжки</CardTitle>
                <AlertCircle className={`h-4 w-4 ${userStats.expiringHealthBooks > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${userStats.expiringHealthBooks > 0 ? 'text-red-600' : ''}`}>
                  {userStats.expiringHealthBooks}
                </div>
                <p className="text-xs text-muted-foreground">
                  Изтичат скоро
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Link href="/spravochnici">
              <Card className="cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Справочници</div>
                    <div className="text-sm text-gray-600">Управление на заведения</div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dnevniczi">
              <Card className="cursor-pointer hover:shadow-lg hover:border-purple-500 transition-all">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Thermometer className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Дневници</div>
                    <div className="text-sm text-gray-600">Температурни записи</div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dnevniczi?type=Входящ контрол">
              <Card className="cursor-pointer hover:shadow-lg hover:border-orange-500 transition-all">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Camera className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Входящ контрол</div>
                    <div className="text-sm text-gray-600">Контрол на суровини</div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/template-cleaning">
              <Card className="cursor-pointer hover:shadow-lg hover:border-cyan-500 transition-all">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="p-3 bg-cyan-100 rounded-lg">
                    <Sparkles className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Почистване</div>
                    <div className="text-sm text-gray-600">Шаблони</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Общ преглед</TabsTrigger>
              <TabsTrigger value="establishments">Заведения</TabsTrigger>
              <TabsTrigger value="personnel">Служители</TabsTrigger>
              <TabsTrigger value="diaries">Дневници</TabsTrigger>
              <TabsTrigger value="controls">Входящ контрол</TabsTrigger>
              <TabsTrigger value="cleaning">Почистване</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Establishments Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Вашите заведения</CardTitle>
                      <CardDescription>Преглед на регистрирани заведения</CardDescription>
                    </div>
                    <Link href="/spravochnici">
                      <Button size="sm">Виж всички</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {establishments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Нямате регистрирани заведения</p>
                      <Link href="/spravochnici">
                        <Button className="mt-4" variant="outline">Добави заведение</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {establishments.slice(0, 3).map((est: any) => (
                        <Card key={est.id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <CardTitle className="text-lg">{est.companyName}</CardTitle>
                            <CardDescription>{est.establishmentType}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Служители:</span>
                                <span className="font-medium">{est.employeeCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">ЕИК:</span>
                                <span className="font-medium">{est.eik}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Latest Incoming Controls */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Последни контроли</CardTitle>
                      <Link href="/dnevniczi?type=Входящ контрол">
                        <Button size="sm" variant="outline">Виж всички</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {incomingControls.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 text-sm">
                        <Camera className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                        <p>Няма записани контроли</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {incomingControls.slice(0, 3).map((control: any) => (
                          <div key={control.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <img
                              src={control.imageUrl}
                              alt="Control"
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{control.controlDate}</div>
                              {control.notes && (
                                <div className="text-xs text-gray-600 truncate">{control.notes}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Diary Devices Summary */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Температурни дневници</CardTitle>
                      <Link href="/dnevniczi">
                        <Button size="sm" variant="outline">Виж всички</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {diaryDevices.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 text-sm">
                        <Thermometer className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                        <p>Няма добавени устройства</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {diaryDevices.slice(0, 5).map((device: any) => (
                          <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="text-sm font-medium">{device.deviceName}</div>
                              <div className="text-xs text-gray-600">{device.deviceType}</div>
                            </div>
                            <div className="text-sm text-gray-600">
                              {device.minTemp}℃ до {device.maxTemp}℃
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Expiring Health Books Warning */}
              {userStats.expiringHealthBooks > 0 && (
                <Card className="border-red-300 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-lg text-red-900 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Внимание: Изтичащи здравни книжки
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-800">
                      Имате <strong>{userStats.expiringHealthBooks}</strong> служител(и) с здравни книжки, които изтичат в следващите 30 дни.
                    </p>
                    <Link href="/spravochnici?tab=personnel">
                      <Button className="mt-4" variant="destructive">Преглед на служители</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Establishments Tab */}
            <TabsContent value="establishments" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Заведения</CardTitle>
                      <CardDescription>Управление на вашите заведения</CardDescription>
                    </div>
                    <Link href="/spravochnici">
                      <Button>
                        <Building2 className="mr-2 h-4 w-4" />
                        Добави заведение
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {establishments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium mb-2">Нямате регистрирани заведения</p>
                      <p className="text-sm mb-4">Започнете като добавите вашето първо заведение</p>
                      <Link href="/spravochnici">
                        <Button>Добави заведение</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {establishments.map((est: any) => (
                        <Card key={est.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <CardTitle className="text-lg">{est.companyName}</CardTitle>
                            <CardDescription>{est.establishmentType}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Управител:</span>
                                <span className="font-medium">{est.managerName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Служители:</span>
                                <span className="font-medium">{est.employeeCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">ЕИК:</span>
                                <span className="font-medium">{est.eik}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Адрес:</span>
                                <span className="font-medium truncate">{est.registrationAddress}</span>
                              </div>
                            </div>
                            <Link href="/spravochnici">
                              <Button className="w-full mt-4" variant="outline" size="sm">
                                Редактирай
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Personnel Tab */}
            <TabsContent value="personnel" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Служители</CardTitle>
                      <CardDescription>Управление на персонал</CardDescription>
                    </div>
                    <Link href="/spravochnici?tab=personnel">
                      <Button>
                        <Users className="mr-2 h-4 w-4" />
                        Добави служител
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {personnel.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium mb-2">Нямате добавени служители</p>
                      <p className="text-sm mb-4">Добавете служители към вашите заведения</p>
                      <Link href="/spravochnici?tab=personnel">
                        <Button>Добави служител</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {personnel.map((person: any) => {
                        const establishment = establishments.find((e: any) => e.id === person.establishmentId);
                        const validityDate = new Date(person.healthBookValidity);
                        const today = new Date();
                        const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
                        const isExpiringSoon = validityDate >= today && validityDate <= thirtyDaysFromNow;
                        
                        // Calculate days remaining
                        const timeDiff = validityDate.getTime() - today.getTime();
                        const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

                        return (
                          <Card key={person.id} className={`hover:shadow-md transition-shadow ${isExpiringSoon ? 'border-red-300' : ''}`}>
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                {person.photoUrl && (
                                  <img
                                    src={person.photoUrl}
                                    alt={person.fullName}
                                    className="w-20 h-20 rounded-lg object-cover"
                                  />
                                )}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <div className="text-sm text-gray-600">Име</div>
                                    <div className="font-medium">{person.fullName}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-600">Длъжност</div>
                                    <div className="font-medium">{person.position}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-600">Заведение</div>
                                    <div className="font-medium">{establishment?.companyName || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-600">Здравна книжка №</div>
                                    <div className="font-medium">{person.healthBookNumber}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-600">Валидност</div>
                                    <div className={`font-medium ${isExpiringSoon ? 'text-red-600' : ''}`}>
                                      {person.healthBookValidity}
                                      {isExpiringSoon && ' ⚠️'}
                                    </div>
                                    <div className={`text-xs mt-1 ${daysRemaining < 0 ? 'text-red-600 font-semibold' : daysRemaining <= 30 ? 'text-orange-600' : 'text-gray-500'}`}>
                                      {daysRemaining < 0 
                                        ? `Изтекла преди ${Math.abs(daysRemaining)} дни`
                                        : daysRemaining === 0
                                        ? 'Изтича днес'
                                        : daysRemaining === 1
                                        ? 'Остава 1 ден'
                                        : `Остават ${daysRemaining} дни`
                                      }
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Diaries Tab */}
            <TabsContent value="diaries" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Температурни дневници</CardTitle>
                      <CardDescription>Устройства за мониторинг на температури</CardDescription>
                    </div>
                    <Link href="/dnevniczi">
                      <Button>
                        <Thermometer className="mr-2 h-4 w-4" />
                        Управление на дневници
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {diaryDevices.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Thermometer className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium mb-2">Нямате добавени устройства</p>
                      <p className="text-sm mb-4">Добавете устройства за температурен мониторинг</p>
                      <Link href="/dnevniczi">
                        <Button>Добави устройство</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {diaryDevices.map((device: any) => (
                        <Card key={device.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                  <Thermometer className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                  <div className="font-medium">{device.deviceName}</div>
                                  <div className="text-sm text-gray-600">{device.deviceType}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {device.minTemp}℃ до {device.maxTemp}℃
                                </div>
                                <div className="text-xs text-gray-600">
                                  Диапазон
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Incoming Controls Tab */}
            <TabsContent value="controls" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Входящ контрол</CardTitle>
                      <CardDescription>Контрол на суровини и доставки</CardDescription>
                    </div>
                    <Link href="/dnevniczi?type=Входящ контрол">
                      <Button>
                        <Camera className="mr-2 h-4 w-4" />
                        Добави контрол
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {incomingControls.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium mb-2">Нямате записани контроли</p>
                      <p className="text-sm mb-4">Започнете записване на входящ контрол</p>
                      <Link href="/dnevniczi?type=Входящ контрол">
                        <Button>Добави контрол</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {incomingControls.map((control: any) => (
                        <Card key={control.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-video relative">
                            <img
                              src={control.imageUrl}
                              alt="Control"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Дата:</span>
                                <span className="font-medium">{control.controlDate}</span>
                              </div>
                              {control.notes && (
                                <div>
                                  <div className="text-sm text-gray-600">Бележки:</div>
                                  <div className="text-sm">{control.notes}</div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cleaning Tab */}
            <TabsContent value="cleaning" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Шаблони за почистване</CardTitle>
                      <CardDescription>Управление на графици за почистване</CardDescription>
                    </div>
                    <Link href="/template-cleaning">
                      <Button>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Създай шаблон
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {cleaningTemplates.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Sparkles className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium mb-2">Нямате създадени шаблони</p>
                      <p className="text-sm mb-4">Създайте шаблон за почистване</p>
                      <Link href="/template-cleaning">
                        <Button>Създай шаблон</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cleaningTemplates.map((template: any) => {
                        const daysOfWeek = Array.isArray(template.daysOfWeek) 
                          ? template.daysOfWeek 
                          : JSON.parse(template.daysOfWeek || '[]');
                        const cleaningHours = Array.isArray(template.cleaningHours)
                          ? template.cleaningHours
                          : JSON.parse(template.cleaningHours || '[]');
                        
                        return (
                          <Card key={template.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                              <CardTitle className="text-lg">{template.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <div className="text-gray-600">Дни:</div>
                                  <div className="font-medium">{daysOfWeek.length} избрани</div>
                                </div>
                                <div>
                                  <div className="text-gray-600">Часове:</div>
                                  <div className="font-medium">{cleaningHours.join(', ')}</div>
                                </div>
                                <div>
                                  <div className="text-gray-600">Продължителност:</div>
                                  <div className="font-medium">{template.duration}ч</div>
                                </div>
                                <div className="flex items-center justify-end">
                                  <Link href="/template-cleaning">
                                    <Button size="sm" variant="outline">Редактирай</Button>
                                  </Link>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}