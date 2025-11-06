"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, X, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

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

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [validatingEik, setValidatingEik] = useState(false);
  const [eikValidationResult, setEikValidationResult] = useState<{ valid: boolean; message: string } | null>(null);
  
  const [formData, setFormData] = useState({
    managerName: '',
    profileImageUrl: '',
    businessName: '',
    businessType: '',
    city: '',
    address: '',
    phone: '',
    businessEmail: '',
    eik: '',
    vatRegistered: false,
    vatNumber: '',
    email: '',
    password: ''
  });

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Файлът е твърде голям. Максимален размер: 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Моля изберете изображение');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData(prev => ({ ...prev, profileImageUrl: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, profileImageUrl: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.managerName.trim()) {
      setError('Моля въведете име на управител');
      setLoading(false);
      return;
    }

    if (!formData.businessType) {
      setError('Моля изберете вид на обект');
      setLoading(false);
      return;
    }

    // Validate EIK
    if (formData.eik && (!eikValidationResult || !eikValidationResult.valid)) {
      setError('Моля въведете валиден ЕИК номер');
      setLoading(false);
      return;
    }

    // Validate VAT number if VAT registered
    if (formData.vatRegistered && !formData.vatNumber.trim()) {
      setError('Моля въведете ДДС номер');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Грешка при регистрация');
      }

      // Show success message
      toast.success('Регистрацията е успешна! Вашият акаунт ще бъде активиран от администратор.');
      
      // Redirect to login page after successful registration
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Възникна грешка при регистрацията');
      toast.error(err.message || 'Възникна грешка при регистрацията');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      managerName: '',
      profileImageUrl: '',
      businessName: '',
      businessType: '',
      city: '',
      address: '',
      phone: '',
      businessEmail: '',
      eik: '',
      vatRegistered: false,
      vatNumber: '',
      email: '',
      password: ''
    });
    setError('');
    setImagePreview(null);
    setEikValidationResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Button asChild variant="ghost" className="mb-6">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Върни се назад
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Регистрация на обект</CardTitle>
              <CardDescription>
                Попълнете формата за регистрация на вашия хранителен обект
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {/* Account Information */}
                <div className="space-y-4 border-b pb-6">
                  <h3 className="text-lg font-semibold">Данни за вход</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="managerName">Име на управител *</Label>
                    <Input
                      id="managerName"
                      required
                      value={formData.managerName}
                      onChange={(e) => handleChange('managerName', e.target.value)}
                      placeholder="Иван Иванов"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profileImage">Персонална снимка (не е задължителна)</Label>
                    <div className="flex items-start gap-4">
                      {imagePreview ? (
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="Profile preview" 
                            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                            onClick={removeImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label 
                          htmlFor="profileImage" 
                          className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                        >
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-xs text-gray-500 text-center px-2">Качи снимка</span>
                        </label>
                      )}
                      <Input
                        id="profileImage"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                      <div className="flex-1 text-sm text-gray-600">
                        <p>• Максимален размер: 5MB</p>
                        <p>• Поддържани формати: JPG, PNG, GIF</p>
                        <p>• Снимката ще се показва във вашия профил</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email за вход *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Парола *</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Business Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Данни за обекта</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Име на обект *</Label>
                    <Input
                      id="businessName"
                      required
                      value={formData.businessName}
                      onChange={(e) => handleChange('businessName', e.target.value)}
                      placeholder="Ресторант Примерен"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessType">Вид на обект *</Label>
                    <Select
                      value={formData.businessType}
                      onValueChange={(value) => handleChange('businessType', value)}
                      required
                    >
                      <SelectTrigger id="businessType">
                        <SelectValue placeholder="Изберете вид" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTABLISHMENT_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eik">ЕИК (Единен идентификационен код)</Label>
                    <div className="relative">
                      <Input
                        id="eik"
                        value={formData.eik}
                        onChange={(e) => handleEikChange(e.target.value)}
                        placeholder="123456789"
                        maxLength={13}
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
                    <p className="text-xs text-gray-500">
                      9 или 13 цифри (не е задължително)
                    </p>
                  </div>

                  {/* VAT Registration - Show only if EIK is valid */}
                  {eikValidationResult?.valid && (
                    <>
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="vatRegistered"
                          checked={formData.vatRegistered}
                          onCheckedChange={(checked) => {
                            handleChange('vatRegistered', checked as boolean);
                            if (!checked) {
                              handleChange('vatNumber', '');
                            }
                          }}
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
                            value={formData.vatNumber}
                            onChange={(e) => handleChange('vatNumber', e.target.value)}
                            placeholder="BG123456789"
                            required={formData.vatRegistered}
                          />
                          <p className="text-xs text-gray-500">
                            Въведете ДДС номера на фирмата
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Град *</Label>
                      <Input
                        id="city"
                        required
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder="София"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Телефон *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="0888123456"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Адрес *</Label>
                    <Input
                      id="address"
                      required
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="ул. Витоша 1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">Имейл на обекта *</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      required
                      value={formData.businessEmail}
                      onChange={(e) => handleChange('businessEmail', e.target.value)}
                      placeholder="contact@business.bg"
                    />
                  </div>
                </div>

                {/* Important Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Важно:</strong> След регистрация вашият акаунт ще бъде проверен от администратор. 
                    Ще получите достъп след одобрение.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? 'Регистриране...' : 'Запиши'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    Изчисти
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    asChild
                    className="flex-1"
                  >
                    <Link href="/">Върни се назад</Link>
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