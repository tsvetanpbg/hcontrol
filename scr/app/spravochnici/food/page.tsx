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
import { UtensilsCrossed, Plus, Pencil, Trash2, Thermometer, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface FoodItem {
  id: number;
  name: string;
  cookingTemperature: number | null;
  shelfLifeHours: number;
  establishmentId: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function FoodReferencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    cookingTemperature: '',
    shelfLifeHours: '',
    establishmentId: 'none',
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const [foodRes, estRes] = await Promise.all([
        fetch('/api/food-items?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/establishments/user', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (foodRes.ok) {
        const foodData = await foodRes.json();
        setFoodItems(foodData.items || []);
      }

      if (estRes.ok) {
        const estData = await estRes.json();
        setEstablishments(estData.establishments || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Грешка при зареждане на данни');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Моля, въведете име на храна');
      return;
    }

    if (!formData.shelfLifeHours || parseInt(formData.shelfLifeHours) <= 0) {
      toast.error('Моля, въведете валиден срок на годност');
      return;
    }

    setLoading(true);

    try {
      const token = getAuthToken();
      
      const payload: any = {
        name: formData.name.trim(),
        shelfLifeHours: parseInt(formData.shelfLifeHours),
      };

      if (formData.cookingTemperature && formData.cookingTemperature.trim() !== '') {
        payload.cookingTemperature = parseInt(formData.cookingTemperature);
      }

      if (formData.establishmentId && formData.establishmentId !== 'none') {
        payload.establishmentId = parseInt(formData.establishmentId);
      }

      let res;
      if (editingItemId) {
        res = await fetch(`/api/food-items/${editingItemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/food-items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Грешка при запазване');
      }

      toast.success(editingItemId ? 'Храната е актуализирана успешно!' : 'Храната е добавена успешно!');
      handleReset();
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Грешка при запазване');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      cookingTemperature: '',
      shelfLifeHours: '',
      establishmentId: 'none',
    });
    setEditingItemId(null);
  };

  const handleEdit = (item: FoodItem) => {
    setEditingItemId(item.id);
    setFormData({
      name: item.name,
      cookingTemperature: item.cookingTemperature?.toString() || '',
      shelfLifeHours: item.shelfLifeHours.toString(),
      establishmentId: item.establishmentId?.toString() || 'none',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете тази храна?')) {
      return;
    }

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/food-items/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Грешка при изтриване');
      }

      toast.success('Храната е изтрита успешно!');
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Грешка при изтриване');
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <UtensilsCrossed className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Справочник Храна</h1>
                <p className="text-gray-600">Управление на храни с температура и срок на годност</p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingItemId ? 'Редактиране на храна' : 'Добави нова храна'}
              </CardTitle>
              <CardDescription>
                {editingItemId 
                  ? 'Променете данните и натиснете "Запази промените"'
                  : 'Въведете данни за новата храна'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Име на храна *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Напр. Готвени ястия, Супи, Салати..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cookingTemperature">
                      <Thermometer className="inline h-4 w-4 mr-1" />
                      Температура при готвене (°C)
                    </Label>
                    <Input
                      id="cookingTemperature"
                      type="number"
                      value={formData.cookingTemperature}
                      onChange={(e) => setFormData(prev => ({ ...prev, cookingTemperature: e.target.value }))}
                      placeholder="Напр. 100, 200 (оставете празно за студени храни)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shelfLifeHours">
                      <Clock className="inline h-4 w-4 mr-1" />
                      Срок на годност (часове) *
                    </Label>
                    <Input
                      id="shelfLifeHours"
                      type="number"
                      min="1"
                      value={formData.shelfLifeHours}
                      onChange={(e) => setFormData(prev => ({ ...prev, shelfLifeHours: e.target.value }))}
                      placeholder="Напр. 3, 24"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="establishment">Заведение (опционално)</Label>
                    <Select
                      value={formData.establishmentId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, establishmentId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Изберете заведение" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Няма избрано</SelectItem>
                        {establishments.map((est) => (
                          <SelectItem key={est.id} value={est.id.toString()}>
                            {est.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading 
                      ? (editingItemId ? 'Запазване...' : 'Добавяне...')
                      : (editingItemId ? 'Запази промените' : 'Добави храна')
                    }
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    {editingItemId ? 'Откажи редакцията' : 'Изчисти'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Назад
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Food Items List */}
          <Card>
            <CardHeader>
              <CardTitle>Регистрирани храни ({foodItems.length})</CardTitle>
              <CardDescription>
                Списък с всички храни в справочника
              </CardDescription>
            </CardHeader>
            <CardContent>
              {foodItems.length === 0 ? (
                <div className="text-center py-12">
                  <UtensilsCrossed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">Все още няма добавени храни</p>
                  <p className="text-gray-400 text-sm">Използвайте формата по-горе за добавяне на първата храна</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Храна</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Темп. при готвене</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Срок на годност</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {foodItems.map((item, index) => {
                        const establishment = establishments.find(e => e.id === item.establishmentId);
                        
                        return (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 text-sm text-gray-900">{index + 1}</td>
                            <td className="px-4 py-4">
                              <div>
                                <div className="font-medium text-gray-900">{item.name}</div>
                                {establishment && (
                                  <div className="text-xs text-gray-500">{establishment.companyName}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {item.cookingTemperature ? (
                                <span className="inline-flex items-center text-sm text-gray-700">
                                  <Thermometer className="h-4 w-4 mr-1 text-orange-500" />
                                  {item.cookingTemperature}°C
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">Студено</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center text-sm text-gray-700">
                                <Clock className="h-4 w-4 mr-1 text-blue-500" />
                                {item.shelfLifeHours} часа
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(item)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
