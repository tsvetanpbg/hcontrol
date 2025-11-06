"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getAuthToken } from '@/lib/auth';
import { Edit, Save, X } from 'lucide-react';

interface ProfileSectionProps {
  business: any;
  onUpdate: (updatedBusiness: any) => void;
}

export default function ProfileSection({ business, onUpdate }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: business.name,
    type: business.type,
    city: business.city,
    address: business.address,
    phone: business.phone,
    email: business.email,
    refrigeratorCount: business.refrigeratorCount,
    freezerCount: business.freezerCount,
    hotDisplayCount: business.hotDisplayCount,
    coldDisplayCount: business.coldDisplayCount,
    otherEquipment: business.otherEquipment || ''
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/businesses/${business.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Грешка при актуализация');
      }

      setSuccess('Профилът е актуализиран успешно!');
      onUpdate(data);
      setIsEditing(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Възникна грешка при актуализацията');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: business.name,
      type: business.type,
      city: business.city,
      address: business.address,
      phone: business.phone,
      email: business.email,
      refrigeratorCount: business.refrigeratorCount,
      freezerCount: business.freezerCount,
      hotDisplayCount: business.hotDisplayCount,
      coldDisplayCount: business.coldDisplayCount,
      otherEquipment: business.otherEquipment || ''
    });
    setIsEditing(false);
    setError('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Информация за обекта</CardTitle>
            <CardDescription>
              Преглед и редакция на данните за вашия обект
            </CardDescription>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Редактирай
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
                <Save className="mr-2 h-4 w-4" />
                Запази
              </Button>
              <Button onClick={handleCancel} variant="outline" disabled={loading}>
                <X className="mr-2 h-4 w-4" />
                Откажи
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Основни данни</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Име на обект</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Вид на обект</Label>
                {isEditing ? (
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ресторант">Ресторант</SelectItem>
                      <SelectItem value="заведение">Заведение</SelectItem>
                      <SelectItem value="кафе">Кафе</SelectItem>
                      <SelectItem value="сладкарница">Сладкарница</SelectItem>
                      <SelectItem value="кухня">Кухня</SelectItem>
                      <SelectItem value="друго">Друго</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={formData.type} disabled />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Град</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Адрес</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Имейл</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Equipment Information */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold">Съоръжения</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="refrigeratorCount">Брой хладилници (0°C до 4°C)</Label>
                <Input
                  id="refrigeratorCount"
                  type="number"
                  min="0"
                  value={formData.refrigeratorCount}
                  onChange={(e) => handleChange('refrigeratorCount', parseInt(e.target.value) || 0)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="freezerCount">Брой фризери (-36°C до -18°C)</Label>
                <Input
                  id="freezerCount"
                  type="number"
                  min="0"
                  value={formData.freezerCount}
                  onChange={(e) => handleChange('freezerCount', parseInt(e.target.value) || 0)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hotDisplayCount">Брой топли витрини (63°C до 80°C)</Label>
                <Input
                  id="hotDisplayCount"
                  type="number"
                  min="0"
                  value={formData.hotDisplayCount}
                  onChange={(e) => handleChange('hotDisplayCount', parseInt(e.target.value) || 0)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coldDisplayCount">Брой хладилни витрини (0°C до 4°C)</Label>
                <Input
                  id="coldDisplayCount"
                  type="number"
                  min="0"
                  value={formData.coldDisplayCount}
                  onChange={(e) => handleChange('coldDisplayCount', parseInt(e.target.value) || 0)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherEquipment">Други съоръжения</Label>
              <Textarea
                id="otherEquipment"
                rows={3}
                value={formData.otherEquipment}
                onChange={(e) => handleChange('otherEquipment', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}