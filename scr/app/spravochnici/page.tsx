"use client"

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Save, X, CheckCircle2, XCircle, Upload, UtensilsCrossed, Building2, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import Image from 'next/image';

const ESTABLISHMENT_TYPES = [
  "Ресторант",
  "Бирария",
  "Механа",
  "Кафе-аператив",
  "Закусвалня",
  "Фаст-Фууд",
  "Павилион ТХ",
  "Павилион",
  "Пекарна",
  "Баничарница",
  "Стол",
  "Бюфет",
  "Бар",
  "Бийч-бар",
  "Пуул-бар",
  "Кафене",
  "Пицария",
  "Магазин",
  "Магазин за месо",
  "Магазин за риба",
  "Магазин за пак. стоки",
  "Кулинарен магазин",
  "Супермаркет",
  "Дискотека",
  "Нощен-бар",
  "Цех за производство",
  "Снек-бар",
  "Кухня-майка",
  "Гостилница",
  "Коктейл-бар",
  "Склад за хр. продукти",
  "Каравана",
  "Винарна",
  "Пивница",
  "Кафетерия",
  "Кафе-сладкарница",
  "Сладкарница",
  "Сладоледен салон",
  "Чайна",
  "Пиано-бар",
  "Магазин за зеленчуци",
  "Казино",
  "Разливочна",
  "Детска млечна кухня",
  "Друг вид обект"
];

const MAX_ESTABLISHMENTS = 10;

interface Establishment {
  id: number;
  establishmentType: string;
  employeeCount: number;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  companyName: string;
  eik: string;
  eikVerified: number;
  eikVerificationDate: string | null;
  registrationAddress: string;
  contactEmail: string;
  vatRegistered: number;
  vatNumber: string | null;
}

interface Personnel {
  id: number;
  establishmentId: number;
  fullName: string;
  egn: string;
  position: string;
  healthBookImageUrl: string | null;
  photoUrl: string | null;
  healthBookNumber: string;
  healthBookValidity: string;
}

