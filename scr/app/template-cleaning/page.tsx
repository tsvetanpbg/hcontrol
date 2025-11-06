"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAuthToken, isAuthenticated } from '@/lib/auth';
import { ClipboardCheck, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Понеделник' },
  { id: 'tuesday', label: 'Вторник' },
  { id: 'wednesday', label: 'Сряда' },
  { id: 'thursday', label: 'Четвъртък' },
  { id: 'friday', label: 'Петък' },
  { id: 'saturday', label: 'Събота' },
  { id: 'sunday', label: 'Неделя' },
];

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

export default function TemplateCleaningPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    daysOfWeek: [] as string[],
    cleaningHours: ['08:00'] as string[],
    duration: 1,
    products: [] as string[],
    cleaningAreas: [] as string[],
    establishmentId: 'none',
    employeeId: 'none',
  });

  // Safe JSON parsing helper
  const safeParse = (value: any, fallback: any = []) => {
    if (!value) return fallback;
    if (Array.isArray(value)) return value;
    
    try {
      // Try parsing as JSON first
      if (typeof value === 'string' && value.startsWith('[')) {
        return JSON.parse(value);
      }
      // If it's a comma-separated string
      if (typeof value === 'string' && value.includes(',')) {
        return value.split(',').map(s => s.trim());
      }
      // Single value string
      if (typeof value === 'string') {
        return [value];
      }
      return fallback;
    } catch (error) {
      console.error('Parse error:', error, 'Value:', value);
      return fallback;
    }
  };

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
      const [estRes, persRes, templatesRes] = await Promise.all([
        fetch('/api/establishments/user', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/personnel', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/cleaning-templates', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (estRes.ok) {
        const estData = await estRes.json();
        setEstablishments(estData.establishments || []);
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

  const handleDayToggle = (dayId: string) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(dayId)
        ? prev.daysOfWeek.filter(d => d !== dayId)
        : [...prev.daysOfWeek, dayId]
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

  const handleAreaToggle = (area: string) => {
    setFormData(prev => ({
      ...prev,
      cleaningAreas: prev.cleaningAreas.includes(area)
        ? prev.cleaningAreas.filter(a => a !== area)
        : [...prev.cleaningAreas, area]
    }));
  };

  const addHour = () => {
    setFormData(prev => ({
      ...prev,
      cleaningHours: [...prev.cleaningHours, '08:00']
    }));
  };

  const removeHour = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cleaningHours: prev.cleaningHours.filter((_, i) => i !== index)
    }));
  };

  const updateHour = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      cleaningHours: prev.cleaningHours.map((h, i) => i === index ? value : h)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Моля, въведете име на шаблон');
      return;
    }

    if (formData.daysOfWeek.length === 0) {
      toast.error('Моля, изберете поне един ден');
      return;
    }

    if (formData.cleaningHours.length === 0) {
      toast.error('Моля, добавете поне един час');
      return;
    }

    if (formData.products.length === 0) {
      toast.error('Моля, изберете поне един препарат');
      return;
    }

    if (formData.cleaningAreas.length === 0) {
      toast.error('Моля, изберете поне едно място за почистване');
      return;
    }

    setLoading(true);

    try {
      const token = getAuthToken();
      
      // Convert lowercase day names to capitalized format for API
      const capitalizedDays = formData.daysOfWeek.map(day => 
        day.charAt(0).toUpperCase() + day.slice(1)
      );
      
      const payload: any = {
        name: formData.name.trim(),
        daysOfWeek: capitalizedDays,
        cleaningHours: formData.cleaningHours,
        duration: formData.duration,
        products: formData.products,
        cleaningAreas: formData.cleaningAreas,
      };

      if (formData.establishmentId && formData.establishmentId !== 'none') {
        payload.establishmentId = parseInt(formData.establishmentId);
      }

      if (formData.employeeId && formData.employeeId !== 'none') {
        payload.employeeId = parseInt(formData.employeeId);
      }

      let res;
      if (editingTemplateId) {
        // Update existing template
        res = await fetch(`/api/cleaning-templates/${editingTemplateId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new template
        res = await fetch('/api/cleaning-templates', {
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
        throw new Error(error.error || 'Грешка при запазване на шаблон');
      }

      toast.success(editingTemplateId ? 'Шаблонът е актуализиран успешно!' : 'Шаблонът е създаден успешно!');
      handleReset();
      await fetchData(); // Reload templates
    } catch (error: any) {
      toast.error(error.message || 'Грешка при запазване на шаблон');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      daysOfWeek: [],
      cleaningHours: ['08:00'],
      duration: 1,
      products: [],
      cleaningAreas: [],
      establishmentId: 'none',
      employeeId: 'none',
    });
    setEditingTemplateId(null);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplateId(template.id);
    setFormData({
      name: template.name,
      daysOfWeek: safeParse(template.daysOfWeek, []).map((day: string) => day.toLowerCase()),
      cleaningHours: safeParse(template.cleaningHours, ['08:00']),
      duration: template.duration,
      products: safeParse(template.products, []),
      cleaningAreas: safeParse(template.cleaningAreas, []),
      establishmentId: template.establishmentId?.toString() || 'none',
      employeeId: template.employeeId?.toString() || 'none',
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете този шаблон?')) {
      return;
    }

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/cleaning-templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Грешка при изтриване');
      }

      toast.success('Шаблонът е изтрит успешно!');
      await fetchData(); // Reload templates
    } catch (error: any) {
      toast.error(error.message || 'Грешка при изтриване на шаблон');
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
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <ClipboardCheck className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Шаблон почистване</h1>
              <p className="text-gray-600">Създайте шаблон за почистване на вашето заведение</p>
            </div>
          </div>

          {/* Existing Templates List */}
          {templates.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Съществуващи шаблони</CardTitle>
                <CardDescription>
                  Вашите запазени шаблони за почистване
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {templates.map((template) => {
                    const establishment = establishments.find(e => e.id === template.establishmentId);
                    const employee = personnel.find(p => p.id === template.employeeId);
                    const daysOfWeek = safeParse(template.daysOfWeek, []);
                    const hours = safeParse(template.cleaningHours, []);
                    
                    return (
                      <div key={template.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                              {establishment && (
                                <div>
                                  <span className="font-medium">Заведение:</span> {establishment.companyName}
                                </div>
                              )}
                              {employee && (
                                <div>
                                  <span className="font-medium">Служител:</span> {employee.fullName}
                                </div>
                              )}
                              <div>
                                <span className="font-medium">Дни:</span> {daysOfWeek.length} избрани
                              </div>
                              <div>
                                <span className="font-medium">Часове:</span> {hours.join(', ')}
                              </div>
                              <div>
                                <span className="font-medium">Продължителност:</span> {template.duration}ч
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                {editingTemplateId ? 'Редактиране на шаблон' : 'Нов шаблон за почистване'}
              </CardTitle>
              <CardDescription>
                {editingTemplateId 
                  ? 'Променете данните и натиснете "Запази промените"'
                  : 'След запазване, шаблонът може да се използва за генериране на записи в дневника за почистване'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Template Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Име на шаблон *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Напр. Ежедневно почистване"
                    required
                  />
                </div>

                {/* Establishment */}
                <div className="space-y-2">
                  <Label htmlFor="establishment">Заведение (опционално)</Label>
                  <Select
                    value={formData.establishmentId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, establishmentId: value, employeeId: 'none' }))}
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

                {/* Days of Week */}
                <div className="space-y-3">
                  <Label>Избор на дни от седмицата *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={day.id}
                          checked={formData.daysOfWeek.includes(day.id)}
                          onCheckedChange={() => handleDayToggle(day.id)}
                        />
                        <Label htmlFor={day.id} className="cursor-pointer font-normal">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cleaning Hours */}
                <div className="space-y-3">
                  <Label>Часове за почистване *</Label>
                  {formData.cleaningHours.map((hour, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={hour}
                        onChange={(e) => updateHour(index, e.target.value)}
                        className="flex-1"
                      />
                      {formData.cleaningHours.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeHour(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addHour}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Добави час
                  </Button>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration">Продължителност (часове) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                    required
                  />
                </div>

                {/* Products */}
                <div className="space-y-3">
                  <Label>Препарати *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {PRODUCTS.map((product) => (
                      <div key={product} className="flex items-center space-x-2">
                        <Checkbox
                          id={`product-${product}`}
                          checked={formData.products.includes(product)}
                          onCheckedChange={() => handleProductToggle(product)}
                        />
                        <Label htmlFor={`product-${product}`} className="cursor-pointer font-normal">
                          {product}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cleaning Areas */}
                <div className="space-y-3">
                  <Label>Места, които се почистват *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {CLEANING_AREAS.map((area) => (
                      <div key={area} className="flex items-center space-x-2">
                        <Checkbox
                          id={`area-${area}`}
                          checked={formData.cleaningAreas.includes(area)}
                          onCheckedChange={() => handleAreaToggle(area)}
                        />
                        <Label htmlFor={`area-${area}`} className="cursor-pointer font-normal">
                          {area}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Employee */}
                <div className="space-y-2">
                  <Label htmlFor="employee">Служител, който ще почиства (опционално)</Label>
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
                        .filter(p => formData.establishmentId === 'none' || p.establishmentId === parseInt(formData.establishmentId))
                        .map((emp) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.fullName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading 
                      ? (editingTemplateId ? 'Запазване...' : 'Създаване...')
                      : (editingTemplateId ? 'Запази промените' : 'Създай шаблон')
                    }
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    {editingTemplateId ? 'Откажи редакцията' : 'Изчисти'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Върни се назад
                  </Button>
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