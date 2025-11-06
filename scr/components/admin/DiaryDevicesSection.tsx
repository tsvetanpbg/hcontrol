"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';
import { Loader2, Eye, ChevronLeft, ChevronRight, Thermometer, RefreshCw, ChevronDown, ChevronRight as ChevronRightIcon, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const DEVICE_TYPES = ['Фризери', 'Хладилници', 'Топли витрини'];

interface Device {
  id: number;
  userId: number;
  userEmail: string | null;
  deviceType: string;
  deviceName: string;
  minTemp: number;
  maxTemp: number;
  createdAt: string;
  updatedAt: string;
}

interface Reading {
  id: number;
  deviceId: number;
  readingDate: string;
  hour: number;
  temperature: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GroupedDevices {
  [userId: string]: {
    userEmail: string | null;
    devices: Device[];
  };
}

export default function DiaryDevicesSection() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  
  // Filters
  const [filterDeviceType, setFilterDeviceType] = useState('');
  
  // View details
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [loadingReadings, setLoadingReadings] = useState(false);
  const [generatingReadings, setGeneratingReadings] = useState(false);

  // Collapsible state for each user
  const [openUsers, setOpenUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDevices();
  }, [page, filterDeviceType]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
      });

      if (filterDeviceType) params.append('deviceType', filterDeviceType);

      const response = await fetch(`/api/admin/diary-devices?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices);
        setTotal(data.total);
      } else {
        toast.error('Грешка при зареждане на устройствата');
      }
    } catch (error) {
      console.error('Error loading devices:', error);
      toast.error('Грешка при свързване със сървъра');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (device: Device) => {
    try {
      setLoadingReadings(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/admin/diary-devices/${device.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedDevice(data.device);
        setReadings(data.readings);
        setShowDetailsDialog(true);
      } else {
        toast.error('Грешка при зареждане на детайлите');
      }
    } catch (error) {
      console.error('Error loading details:', error);
      toast.error('Грешка при свързване със сървъра');
    } finally {
      setLoadingReadings(false);
    }
  };

  const handleGenerateReadings = async (deviceId: number) => {
    if (!confirm('Сигурни ли сте, че искате да генерирате записи за днес за това устройство?')) {
      return;
    }

    try {
      setGeneratingReadings(true);
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];

      const response = await fetch('/api/temperature-readings/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: deviceId,
          date: today,
        }),
      });

      if (response.ok) {
        toast.success('Температурните записи са генерирани успешно');
        if (showDetailsDialog && selectedDevice) {
          handleViewDetails(selectedDevice);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Грешка при генериране на записи');
      }
    } catch (error) {
      console.error('Error generating readings:', error);
      toast.error('Грешка при свързване със сървъра');
    } finally {
      setGeneratingReadings(false);
    }
  };

  const toggleUser = (userId: string) => {
    const newOpenUsers = new Set(openUsers);
    if (newOpenUsers.has(userId)) {
      newOpenUsers.delete(userId);
    } else {
      newOpenUsers.add(userId);
    }
    setOpenUsers(newOpenUsers);
  };

  // Group devices by user
  const groupedDevices: GroupedDevices = devices.reduce((acc, device) => {
    const userId = device.userId.toString();
    if (!acc[userId]) {
      acc[userId] = {
        userEmail: device.userEmail,
        devices: []
      };
    }
    acc[userId].devices.push(device);
    return acc;
  }, {} as GroupedDevices);

  const totalPages = Math.ceil(total / limit);

  // Group readings by date
  const groupedReadings = readings.reduce((acc, reading) => {
    if (!acc[reading.readingDate]) {
      acc[reading.readingDate] = [];
    }
    acc[reading.readingDate].push(reading);
    return acc;
  }, {} as Record<string, Reading[]>);

  const dates = Object.keys(groupedReadings).sort().reverse();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Дневници - Устройства</CardTitle>
          <CardDescription>
            Преглед и управление на регистрирани устройства по потребители
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Тип устройство</Label>
              <Select value={filterDeviceType || undefined} onValueChange={(value) => {
                setFilterDeviceType(value || '');
                setPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Всички типове" />
                </SelectTrigger>
                <SelectContent>
                  {DEVICE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filterDeviceType && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setFilterDeviceType('');
                    setPage(1);
                  }}
                  className="w-full"
                >
                  Изчисти филтър
                </Button>
              )}
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Няма намерени устройства
            </div>
          ) : (
            <>
              {/* Grouped by User */}
              <div className="space-y-4">
                {Object.entries(groupedDevices).map(([userId, userData]) => (
                  <Collapsible
                    key={userId}
                    open={openUsers.has(userId)}
                    onOpenChange={() => toggleUser(userId)}
                  >
                    <div className="border rounded-lg">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            {openUsers.has(userId) ? (
                              <ChevronDown className="w-5 h-5 text-gray-600" />
                            ) : (
                              <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                            )}
                            <User className="w-5 h-5 text-blue-600" />
                            <div>
                              <div className="font-semibold text-gray-900">
                                {userData.userEmail || 'Потребител без имейл'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {userData.devices.length} устройства
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {userId}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Име на устройство</TableHead>
                                <TableHead>Тип</TableHead>
                                <TableHead>Температурен диапазон</TableHead>
                                <TableHead>Създадено на</TableHead>
                                <TableHead className="text-right">Действия</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {userData.devices.map((device) => (
                                <TableRow key={device.id}>
                                  <TableCell className="font-medium">{device.id}</TableCell>
                                  <TableCell>{device.deviceName}</TableCell>
                                  <TableCell>{device.deviceType}</TableCell>
                                  <TableCell>
                                    <span className="flex items-center gap-1">
                                      <Thermometer className="w-4 h-4 text-blue-600" />
                                      {device.minTemp}℃ до {device.maxTemp}℃
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {new Date(device.createdAt).toLocaleDateString('bg-BG')}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleViewDetails(device)}
                                      >
                                        <Eye className="w-4 h-4 mr-1" />
                                        Преглед
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleGenerateReadings(device.id)}
                                        disabled={generatingReadings}
                                      >
                                        {generatingReadings ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <>
                                            <RefreshCw className="w-4 h-4 mr-1" />
                                            Генерирай записи
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Показани {(page - 1) * limit + 1} до {Math.min(page * limit, total)} от {total} устройства
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Детайли за устройство</DialogTitle>
            <DialogDescription>
              Информация за устройството и неговите температурни записи
            </DialogDescription>
          </DialogHeader>
          {selectedDevice && (
            <div className="space-y-6">
              {/* Device Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Информация за устройството</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Потребител</div>
                    <div className="font-medium">{selectedDevice.userEmail || 'Неизвестен'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Име на устройство</div>
                    <div className="font-medium">{selectedDevice.deviceName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Тип</div>
                    <div className="font-medium">{selectedDevice.deviceType}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Температурен диапазон</div>
                    <div className="font-medium">{selectedDevice.minTemp}℃ до {selectedDevice.maxTemp}℃</div>
                  </div>
                </div>
              </div>

              {/* Temperature Readings */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Температурни записи ({readings.length})
                </h3>
                {loadingReadings ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : readings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Няма температурни записи
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dates.map((date) => (
                      <div key={date} className="border rounded-lg p-4">
                        <div className="font-semibold mb-3">
                          {new Date(date).toLocaleDateString('bg-BG', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                          {groupedReadings[date]
                            .sort((a, b) => a.hour - b.hour)
                            .map((reading) => {
                              const isOutOfRange = 
                                reading.temperature < selectedDevice.minTemp || 
                                reading.temperature > selectedDevice.maxTemp;
                              
                              return (
                                <div
                                  key={reading.id}
                                  className={`text-center p-2 rounded border ${
                                    isOutOfRange
                                      ? 'bg-red-50 border-red-300'
                                      : 'bg-green-50 border-green-300'
                                  }`}
                                  title={reading.notes || undefined}
                                >
                                  <div className="text-xs text-gray-600">
                                    {reading.hour.toString().padStart(2, '0')}:00
                                  </div>
                                  <div className={`font-semibold ${
                                    isOutOfRange ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    {reading.temperature.toFixed(1)}℃
                                  </div>
                                  {reading.notes && (
                                    <div className="text-xs text-gray-500 truncate mt-1">
                                      📝
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}