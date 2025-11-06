"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAuthToken } from '@/lib/auth';
import { Search, Eye, Trash2, RefreshCw, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export default function BusinessListSection() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [businessToDelete, setBusinessToDelete] = useState<any>(null);
  const [temperatureLogs, setTemperatureLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    filterBusinesses();
  }, [businesses, searchTerm, cityFilter, typeFilter]);

  const fetchBusinesses = async () => {
    setLoading(true);
    setError('');

    try {
      const token = getAuthToken();
      const response = await fetch('/api/admin/businesses?limit=1000&sort=createdAt&order=desc', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Грешка при зареждане на обектите');
      }

      const data = await response.json();
      setBusinesses(data.businesses || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterBusinesses = () => {
    let filtered = [...businesses];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.name.toLowerCase().includes(term) ||
        b.city.toLowerCase().includes(term) ||
        b.address.toLowerCase().includes(term)
      );
    }

    if (cityFilter !== 'all') {
      filtered = filtered.filter(b => b.city === cityFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(b => b.type === typeFilter);
    }

    setFilteredBusinesses(filtered);
  };

  const handleViewDetails = async (business: any) => {
    setSelectedBusiness(business);
    setLogsLoading(true);
    
    try {
      const token = getAuthToken();
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const response = await fetch(
        `/api/temperature-logs/${business.id}?startDate=${weekAgo.toISOString().split('T')[0]}&endDate=${today.toISOString().split('T')[0]}&limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTemperatureLogs(data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleDeleteBusiness = async () => {
    if (!businessToDelete) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/businesses/${businessToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Грешка при изтриване на обекта');
      }

      setBusinesses(prev => prev.filter(b => b.id !== businessToDelete.id));
      setBusinessToDelete(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const exportBusinessesToCSV = () => {
    const headers = ['ID', 'Име', 'Тип', 'Град', 'Адрес', 'Телефон', 'Email', 'Хладилници', 'Фризери', 'Топли витрини', 'Хладилни витрини', 'Дата на регистрация'];
    const rows = filteredBusinesses.map(b => [
      b.id,
      b.name,
      b.type,
      b.city,
      b.address,
      b.phone,
      b.email,
      b.refrigeratorCount,
      b.freezerCount,
      b.hotDisplayCount,
      b.coldDisplayCount,
      new Date(b.createdAt).toLocaleDateString('bg-BG')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `businesses_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const uniqueCities = Array.from(new Set(businesses.map(b => b.city))).sort();
  const uniqueTypes = Array.from(new Set(businesses.map(b => b.type))).sort();

  const getEquipmentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'refrigerator': 'Хладилник',
      'freezer': 'Фризер',
      'hot_display': 'Топла витрина',
      'cold_display': 'Хладилна витрина'
    };
    return labels[type] || type;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Регистрирани обекти</CardTitle>
              <CardDescription>
                Преглед и управление на всички регистрирани хранителни обекти
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchBusinesses} disabled={loading} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Обнови
              </Button>
              <Button onClick={exportBusinessesToCSV} disabled={filteredBusinesses.length === 0} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Експорт
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="search">Търсене</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Име, град, адрес..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cityFilter">Град</Label>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всички градове</SelectItem>
                  {uniqueCities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="typeFilter">Тип</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всички типове</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
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
              <p className="text-gray-600">Зареждане на обекти...</p>
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Няма намерени обекти</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Име</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Град</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Устройства</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBusinesses.map((business) => (
                    <TableRow key={business.id}>
                      <TableCell className="font-mono text-sm">{business.id}</TableCell>
                      <TableCell className="font-medium">{business.name}</TableCell>
                      <TableCell>{business.type}</TableCell>
                      <TableCell>{business.city}</TableCell>
                      <TableCell>{business.phone}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {business.refrigeratorCount + business.freezerCount + 
                           business.hotDisplayCount + business.coldDisplayCount}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(business.createdAt).toLocaleDateString('bg-BG')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(business)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setBusinessToDelete(business)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-500">
            Показани: {filteredBusinesses.length} от {businesses.length} обекта
          </div>
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={!!selectedBusiness} onOpenChange={() => setSelectedBusiness(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Детайли за обект</DialogTitle>
            <DialogDescription>
              Пълна информация и последни температурни записи
            </DialogDescription>
          </DialogHeader>
          
          {selectedBusiness && (
            <div className="space-y-6">
              {/* Business Information */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-500">Име на обект</p>
                  <p className="text-base font-semibold">{selectedBusiness.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Тип</p>
                  <p className="text-base">{selectedBusiness.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Град</p>
                  <p className="text-base">{selectedBusiness.city}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Адрес</p>
                  <p className="text-base">{selectedBusiness.address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Телефон</p>
                  <p className="text-base">{selectedBusiness.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-base">{selectedBusiness.email}</p>
                </div>
              </div>

              {/* Equipment Summary */}
              <div>
                <h4 className="font-semibold mb-3">Съоръжения</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Хладилници</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedBusiness.refrigeratorCount}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Фризери</p>
                    <p className="text-2xl font-bold text-purple-600">{selectedBusiness.freezerCount}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">Топли витрини</p>
                    <p className="text-2xl font-bold text-orange-600">{selectedBusiness.hotDisplayCount}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Хладилни витрини</p>
                    <p className="text-2xl font-bold text-green-600">{selectedBusiness.coldDisplayCount}</p>
                  </div>
                </div>
                {selectedBusiness.otherEquipment && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Други съоръжения</p>
                    <p className="text-base">{selectedBusiness.otherEquipment}</p>
                  </div>
                )}
              </div>

              {/* Temperature Logs */}
              <div>
                <h4 className="font-semibold mb-3">Последни температурни записи (7 дни)</h4>
                {logsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : temperatureLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Няма налични записи</p>
                ) : (
                  <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Дата</TableHead>
                          <TableHead>Устройство</TableHead>
                          <TableHead>Номер</TableHead>
                          <TableHead>Температура</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {temperatureLogs.slice(0, 50).map((log, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm">
                              {new Date(log.logDate).toLocaleDateString('bg-BG')}
                            </TableCell>
                            <TableCell>{getEquipmentTypeLabel(log.equipmentType)}</TableCell>
                            <TableCell>№ {log.equipmentNumber}</TableCell>
                            <TableCell className="font-semibold">{log.temperature.toFixed(1)}°C</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!businessToDelete} onOpenChange={() => setBusinessToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Изтриване на обект</AlertDialogTitle>
            <AlertDialogDescription>
              Сигурни ли сте, че искате да изтриете <strong>{businessToDelete?.name}</strong>?
              <br /><br />
              Това действие е необратимо и ще изтрие всички свързани температурни записи.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Откажи</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBusiness} className="bg-red-600 hover:bg-red-700">
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}