export default function SpravochniciPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showPersonnelDialog, setShowPersonnelDialog] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);
  const [activeTab, setActiveTab] = useState<string>('establishments');
  const [validatingEik, setValidatingEik] = useState(false);
  const [eikValidationResult, setEikValidationResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Form state for establishment
  const [formData, setFormData] = useState({
    establishmentType: '',
    employeeCount: '',
    managerName: '',
    managerPhone: '',
    managerEmail: '',
    companyName: '',
    eik: '',
    registrationAddress: '',
    contactEmail: '',
    vatRegistered: false,
    vatNumber: '',
  });

  // Form state for personnel
  const [personnelForm, setPersonnelForm] = useState({
    fullName: '',
    egn: '',
    position: '',
    healthBookImageUrl: '',
    photoUrl: '',
    healthBookNumber: '',
    healthBookValidity: '',
  });

  useEffect(() => {
    loadData();
    
    // Check for tab parameter
    const tabParam = searchParams.get('tab');
    if (tabParam === 'personnel' || tabParam === 'establishments') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch ALL establishments using new endpoint
      const response = await fetch('/api/establishments/user-all', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const establishmentsList = data.establishments || [];
        
        setEstablishments(establishmentsList);
        
        if (establishmentsList.length === 0) {
          // No establishment yet - show create form
          setSelectedEstablishment(null);
          setIsCreating(true);
        } else {
          // Select first establishment by default
          const firstEstablishment = establishmentsList[0];
          setSelectedEstablishment(firstEstablishment);
          setFormData({
            establishmentType: firstEstablishment.establishmentType,
            employeeCount: firstEstablishment.employeeCount.toString(),
            managerName: firstEstablishment.managerName,
            managerPhone: firstEstablishment.managerPhone,
            managerEmail: firstEstablishment.managerEmail,
            companyName: firstEstablishment.companyName,
            eik: firstEstablishment.eik,
            registrationAddress: firstEstablishment.registrationAddress,
            contactEmail: firstEstablishment.contactEmail,
            vatRegistered: firstEstablishment.vatRegistered === 1,
            vatNumber: firstEstablishment.vatNumber || '',
          });

          // Load personnel for first establishment
          await loadPersonnel(firstEstablishment.id);
        }
      } else {
        toast.error('Грешка при зареждане на данните');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Грешка при свързване със сървъра');
    } finally {
      setLoading(false);
    }
  };

  const loadPersonnel = async (establishmentId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/personnel/by-establishment/${establishmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPersonnel(data);
      }
    } catch (error) {
      console.error('Error loading personnel:', error);
    }
  };

  const handleSelectEstablishment = async (establishment: Establishment) => {
    setSelectedEstablishment(establishment);
    setIsEditing(false);
    setIsCreating(false);
    setFormData({
      establishmentType: establishment.establishmentType,
      employeeCount: establishment.employeeCount.toString(),
      managerName: establishment.managerName,
      managerPhone: establishment.managerPhone,
      managerEmail: establishment.managerEmail,
      companyName: establishment.companyName,
      eik: establishment.eik,
      registrationAddress: establishment.registrationAddress,
      contactEmail: establishment.contactEmail,
      vatRegistered: establishment.vatRegistered === 1,
      vatNumber: establishment.vatNumber || '',
    });
    await loadPersonnel(establishment.id);
  };

  const handleCreateNew = () => {
    if (establishments.length >= MAX_ESTABLISHMENTS) {
      toast.error(`Достигнат е лимитът от ${MAX_ESTABLISHMENTS} заведения`);
      return;
    }
    
    setSelectedEstablishment(null);
    setIsCreating(true);
    setIsEditing(false);
    setFormData({
      establishmentType: '',
      employeeCount: '',
      managerName: '',
      managerPhone: '',
      managerEmail: '',
      companyName: '',
      eik: '',
      registrationAddress: '',
      contactEmail: '',
      vatRegistered: false,
      vatNumber: '',
    });
    setEikValidationResult(null);
    setPersonnel([]);
  };

  const validateEIK = async (eik: string) => {
    if (!eik || eik.trim().length === 0) {
      setEikValidationResult(null);
      return;
    }

    setValidatingEik(true);
    setEikValidationResult(null);

    try {
      const response = await fetch('/api/establishments/validate-eik', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eik: eik.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setEikValidationResult({
          valid: data.valid,
          message: data.message,
        });
      } else {
        setEikValidationResult({
          valid: false,
          message: data.message || 'Грешка при валидация',
        });
      }
    } catch (error) {
      console.error('Error validating EIK:', error);
      setEikValidationResult({
        valid: false,
        message: 'Грешка при свързване със сървъра',
      });
    } finally {
      setValidatingEik(false);
    }
  };

  const handleEikChange = (value: string) => {
    setFormData({ ...formData, eik: value });
    // Auto-validate when length is 9 or 13
    if (value.length === 9 || value.length === 13) {
      validateEIK(value);
    } else {
      setEikValidationResult(null);
    }
  };

  const handleSaveEstablishment = async () => {
    // Validation
    if (!formData.establishmentType) {
      toast.error('Моля изберете вид на заведението');
      return;
    }

    if (!formData.employeeCount || parseInt(formData.employeeCount) <= 0) {
      toast.error('Моля въведете валиден брой служители');
      return;
    }

    if (!formData.managerName || !formData.managerPhone || !formData.managerEmail) {
      toast.error('Моля попълнете всички данни за управителя');
      return;
    }

    if (!formData.companyName || !formData.eik || !formData.registrationAddress || !formData.contactEmail) {
      toast.error('Моля попълнете всички данни за фирмата');
      return;
    }

    // Check EIK validation - skip if editing existing establishment and EIK hasn't changed
    const eikChanged = selectedEstablishment ? selectedEstablishment.eik !== formData.eik : true;
    if (eikChanged && (!eikValidationResult || !eikValidationResult.valid)) {
      toast.error('Моля въведете валиден ЕИК номер');
      return;
    }

    // Validate VAT number if VAT registered
    if (formData.vatRegistered && !formData.vatNumber.trim()) {
      toast.error('Моля въведете ДДС номер');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const payload = {
        ...formData,
        employeeCount: parseInt(formData.employeeCount),
      };

      let response;
      if (selectedEstablishment && !isCreating) {
        // Update existing
        response = await fetch(`/api/establishments/${selectedEstablishment.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new
        response = await fetch('/api/establishments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        const data = await response.json();
        setIsEditing(false);
        setIsCreating(false);
        toast.success(selectedEstablishment && !isCreating ? 'Данните са актуализирани' : 'Заведението е създадено');
        
        // Reload all establishments
        await loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Грешка при запазване');
      }
    } catch (error) {
      console.error('Error saving establishment:', error);
      toast.error('Грешка при свързване със сървъра');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEstablishment = async (id: number) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете това заведение? Всички свързани данни (персонал, устройства, дневници) също ще бъдат изтрити.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/establishments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Заведението е изтрито');
        await loadData();
      } else {
        toast.error('Грешка при изтриване');
      }
    } catch (error) {
      console.error('Error deleting establishment:', error);
      toast.error('Грешка при свързване със сървъра');
    }
  };

  const handleSavePersonnel = async () => {
    if (!personnelForm.fullName || !personnelForm.egn || !personnelForm.position) {
      toast.error('Моля попълнете всички задължителни полета');
      return;
    }

    if (!personnelForm.healthBookNumber) {
      toast.error('Моля въведете здравна книжка №');
      return;
    }

    if (!personnelForm.healthBookValidity) {
      toast.error('Моля въведете валидност на здравната книжка');
      return;
    }

    if (!selectedEstablishment) {
      toast.error('Моля първо създайте заведение');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const payload = {
        fullName: personnelForm.fullName,
        egn: personnelForm.egn,
        position: personnelForm.position,
        healthBookImageUrl: personnelForm.healthBookImageUrl || null,
        photoUrl: personnelForm.photoUrl || null,
        healthBookNumber: personnelForm.healthBookNumber,
        healthBookValidity: personnelForm.healthBookValidity,
      };

      let response;
      if (editingPersonnel) {
        response = await fetch(`/api/personnel/${editingPersonnel.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/personnel', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...payload,
            establishmentId: selectedEstablishment.id,
          }),
        });
      }

      if (response.ok) {
        await loadPersonnel(selectedEstablishment.id);
        setShowPersonnelDialog(false);
        setPersonnelForm({ fullName: '', egn: '', position: '', healthBookImageUrl: '', photoUrl: '', healthBookNumber: '', healthBookValidity: '' });
        setEditingPersonnel(null);
        toast.success(editingPersonnel ? 'Служителят е актуализиран' : 'Служителят е добавен');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Грешка при запазване');
      }
    } catch (error) {
      console.error('Error saving personnel:', error);
      toast.error('Грешка при свързване със сървъра');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Моля изберете JPEG, PNG или WebP файл');
      e.target.value = '';
      return;
    }

    // Validate file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Файлът е твърде голям. Максималният размер е 5MB');
      e.target.value = '';
      return;
    }

    try {
      setUploadingPhoto(true);
      
      // Convert to base64 Data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPersonnelForm({ ...personnelForm, photoUrl: base64String });
        toast.success('Снимката е качена успешно');
      };
      reader.onerror = () => {
        toast.error('Грешка при качване на снимката');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Грешка при качване на снимката');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePersonnel = async (id: number) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете този служител?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/personnel/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setPersonnel(personnel.filter(p => p.id !== id));
        toast.success('Служителят е изтрит');
      } else {
        toast.error('Грешка при изтриване');
      }
    } catch (error) {
      console.error('Error deleting personnel:', error);
      toast.error('Грешка при свързване със сървъра');
    }
  };

  const openEditPersonnel = (person: Personnel) => {
    setEditingPersonnel(person);
    setPersonnelForm({
      fullName: person.fullName,
      egn: person.egn,
      position: person.position,
      healthBookImageUrl: person.healthBookImageUrl || '',
      photoUrl: person.photoUrl || '',
      healthBookNumber: person.healthBookNumber,
      healthBookValidity: person.healthBookValidity,
    });
    setShowPersonnelDialog(true);
  };

  const openAddPersonnel = () => {
    setEditingPersonnel(null);
    setPersonnelForm({ fullName: '', egn: '', position: '', healthBookImageUrl: '', photoUrl: '', healthBookNumber: '', healthBookValidity: '' });
    setShowPersonnelDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Справочници</h1>
            <p className="text-gray-600 mt-2">
              Управление на данни за заведения и персонал
            </p>
          </div>

          {/* Establishments Count Alert */}
          {establishments.length > 0 && (
            <Alert className="mb-6">
              <Building2 className="h-4 w-4" />
              <AlertTitle>Заведения: {establishments.length} / {MAX_ESTABLISHMENTS}</AlertTitle>
              <AlertDescription>
                {establishments.length < MAX_ESTABLISHMENTS 
                  ? `Можете да добавите още ${MAX_ESTABLISHMENTS - establishments.length} заведения.`
                  : 'Достигнат е максималният лимит от заведения.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Establishments List */}
          {establishments.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Моите заведения</CardTitle>
                    <CardDescription>
                      Изберете заведение за преглед или редакция
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={handleCreateNew}
                    disabled={establishments.length >= MAX_ESTABLISHMENTS}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ново заведение
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {establishments.map((est) => (
                    <div
                      key={est.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                        selectedEstablishment?.id === est.id && !isCreating
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handleSelectEstablishment(est)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-lg truncate">{est.companyName}</div>
                          <div className="text-sm text-gray-600">{est.establishmentType}</div>
                          <div className="text-xs text-gray-500 mt-1">ЕИК: {est.eik}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEstablishment(est.id);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500">
                        Служители: {est.employeeCount}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setActiveTab('establishments')}
              className={`p-4 border-2 rounded-lg transition-all ${
                activeTab === 'establishments'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="font-semibold text-lg">Заведение</div>
              <div className="text-sm text-gray-600 mt-1">
                {isCreating ? 'Създаване на ново заведение' : 'Данни на заведението'}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('personnel')}
              disabled={!selectedEstablishment}
              className={`p-4 border-2 rounded-lg transition-all ${
                !selectedEstablishment
                  ? 'opacity-50 cursor-not-allowed border-gray-200'
                  : activeTab === 'personnel'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="font-semibold text-lg">Служители</div>
              <div className="text-sm text-gray-600 mt-1">Управление на персонал</div>
            </button>

            <button
              onClick={() => router.push('/spravochnici/food')}
              className="p-4 border-2 rounded-lg transition-all border-gray-200 hover:border-blue-300"
            >
              <div className="flex items-center gap-2 font-semibold text-lg">
                <UtensilsCrossed className="h-5 w-5 text-blue-600" />
                Храна
              </div>
              <div className="text-sm text-gray-600 mt-1">Справочник храни</div>
            </button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="establishments">
                {isCreating ? 'Ново заведение' : 'Данни на заведението'}
              </TabsTrigger>
              <TabsTrigger value="personnel" disabled={!selectedEstablishment && !isCreating}>
                Служители
              </TabsTrigger>
            </TabsList>

            <TabsContent value="establishments">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {isCreating ? 'Създаване на ново заведение' : 'Данни на заведението'}
                      </CardTitle>
                      <CardDescription>
                        {isCreating 
                          ? 'Попълнете информацията за новото заведение'
                          : selectedEstablishment 
                          ? 'Преглед и редакция на информацията'
                          : 'Изберете заведение от списъка горе'}
                      </CardDescription>
                    </div>
                    {selectedEstablishment && !isEditing && !isCreating && (
                      <Button onClick={() => setIsEditing(true)} variant="outline">
                        <Pencil className="w-4 h-4 mr-2" />
                        Редактирай
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Вид на заведение */}
                  <div className="space-y-2">
                    <Label htmlFor="establishmentType">Вид на заведение *</Label>
                    <Select
                      disabled={!isEditing && !isCreating}
                      value={formData.establishmentType}
                      onValueChange={(value) => setFormData({ ...formData, establishmentType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Изберете вид заведение" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTABLISHMENT_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Брой служители */}
                  <div className="space-y-2">
                    <Label htmlFor="employeeCount">Брой служители *</Label>
                    <Input
                      id="employeeCount"
                      type="number"
                      min="1"
                      disabled={!isEditing && !isCreating}
                      value={formData.employeeCount}
                      onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                      placeholder="Въведете брой служители"
                    />
                  </div>

                  {/* Управител */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Управител</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="managerName">Име и фамилия *</Label>
                        <Input
                          id="managerName"
                          disabled={!isEditing && !isCreating}
                          value={formData.managerName}
                          onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                          placeholder="Иван Иванов"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="managerPhone">Телефон *</Label>
                        <Input
                          id="managerPhone"
                          type="tel"
                          disabled={!isEditing && !isCreating}
                          value={formData.managerPhone}
                          onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                          placeholder="+359 888 123 456"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="managerEmail">Имейл *</Label>
                        <Input
                          id="managerEmail"
                          type="email"
                          disabled={!isEditing && !isCreating}
                          value={formData.managerEmail}
                          onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                          placeholder="ivan@example.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Данни за фирмата */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Данни за фирмата</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Име на фирмата *</Label>
                        <Input
                          id="companyName"
                          disabled={!isEditing && !isCreating}
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          placeholder="Име на фирмата ЕООД"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="eik">ЕИК *</Label>
                        <div className="relative">
                          <Input
                            id="eik"
                            disabled={!isEditing && !isCreating}
                            value={formData.eik}
                            onChange={(e) => handleEikChange(e.target.value)}
                            placeholder="123456789 или 1234567890123"
                          />
                          {validatingEik && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            </div>
                          )}
                          {!validatingEik && eikValidationResult && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {eikValidationResult.valid ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                            </div>
                          )}
                        </div>
                        {eikValidationResult && (
                          <p className={`text-sm ${eikValidationResult.valid ? 'text-green-600' : 'text-red-600'}`}>
                            {eikValidationResult.message}
                          </p>
                        )}
                        {selectedEstablishment?.eikVerified === 1 && (
                          <p className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            ЕИК верифициран
                          </p>
                        )}
                      </div>

                      {/* VAT Registration - Show only if EIK is valid */}
                      {eikValidationResult?.valid && (
                        <div className="md:col-span-2 space-y-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="vatRegistered"
                              checked={formData.vatRegistered}
                              onCheckedChange={(checked) => {
                                setFormData({ 
                                  ...formData, 
                                  vatRegistered: checked as boolean,
                                  vatNumber: checked ? formData.vatNumber : ''
                                });
                              }}
                              disabled={!isEditing && !isCreating}
                            />
                            <Label 
                              htmlFor="vatRegistered" 
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              Регистриран по ДДС
                            </Label>
                          </div>

                          {formData.vatRegistered && (
                            <div className="space-y-2 pl-6">
                              <Label htmlFor="vatNumber">ДДС номер *</Label>
                              <Input
                                id="vatNumber"
                                disabled={!isEditing && !isCreating}
                                value={formData.vatNumber}
                                onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                                placeholder="BG123456789"
                              />
                              <p className="text-xs text-gray-500">
                                Въведете ДДС номера на фирмата
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="registrationAddress">Адрес на регистрация *</Label>
                        <Input
                          id="registrationAddress"
                          disabled={!isEditing && !isCreating}
                          value={formData.registrationAddress}
                          onChange={(e) => setFormData({ ...formData, registrationAddress: e.target.value })}
                          placeholder="гр. София, ул. Примерна 1"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="contactEmail">Имейл за контакт *</Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          disabled={!isEditing && !isCreating}
                          value={formData.contactEmail}
                          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                          placeholder="contact@company.bg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  {(isEditing || isCreating) && (
                    <div className="flex gap-3 pt-4 border-t">
                      <Button onClick={handleSaveEstablishment} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Запазване...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Запази
                          </>
                        )}
                      </Button>
                      {(selectedEstablishment || establishments.length > 0) && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (isCreating && establishments.length > 0) {
                              // Cancel creating - go back to first establishment
                              handleSelectEstablishment(establishments[0]);
                            } else {
                              // Cancel editing
                              setIsEditing(false);
                              if (selectedEstablishment) {
                                setFormData({
                                  establishmentType: selectedEstablishment.establishmentType,
                                  employeeCount: selectedEstablishment.employeeCount.toString(),
                                  managerName: selectedEstablishment.managerName,
                                  managerPhone: selectedEstablishment.managerPhone,
                                  managerEmail: selectedEstablishment.managerEmail,
                                  companyName: selectedEstablishment.companyName,
                                  eik: selectedEstablishment.eik,
                                  registrationAddress: selectedEstablishment.registrationAddress,
                                  contactEmail: selectedEstablishment.contactEmail,
                                  vatRegistered: selectedEstablishment.vatRegistered === 1,
                                  vatNumber: selectedEstablishment.vatNumber || '',
                                });
                              }
                            }
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Откажи
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="personnel">
              {!selectedEstablishment ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="mb-4">Моля първо изберете заведение за да управлявате персонал.</p>
                      <Button onClick={() => setActiveTab('establishments')}>
                        Към заведения
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Служители - {selectedEstablishment.companyName}</CardTitle>
                        <CardDescription>
                          Управление на служители в заведението
                        </CardDescription>
                      </div>
                      <Button onClick={openAddPersonnel}>
                        <Plus className="w-4 h-4 mr-2" />
                        Добави служител
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {personnel.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Няма добавени служители. Използвайте бутона "Добави служител" за да добавите.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {personnel.map((person) => (
                          <div key={person.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start gap-4">
                              {person.photoUrl && (
                                <div className="flex-shrink-0">
                                  <Image
                                    src={person.photoUrl}
                                    alt={person.fullName}
                                    width={80}
                                    height={80}
                                    className="rounded-lg object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <div className="text-sm text-gray-500">Име</div>
                                  <div className="font-medium">{person.fullName}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500">ЕГН</div>
                                  <div className="font-medium">{person.egn}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500">Длъжност</div>
                                  <div className="font-medium">{person.position}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500">Здравна книжка №</div>
                                  <div className="font-medium">{person.healthBookNumber}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500">Валидност</div>
                                  <div className="font-medium">{person.healthBookValidity}</div>
                                </div>
                                {person.healthBookImageUrl && (
                                  <div className="md:col-span-3">
                                    <div className="text-sm text-gray-500 mb-1">Документ за здравна книжка</div>
                                    <a
                                      href={person.healthBookImageUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-sm"
                                    >
                                      Преглед на документа
                                    </a>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditPersonnel(person)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeletePersonnel(person.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Personnel Dialog */}
      <Dialog open={showPersonnelDialog} onOpenChange={setShowPersonnelDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPersonnel ? 'Редактиране на служител' : 'Добавяне на служител'}
            </DialogTitle>
            <DialogDescription>
              Попълнете информацията за служителя
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="personnelFullName">Имена *</Label>
              <Input
                id="personnelFullName"
                value={personnelForm.fullName}
                onChange={(e) => setPersonnelForm({ ...personnelForm, fullName: e.target.value })}
                placeholder="Петър Петров"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personnelPhoto">Снимка (JPEG, PNG, WebP до 5MB)</Label>
              <div className="space-y-2">
                <Input
                  id="personnelPhoto"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="cursor-pointer"
                />
                {uploadingPhoto && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Качване на снимка...
                  </div>
                )}
                {personnelForm.photoUrl && !uploadingPhoto && (
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Снимката е качена
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPersonnelForm({ ...personnelForm, photoUrl: '' })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Позволени формати: JPEG, PNG, WebP. Максимален размер: 5MB
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="personnelEgn">ЕГН *</Label>
              <Input
                id="personnelEgn"
                value={personnelForm.egn}
                onChange={(e) => setPersonnelForm({ ...personnelForm, egn: e.target.value })}
                placeholder="1234567890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personnelPosition">Дейност *</Label>
              <Input
                id="personnelPosition"
                value={personnelForm.position}
                onChange={(e) => setPersonnelForm({ ...personnelForm, position: e.target.value })}
                placeholder="Сервитьор"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personnelHealthBookNumber">Здравна книжка № *</Label>
              <Input
                id="personnelHealthBookNumber"
                value={personnelForm.healthBookNumber}
                onChange={(e) => setPersonnelForm({ ...personnelForm, healthBookNumber: e.target.value })}
                placeholder="ZB123456"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personnelHealthBookValidity">Валидност на здравна книжка *</Label>
              <Input
                id="personnelHealthBookValidity"
                type="date"
                value={personnelForm.healthBookValidity}
                onChange={(e) => setPersonnelForm({ ...personnelForm, healthBookValidity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personnelHealthBook">Документ за здравна книжка (URL)</Label>
              <Input
                id="personnelHealthBook"
                type="url"
                value={personnelForm.healthBookImageUrl}
                onChange={(e) => setPersonnelForm({ ...personnelForm, healthBookImageUrl: e.target.value })}
                placeholder="https://example.com/document.pdf"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSavePersonnel} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Запазване...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Запази
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPersonnelDialog(false);
                  setEditingPersonnel(null);
                  setPersonnelForm({ fullName: '', egn: '', position: '', healthBookImageUrl: '', photoUrl: '', healthBookNumber: '', healthBookValidity: '' });
                }}
              >
                Откажи
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}