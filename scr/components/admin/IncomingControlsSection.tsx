"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Calendar, Search, FileText } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAuthToken } from '@/lib/auth';

interface IncomingControl {
  id: number;
  userId: number;
  establishmentId: number | null;
  controlDate: string;
  imageUrl: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  userEmail: string;
  companyName: string | null;
  establishmentType: string | null;
}

interface User {
  id: number;
  email: string;
}

export default function IncomingControlsSection() {
  const [controls, setControls] = useState<IncomingControl[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalControls, setTotalControls] = useState(0);
  
  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterUserId, setFilterUserId] = useState('all');
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadControls();
  }, [filterDate, filterUserId, offset]);

  const loadUsers = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('/api/admin/users?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadControls = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        toast.error('Не сте упълномощени');
        return;
      }

      // Build query params
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      
      if (filterDate) {
        params.append('date', filterDate);
      }
      
      if (filterUserId && filterUserId !== 'all') {
        params.append('userId', filterUserId);
      }

      const response = await fetch(`/api/admin/incoming-controls?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setControls(data.controls || []);
        setTotalControls(data.total || 0);
      } else {
        toast.error('Грешка при зареждане на контролите');
      }
    } catch (error) {
      console.error('Error loading incoming controls:', error);
      toast.error('Грешка при свързване със сървъра');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilterDate('');
    setFilterUserId('all');
    setOffset(0);
  };

  const handleNextPage = () => {
    setOffset(prev => prev + limit);
  };

  const handlePreviousPage = () => {
    setOffset(prev => Math.max(0, prev - limit));
  };

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(totalControls / limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Входящ контрол - Преглед на всички записи</CardTitle>
        <CardDescription>
          Администраторски преглед на всички входящи контроли от всички потребители
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filterDate">
                <Calendar className="w-4 h-4 inline mr-2" />
                Дата
              </Label>
              <Input
                id="filterDate"
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setOffset(0);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filterUser">
                <Search className="w-4 h-4 inline mr-2" />
                Потребител
              </Label>
              <Select value={filterUserId} onValueChange={(value) => {
                setFilterUserId(value);
                setOffset(0);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Всички потребители" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всички потребители</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={handleClearFilters} className="w-full">
                Изчисти филтрите
              </Button>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Намерени: <strong>{totalControls}</strong> записа
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : controls.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">Няма намерени записи</p>
            <p className="text-sm mt-2">Опитайте да промените филтрите</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {controls.map((control) => (
                <Card key={control.id} className="overflow-hidden">
                  <div className="aspect-video relative bg-gray-100">
                    <img
                      src={control.imageUrl}
                      alt="Входящ контрол"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23ddd" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Няма снимка</text></svg>';
                      }}
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Дата:</span>
                        <span className="font-medium">{control.controlDate}</span>
                      </div>

                      <div className="pt-2 border-t">
                        <div className="text-sm text-gray-600 mb-1">Потребител:</div>
                        <div className="font-medium text-blue-600">{control.userEmail}</div>
                      </div>

                      {control.companyName && (
                        <div className="pt-2 border-t">
                          <div className="text-sm text-gray-600 mb-1">Обект:</div>
                          <div className="font-medium">{control.companyName}</div>
                          {control.establishmentType && (
                            <div className="text-sm text-gray-500">{control.establishmentType}</div>
                          )}
                        </div>
                      )}

                      {control.notes && (
                        <div className="pt-2 border-t">
                          <div className="text-sm text-gray-600 mb-1">Бележки:</div>
                          <div className="text-sm">{control.notes}</div>
                        </div>
                      )}

                      <div className="pt-2 border-t text-xs text-gray-500">
                        Създаден: {new Date(control.createdAt).toLocaleString('bg-BG')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Страница {currentPage} от {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePreviousPage}
                    disabled={offset === 0}
                  >
                    Предишна
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={offset + limit >= totalControls}
                  >
                    Следваща
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}