"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { getAuthToken, isAuthenticated } from '@/lib/auth';
import { ClipboardList, Plus, Trash2, AlertCircle, Calendar, FileImage } from 'lucide-react';
import { toast } from 'sonner';
import { exportCleaningLogsToImage } from '@/lib/image-export-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PRODUCTS = ['Доместос', 'Белина'];

const CLEANING_AREAS = [
  'Подове',
  'Работни повърхности',
  'Маси',
  'Кухненски съдове и инвентар',
  'Хладилници',
  'Чаши и прибори за хранене',
  'Подносна посуда',
  'Измервателни уреди',
  'Фризери',
  'Стени и тавани',
  'Транспортни средства',
  'Тоалетни',
];

const DAYS_MAP: Record<string, number> = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6
};

export default function CleaningLogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [last5DaysLogs, setLast5DaysLogs] = useState<Record<string, any[]>>({});
  const [templates, setTemplates] = useState<any[]>([]);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<number | null>(null);
  const [autoGenerating, setAutoGenerating] = useState(false);

  const [formData, setFormData] = useState({
    startTime: '08:00',
    endTime: '09:00',
    cleaningAreas: [] as string[],
    products: [] as string[],
    employeeId: 'none',
    notes: '',
    logDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [router]);

  useEffect(() => {
    if (!loadingData) {
      fetchLogs();
      fetchLast5Days();
    }
  }, [selectedEstablishment, loadingData]);

  // Auto-generate cleaning logs from templates on page load
  useEffect(() => {
    if (!loadingData && templates.length > 0 && !autoGenerating) {
      autoGenerateFromTemplates();
    }
  }, [loadingData, templates]);

  const fetchData = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const [estRes, persRes, templatesRes] = await Promise.all([
        fetch('/api/establishments/user', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/personnel', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/cleaning-templates?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (estRes.ok) {
        const estData = await estRes.json();
        setEstablishments(estData.establishments || []);
        if (estData.establishments?.length > 0) {
          setSelectedEstablishment(estData.establishments[0].id.toString());
        }
      }

      if (persRes.ok) {
        const persData = await persRes.json();
        setPersonnel(persData.personnel || []);
      }

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.templates || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchLogs = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      let url = '/api/cleaning-logs?limit=100';
      if (selectedEstablishment) {
        url += `&establishmentId=${selectedEstablishment}`;
      }

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const fetchLast5Days = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const today = new Date();
      const last5Days: Record<string, any[]> = {};
      
      for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        let url = `/api/cleaning-logs?logDate=${dateStr}&limit=100`;
        if (selectedEstablishment) {
          url += `&establishmentId=${selectedEstablishment}`;
        }

        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          last5Days[dateStr] = data.logs || [];
        }
      }
      
      setLast5DaysLogs(last5Days);
    } catch (error) {
      console.error('Error fetching last 5 days logs:', error);
    }
  };

  const autoGenerateFromTemplates = async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dayOfWeek = today.getDay();
    
    try {
      // Check if logs already exist for today
      const token = getAuthToken();
      if (!token) return;

      let url = `/api/cleaning-logs?logDate=${todayStr}&limit=100`;
      if (selectedEstablishment) {
        url += `&establishmentId=${selectedEstablishment}`;
      }

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const existingLogs = data.logs || [];

        // If logs already exist for today, don't auto-generate
        if (existingLogs.length > 0) {
          console.log('Logs already exist for today, skipping auto-generation');
          return;
        }

        // Find matching templates for today
        const matchingTemplates = templates.filter(template => {
          const daysOfWeek = typeof template.daysOfWeek === 'string' 
            ? JSON.parse(template.daysOfWeek) 
            : template.daysOfWeek;
          
          return daysOfWeek.some((day: string) => DAYS_MAP[day.toLowerCase()] === dayOfWeek);
        });

        if (matchingTemplates.length === 0) {
          console.log('No templates found for today');
          return;
        }

        // Filter templates by selected establishment if any
        const filteredTemplates = selectedEstablishment 
          ? matchingTemplates.filter(t => !t.establishmentId || t.establishmentId === parseInt(selectedEstablishment))
          : matchingTemplates;

        if (filteredTemplates.length === 0) {
          console.log('No templates for selected establishment');
          return;
        }

        setAutoGenerating(true);
        let successCount = 0;

        for (const template of filteredTemplates) {
          const cleaningHours = typeof template.cleaningHours === 'string' 
            ? JSON.parse(template.cleaningHours) 
            : template.cleaningHours;
          const products = typeof template.products === 'string'
            ? JSON.parse(template.products)
            : template.products;
          const cleaningAreas = typeof template.cleaningAreas === 'string'
            ? JSON.parse(template.cleaningAreas)
            : template.cleaningAreas;

          for (const hour of cleaningHours) {
            const [startHour, startMinute] = hour.split(':').map(Number);
            const endHour = startHour + template.duration;
            const endTime = `${String(endHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;

            const payload: any = {
              startTime: hour,
              endTime: endTime,
              cleaningAreas: cleaningAreas,
              products: products,
              logDate: todayStr,
            };

            if (template.establishmentId) {
              payload.establishmentId = template.establishmentId;
            }

            if (template.employeeId) {
              payload.employeeId = template.employeeId;
            }

            try {
              const createRes = await fetch('/api/cleaning-logs', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
              });

              if (createRes.ok) {
                successCount++;
              }
            } catch (error) {
              console.error('Error creating log from template:', error);
            }
          }
        }

        if (successCount > 0) {
          toast.success(`Автоматично генерирани ${successCount} записа за днес!`);
          // Wait for data to refresh before completing
          await Promise.all([fetchLogs(), fetchLast5Days()]);
        }
      }
    } catch (error) {
      console.error('Error auto-generating logs:', error);
    } finally {
      setAutoGenerating(false);
    }
  };

  const handleAreaToggle = (area: string) => {
    setFormData(prev => ({
      ...prev,
      cleaningAreas: prev.cleaningAreas.includes(area)
        ? prev.cleaningAreas.filter(a => a !== area)
        : [...prev.cleaningAreas, area]
    }));
  };

  const handleProductToggle = (product: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.includes(product)
        ? prev.products.filter(p => p !== product)
        : [...prev.products, product]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.cleaningAreas.length === 0) {
      toast.error('Моля, изберете поне едно място за почистване');
      return;
    }

    if (formData.products.length === 0) {
      toast.error('Моля, изберете поне един препарат');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.error('Крайният час трябва да е след началния час');
      return;
    }

    setLoading(true);

    try {
      const token = getAuthToken();
      const payload: any = {
        startTime: formData.startTime,
        endTime: formData.endTime,
        cleaningAreas: formData.cleaningAreas,
        products: formData.products,
        logDate: formData.logDate,
      };

      if (selectedEstablishment) {
        payload.establishmentId = parseInt(selectedEstablishment);
      }

      if (formData.employeeId && formData.employeeId !== 'none') {
        payload.employeeId = parseInt(formData.employeeId);
      }

      if (formData.notes.trim()) {
        payload.notes = formData.notes.trim();
      }

      const res = await fetch('/api/cleaning-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Грешка при създаване на запис');
      }

      toast.success('Записът е създаден успешно!');
      setDialogOpen(false);
      resetForm();
      // Update both logs and last 5 days after manual entry
      await Promise.all([fetchLogs(), fetchLast5Days()]);
    } catch (error: any) {
      toast.error(error.message || 'Грешка при създаване на запис');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!logToDelete) return;

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/cleaning-logs/${logToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Грешка при изтриване на запис');
      }

      toast.success('Записът е изтрит успешно!');
      fetchLogs();
    } catch (error: any) {
      toast.error(error.message || 'Грешка при изтриване на запис');
    } finally {
      setDeleteDialogOpen(false);
      setLogToDelete(null);
    }
  };

  const openDeleteDialog = (logId: number) => {
    setLogToDelete(logId);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      startTime: '08:00',
      endTime: '09:00',
      cleaningAreas: [],
      products: [],
      employeeId: 'none',
      notes: '',
      logDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleExportImage = async (format: 'png' | 'jpeg' = 'png') => {
    if (logs.length === 0) {
      toast.error('Няма данни за експорт');
      return;
    }

    try {
      // Get date range from logs
      const dates = logs.map(log => log.logDate).sort();
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];
      
      const establishment = establishments.find(e => e.id === parseInt(selectedEstablishment));
      
      toast.info(`Генериране на ${format.toUpperCase()}...`);
      
      await exportCleaningLogsToImage(
        logs,
        startDate,
        endDate,
        establishment?.companyName,
        format
      );
      
      toast.success(`${format.toUpperCase()} документът е изтеглен успешно!`);
    } catch (error) {
      console.error('Error exporting image:', error);
      toast.error('Грешка при генериране: ' + (error as Error).message);
    }
  };

  if (loadingData) {
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

  const today = new Date();
  const last5DaysArray = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <ClipboardList className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Дневник почистване</h1>
              <p className="text-gray-600">Преглед и управление на записите за почистване</p>
            </div>
          </div>

          {/* Last 5 Days Summary */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <CardTitle>Преглед за последните 5 дни</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {last5DaysArray.map((dateStr) => {
                  const logsForDay = last5DaysLogs[dateStr] || [];
                  const date = new Date(dateStr);
                  const dayNames = ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'];
                  const dayName = dayNames[date.getDay()];
                  const formattedDate = date.toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' });
                  
                  // Skip days with no logs
                  if (logsForDay.length === 0) return null;
                  
                  return (
                    <div key={dateStr} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-gray-900">{dayName}</span>
                          <span className="text-gray-600 ml-2">{formattedDate}</span>
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          {logsForDay.length} {logsForDay.length === 1 ? 'запис' : 'записа'}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium text-gray-600">Час</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-600">Места</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-600">Препарати</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-600">Служител</th>
                            </tr>
                          </thead>
                          <tbody>
                            {logsForDay.map((log) => (
                              <tr key={log.id} className="border-b last:border-b-0 hover:bg-gray-50">
                                <td className="px-4 py-2 whitespace-nowrap">
                                  {log.startTime} - {log.endTime}
                                </td>
                                <td className="px-4 py-2">
                                  <div className="max-w-xs truncate">
                                    {Array.isArray(log.cleaningAreas) 
                                      ? log.cleaningAreas.join(', ')
                                      : typeof log.cleaningAreas === 'string'
                                      ? JSON.parse(log.cleaningAreas).join(', ')
                                      : ''}
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  {Array.isArray(log.products)
                                    ? log.products.join(', ')
                                    : typeof log.products === 'string'
                                    ? JSON.parse(log.products).join(', ')
                                    : ''}
                                </td>
                                <td className="px-4 py-2">{log.employeeName || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle>Всички записи за почистване</CardTitle>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  {establishments.length > 0 && (
                    <Select
                      value={selectedEstablishment}
                      onValueChange={setSelectedEstablishment}
                    >
                      <SelectTrigger className="w-full sm:w-[250px]">
                        <SelectValue placeholder="Изберете обект" />
                      </SelectTrigger>
                      <SelectContent>
                        {establishments.map((est) => (
                          <SelectItem key={est.id} value={est.id.toString()}>
                            {est.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button onClick={() => handleExportImage('png')} variant="default" disabled={logs.length === 0}>
                    <FileImage className="h-4 w-4 mr-2" />
                    PNG
                  </Button>
                  <Button onClick={() => handleExportImage('jpeg')} variant="default" disabled={logs.length === 0}>
                    <FileImage className="h-4 w-4 mr-2" />
                    JPEG
                  </Button>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Добави ръчно запис
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Добави запис за почистване</DialogTitle>
                        <DialogDescription>
                          Попълнете информацията за новия запис в дневника за почистване
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="logDate">Дата *</Label>
                            <Input
                              id="logDate"
                              type="date"
                              value={formData.logDate}
                              onChange={(e) => setFormData(prev => ({ ...prev, logDate: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="employee">Служител</Label>
                            <Select
                              value={formData.employeeId}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Изберете служител" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Няма избран</SelectItem>
                                {personnel
                                  .filter(p => !selectedEstablishment || p.establishmentId === parseInt(selectedEstablishment))
                                  .map((emp) => (
                                    <SelectItem key={emp.id} value={emp.id.toString()}>
                                      {emp.fullName}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="startTime">Начален час *</Label>
                            <Input
                              id="startTime"
                              type="time"
                              value={formData.startTime}
                              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="endTime">Краен час *</Label>
                            <Input
                              id="endTime"
                              type="time"
                              value={formData.endTime}
                              onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label>Почиствани обекти *</Label>
                          <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border rounded-md p-3">
                            {CLEANING_AREAS.map((area) => (
                              <div key={area} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`dialog-area-${area}`}
                                  checked={formData.cleaningAreas.includes(area)}
                                  onCheckedChange={() => handleAreaToggle(area)}
                                />
                                <Label htmlFor={`dialog-area-${area}`} className="cursor-pointer font-normal text-sm">
                                  {area}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label>Препарати *</Label>
                          <div className="grid grid-cols-2 gap-3">
                            {PRODUCTS.map((product) => (
                              <div key={product} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`dialog-product-${product}`}
                                  checked={formData.products.includes(product)}
                                  onCheckedChange={() => handleProductToggle(product)}
                                />
                                <Label htmlFor={`dialog-product-${product}`} className="cursor-pointer font-normal">
                                  {product}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes">Бележки</Label>
                          <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Допълнителни бележки..."
                            rows={3}
                          />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setDialogOpen(false);
                              resetForm();
                            }}
                            disabled={loading}
                          >
                            Отказ
                          </Button>
                          <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={loading}
                          >
                            {loading ? 'Запазване...' : 'Запази'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Няма записи за почистване</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Добавете нов запис, за да започнете
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дата</TableHead>
                        <TableHead>Начален час</TableHead>
                        <TableHead>Краен час</TableHead>
                        <TableHead>Почиствани обекти</TableHead>
                        <TableHead>Препарати</TableHead>
                        <TableHead>Служител</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {new Date(log.logDate).toLocaleDateString('bg-BG')}
                          </TableCell>
                          <TableCell>{log.startTime}</TableCell>
                          <TableCell>{log.endTime}</TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              {Array.isArray(log.cleaningAreas) 
                                ? log.cleaningAreas.join(', ')
                                : typeof log.cleaningAreas === 'string'
                                ? JSON.parse(log.cleaningAreas).join(', ')
                                : ''}
                            </div>
                          </TableCell>
                          <TableCell>
                            {Array.isArray(log.products)
                              ? log.products.join(', ')
                              : typeof log.products === 'string'
                              ? JSON.parse(log.products).join(', ')
                              : ''}
                          </TableCell>
                          <TableCell>{log.employeeName || '-'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDeleteDialog(log.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сигурни ли сте?</AlertDialogTitle>
            <AlertDialogDescription>
              Това действие не може да бъде отменено. Записът за почистване ще бъде изтрит завинаги.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}