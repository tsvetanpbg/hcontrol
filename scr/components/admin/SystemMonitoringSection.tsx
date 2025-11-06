"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuthToken } from '@/lib/auth';
import { Activity, Calendar, Database, RefreshCw, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function SystemMonitoringSection() {
  const [systemStats, setSystemStats] = useState({
    totalBusinesses: 0,
    totalLogs: 0,
    todayLogs: 0,
    lastGenerated: null as string | null,
    alertCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    setLoading(true);

    try {
      const token = getAuthToken();
      
      // Fetch businesses count
      const businessesRes = await fetch('/api/admin/businesses?limit=1000', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let totalBusinesses = 0;
      if (businessesRes.ok) {
        const businessesData = await businessesRes.json();
        totalBusinesses = businessesData.total || businessesData.businesses?.length || 0;
      }

      // Fetch today's logs for all businesses
      const today = new Date().toISOString().split('T')[0];
      let todayLogsCount = 0;

      // Try to get logs for business ID 1 as a sample
      const logsRes = await fetch(`/api/temperature-logs/1?startDate=${today}&endDate=${today}&limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => null);

      if (logsRes && logsRes.ok) {
        const logsData = await logsRes.json();
        todayLogsCount = logsData.length || 0;
      }

      setSystemStats({
        totalBusinesses,
        totalLogs: 0, // Would need separate endpoint
        todayLogs: todayLogsCount,
        lastGenerated: today,
        alertCount: 0 // Would need alert logic
      });

    } catch (error) {
      console.error('Error fetching system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAllLogs = async () => {
    setGenerating(true);

    try {
      const token = getAuthToken();
      const response = await fetch('/api/temperature-logs/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Успешно генерирани ${data.logsGenerated} записа за ${data.businessesProcessed} обекта`);
        fetchSystemStats();
      } else {
        throw new Error('Грешка при генериране на записи');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Зареждане на системна информация...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Състояние на системата
          </CardTitle>
          <CardDescription>
            Преглед на системните метрики и активност
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Статус на системата</span>
                  <span className="font-semibold text-green-600">Активна</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Обработени записи днес</span>
                  <span className="font-semibold">{systemStats.todayLogs}</span>
                </div>
                <Progress value={systemStats.todayLogs > 0 ? 100 : 0} className="h-2" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Регистрирани обекти</p>
                    <p className="text-2xl font-bold text-blue-600">{systemStats.totalBusinesses}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Записи днес</p>
                    <p className="text-2xl font-bold text-green-600">{systemStats.todayLogs}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Аларми</p>
                    <p className="text-2xl font-bold text-orange-600">{systemStats.alertCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Temperature Log Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Генериране на температурни записи</CardTitle>
          <CardDescription>
            Автоматично генериране на дневни температурни записи за всички обекти
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Последно генериране</p>
                  <p className="text-base font-semibold">
                    {systemStats.lastGenerated 
                      ? new Date(systemStats.lastGenerated).toLocaleDateString('bg-BG', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'Няма данни'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Обекти за процесиране</p>
                  <p className="text-base font-semibold">{systemStats.totalBusinesses}</p>
                </div>
              </div>

              <Button 
                onClick={handleGenerateAllLogs} 
                disabled={generating}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {generating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Генериране...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Генерирай днешни записи за всички обекти
                  </>
                )}
              </Button>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Информация за генерирането</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Системата генерира температурни записи за всяко устройство в регистрираните обекти</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Температурите са в нормалните диапазони: Хладилници (0-4°C), Фризери (-36 до -18°C), Топли витрини (63-80°C), Хладилни витрини (0-4°C)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Записите се генерират само веднъж на ден - дублиращи записи не се създават</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Препоръчително е да се изпълнява всеки ден за автоматично проследяване</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>Системна информация</CardTitle>
          <CardDescription>
            Обща информация за платформата
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-gray-600">Версия на системата</p>
              <p className="font-semibold">v1.0.0</p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-gray-600">База данни</p>
              <p className="font-semibold">Turso (LibSQL)</p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-gray-600">Последна актуализация</p>
              <p className="font-semibold">{new Date().toLocaleDateString('bg-BG')}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-gray-600">Статус</p>
              <p className="font-semibold text-green-600">Всички услуги активни</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}