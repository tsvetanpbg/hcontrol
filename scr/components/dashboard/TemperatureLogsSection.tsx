"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAuthToken } from '@/lib/auth';
import { Calendar, Download, RefreshCw, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TemperatureLogsSectionProps {
  businessId: number;
  business: any;
}

export default function TemperatureLogsSection({ businessId, business }: TemperatureLogsSectionProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('all');

  useEffect(() => {
    // Set default date range (last 7 days)
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(weekAgo.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchLogs();
    }
  }, [businessId, startDate, endDate, equipmentFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');

    try {
      const token = getAuthToken();
      let url = `/api/temperature-logs/${businessId}?startDate=${startDate}&endDate=${endDate}&limit=500`;
      
      if (equipmentFilter !== 'all') {
        url += `&equipmentType=${equipmentFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Грешка при зареждане на данните');
      }

      const data = await response.json();
      setLogs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateDailyLogs = async () => {
    setLoading(true);
    setError('');

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

      if (!response.ok) {
        throw new Error('Грешка при генериране на записи');
      }

      await fetchLogs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getEquipmentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'refrigerator': 'Хладилник',
      'freezer': 'Фризер',
      'hot_display': 'Топла витрина',
      'cold_display': 'Хладилна витрина'
    };
    return labels[type] || type;
  };

  const getTemperatureColor = (temp: number, type: string) => {
    const ranges: Record<string, { min: number; max: number }> = {
      'refrigerator': { min: 0, max: 4 },
      'freezer': { min: -36, max: -18 },
      'hot_display': { min: 63, max: 80 },
      'cold_display': { min: 0, max: 4 }
    };

    const range = ranges[type];
    if (!range) return 'text-gray-900';

    if (temp < range.min || temp > range.max) {
      return 'text-red-600 font-bold';
    }
    return 'text-green-600';
  };

  const exportToCSV = () => {
    const headers = ['Дата', 'Тип устройство', 'Номер', 'Температура (°C)'];
    const rows = logs.map(log => [
      log.logDate,
      getEquipmentTypeLabel(log.equipmentType),
      log.equipmentNumber,
      log.temperature
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `temperature_logs_${startDate}_${endDate}.csv`;
    link.click();
  };

  // Group logs by date
  const logsByDate = logs.reduce((acc, log) => {
    if (!acc[log.logDate]) {
      acc[log.logDate] = [];
    }
    acc[log.logDate].push(log);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Температурен дневник
            </CardTitle>
            <CardDescription>
              Автоматични записи на температурите на устройствата
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateDailyLogs} disabled={loading} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Генерирай днешни
            </Button>
            <Button onClick={exportToCSV} disabled={logs.length === 0} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Експорт CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="startDate">Начална дата</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Крайна дата</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipmentFilter">Филтър по устройство</Label>
            <Select
              value={equipmentFilter}
              onValueChange={setEquipmentFilter}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички</SelectItem>
                <SelectItem value="refrigerator">Хладилници</SelectItem>
                <SelectItem value="freezer">Фризери</SelectItem>
                <SelectItem value="hot_display">Топли витрини</SelectItem>
                <SelectItem value="cold_display">Хладилни витрини</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Зареждане на записи...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Няма налични записи за избрания период</p>
            <p className="text-sm text-gray-500">
              Използвайте бутона "Генерирай днешни" за да създадете нови записи
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(logsByDate).sort().reverse().map(date => (
              <div key={date} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 font-semibold">
                  {new Date(date).toLocaleDateString('bg-BG', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Тип устройство</TableHead>
                      <TableHead>Номер</TableHead>
                      <TableHead>Температура</TableHead>
                      <TableHead>Нормален диапазон</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsByDate[date].map((log, idx) => {
                      const ranges: Record<string, string> = {
                        'refrigerator': '0°C до 4°C',
                        'freezer': '-36°C до -18°C',
                        'hot_display': '63°C до 80°C',
                        'cold_display': '0°C до 4°C'
                      };

                      return (
                        <TableRow key={idx}>
                          <TableCell>{getEquipmentTypeLabel(log.equipmentType)}</TableCell>
                          <TableCell>№ {log.equipmentNumber}</TableCell>
                          <TableCell className={getTemperatureColor(log.temperature, log.equipmentType)}>
                            {log.temperature.toFixed(1)}°C
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {ranges[log.equipmentType]}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-sm text-gray-500">
          <p>Общо записи: {logs.length}</p>
        </div>
      </CardContent>
    </Card>
  );
}