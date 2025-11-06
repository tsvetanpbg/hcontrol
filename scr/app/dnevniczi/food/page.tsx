"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAuthToken, isAuthenticated } from '@/lib/auth';
import { Calendar, UtensilsCrossed, RefreshCw, Pencil, Save, X, Thermometer, Clock, FileImage } from 'lucide-react';
import { toast } from 'sonner';
import { exportFoodDiaryToImage } from '@/lib/image-export-utils';

interface FoodDiaryEntry {
  id: number;
  userId: number;
  foodItemId: number;
  foodItemName: string;
  date: string;
  time: string;
  quantity: string | null;
  temperature: number | null;
  shelfLifeHours: number;
  notes: string | null;
  establishmentId: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function FoodDiaryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [entries, setEntries] = useState<FoodDiaryEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ quantity: '', notes: '' });
  const [establishment, setEstablishment] = useState<any>(null);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchEntries();
    fetchEstablishment();
  }, [router]);

  const fetchEstablishment = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch('/api/establishments/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setEstablishment(data.establishments?.[0] || null);
      }
    } catch (error) {
      console.error('Error fetching establishment:', error);
    }
  };

  const fetchEntries = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const params = new URLSearchParams({
        limit: '500',
        startDate,
        endDate,
      });

      const res = await fetch(`/api/food-diary?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      } else {
        toast.error('Грешка при зареждане на дневника');
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast.error('Грешка при зареждане на данни');
    } finally {
      setLoadingData(false);
    }
  };

  const handleExportImage = async (format: 'png' | 'jpeg' = 'png') => {
    if (entries.length === 0) {
      toast.error('Няма данни за експорт');
      return;
    }

    try {
      toast.info(`Генериране на ${format.toUpperCase()}...`);
      
      await exportFoodDiaryToImage(
        entries,
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

  const handleGenerateEntries = async () => {
    if (!confirm('Това ще генерира записи за последните 20 дни + днес за всички храни в справочника. Продължаване?')) {
      return;
    }

    setGenerating(true);
    const token = getAuthToken();

    try {
      const res = await fetch('/api/food-diary/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ daysToGenerate: 20 })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Грешка при генериране');
      }

      const result = await res.json();
      toast.success(`Генерирани ${result.entriesGenerated} записа за ${result.daysCovered} дни!`);
      await fetchEntries();
    } catch (error: any) {
      toast.error(error.message || 'Грешка при генериране на записи');
    } finally {
      setGenerating(false);
    }
  };

  const handleEdit = (entry: FoodDiaryEntry) => {
    setEditingId(entry.id);
    setEditForm({
      quantity: entry.quantity || '',
      notes: entry.notes || ''
    });
  };

  const handleSaveEdit = async (id: number) => {
    setLoading(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`/api/food-diary/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Грешка при запазване');
      }

      toast.success('Записът е актуализиран успешно!');
      setEditingId(null);
      await fetchEntries();
    } catch (error: any) {
      toast.error(error.message || 'Грешка при запазване');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ quantity: '', notes: '' });
  };

  const handleApplyFilters = () => {
    setLoadingData(true);
    fetchEntries();
  };

  // Group entries by date
  const groupedEntries = entries.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = [];
    }
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, FoodDiaryEntry[]>);

  const sortedDates = Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Дневник Храни</h1>
                <p className="text-gray-600">Автоматично генерирани записи за храни</p>
              </div>
            </div>
            <Button
              onClick={handleGenerateEntries}
              disabled={generating}
              className="bg-green-600 hover:bg-green-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Генериране...' : 'Генерирай записи'}
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Филтри</CardTitle>
              <CardDescription>Изберете период за преглед на записите</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                <div className="flex items-end">
                  <Button onClick={handleApplyFilters} className="w-full">
                    Приложи филтри
                  </Button>
                </div>
                <div className="flex items-end">
                  <Button onClick={() => handleExportImage('png')} variant="default" className="w-full" disabled={entries.length === 0}>
                    <FileImage className="w-4 h-4 mr-2" />
                    PNG
                  </Button>
                </div>
                <div className="flex items-end">
                  <Button onClick={() => handleExportImage('jpeg')} variant="default" className="w-full" disabled={entries.length === 0}>
                    <FileImage className="w-4 h-4 mr-2" />
                    JPEG
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Entries by Date */}
          {sortedDates.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <UtensilsCrossed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">Няма записи за избрания период</p>
                  <p className="text-gray-400 text-sm mb-6">
                    Първо добавете храни в справочника, след което натиснете "Генерирай записи"
                  </p>
                  <Button
                    onClick={() => router.push('/spravochnici/food')}
                    variant="outline"
                  >
                    Отиди към справочник храна
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((date) => {
                const dateEntries = groupedEntries[date];
                const dateObj = new Date(date + 'T00:00:00');
                const formattedDate = dateObj.toLocaleDateString('bg-BG', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });

                return (
                  <Card key={date}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        {formattedDate}
                      </CardTitle>
                      <CardDescription>
                        {dateEntries.length} записа за този ден
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Час</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Храна</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Количество</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Температура</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Срок на годност</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Бележки</th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Действия</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {dateEntries
                              .sort((a, b) => a.time.localeCompare(b.time))
                              .map((entry) => {
                                const isEditing = editingId === entry.id;
                                
                                return (
                                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                      {entry.time}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-900">
                                      {entry.foodItemName}
                                    </td>
                                    <td className="px-4 py-4 text-sm">
                                      {isEditing ? (
                                        <Input
                                          value={editForm.quantity}
                                          onChange={(e) => setEditForm(prev => ({ ...prev, quantity: e.target.value }))}
                                          placeholder="Въведете количество"
                                          className="w-32"
                                        />
                                      ) : (
                                        <span className="text-gray-700">{entry.quantity || '-'}</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 text-sm">
                                      {entry.temperature ? (
                                        <span className="inline-flex items-center text-gray-700">
                                          <Thermometer className="h-4 w-4 mr-1 text-orange-500" />
                                          {entry.temperature}°C
                                        </span>
                                      ) : (
                                        <span className="text-gray-400">Студено</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 text-sm">
                                      <span className="inline-flex items-center text-gray-700">
                                        <Clock className="h-4 w-4 mr-1 text-blue-500" />
                                        {entry.shelfLifeHours}ч
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm">
                                      {isEditing ? (
                                        <Input
                                          value={editForm.notes}
                                          onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                          placeholder="Бележки"
                                          className="w-48"
                                        />
                                      ) : (
                                        <span className="text-gray-700">{entry.notes || '-'}</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                      {isEditing ? (
                                        <div className="flex gap-2 justify-end">
                                          <Button
                                            size="sm"
                                            onClick={() => handleSaveEdit(entry.id)}
                                            disabled={loading}
                                            className="bg-green-600 hover:bg-green-700"
                                          >
                                            <Save className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleCancelEdit}
                                            disabled={loading}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleEdit(entry)}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}