"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Mail, RefreshCw } from 'lucide-react';
import { getAuthToken } from '@/lib/auth';
import { toast } from 'sonner';

interface ExpiringHealthBook {
  id: number;
  fullName: string;
  position: string;
  healthBookNumber: string;
  healthBookValidity: string;
  daysUntilExpiry: number;
  establishmentId: number;
  establishmentName: string;
  contactEmail: string | null;
}

export default function HealthBooksExpiringSection() {
  const [loading, setLoading] = useState(true);
  const [personnel, setPersonnel] = useState<ExpiringHealthBook[]>([]);

  useEffect(() => {
    fetchExpiringHealthBooks();
  }, []);

  const fetchExpiringHealthBooks = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      const response = await fetch('/api/admin/health-books-expiring', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPersonnel(data.personnel || []);
      } else {
        toast.error('Грешка при зареждане на данните');
      }
    } catch (error) {
      console.error('Error fetching expiring health books:', error);
      toast.error('Грешка при свързване със сървъра');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (person: ExpiringHealthBook) => {
    if (!person.contactEmail) {
      toast.error('Няма имейл за контакт за това заведение');
      return;
    }

    toast.info(`Напомняне изпратено до ${person.contactEmail}`);
    // Here you would implement actual email sending
  };

  const getDaysColor = (days: number) => {
    if (days <= 3) return 'text-red-600 bg-red-50';
    if (days <= 7) return 'text-orange-600 bg-orange-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Изтичащи здравни книжки (следващите 10 дни)
            </CardTitle>
            <CardDescription>
              Служители с изтичащи здравни книжки, изискващи внимание
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchExpiringHealthBooks}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Обнови
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {personnel.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium text-gray-900">Няма изтичащи здравни книжки</p>
            <p className="text-sm mt-1">Всички здравни книжки са валидни за следващите 10 дни</p>
          </div>
        ) : (
          <div className="space-y-4">
            {personnel.map((person) => (
              <div key={person.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{person.fullName}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDaysColor(person.daysUntilExpiry)}`}>
                        {person.daysUntilExpiry === 0 ? 'Изтича днес' : 
                         person.daysUntilExpiry === 1 ? 'Изтича утре' :
                         `Остават ${person.daysUntilExpiry} дни`}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Заведение:</span>{' '}
                        <span className="font-medium">{person.establishmentName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Длъжност:</span>{' '}
                        <span className="font-medium">{person.position}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Здравна книжка №:</span>{' '}
                        <span className="font-medium">{person.healthBookNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Валидност:</span>{' '}
                        <span className="font-medium">{person.healthBookValidity}</span>
                      </div>
                      {person.contactEmail && (
                        <div className="md:col-span-2">
                          <span className="text-gray-500">Контакт:</span>{' '}
                          <span className="font-medium">{person.contactEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendReminder(person)}
                    disabled={!person.contactEmail}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Изпрати напомняне
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
