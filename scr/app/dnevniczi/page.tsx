"use client"

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Plus, Download, Calendar, Edit, Trash2, Upload, FileText, UtensilsCrossed, FileDown, Building2, FileImage } from 'lucide-react';
import { exportTemperatureLogsToImage, exportAllDailyDiariesToImage } from '@/lib/image-export-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const DEVICE_TYPES = [
  { value: 'Фризери', label: 'Дневник Фризери', range: '-36℃ до -18℃' },
  { value: 'Хладилници', label: 'Дневник Хладилници', range: '0℃ до 4℃' },
  { value: 'Топли витрини', label: 'Дневник Топли витрини', range: '63℃ до 80℃' },
  { value: 'Фритюрници', label: 'Дневник Фритюрници', range: '160℃ до 180℃' },
  { value: 'Входящ контрол', label: 'Дневник Входящ контрол', range: 'Контрол на суровини' },
  { value: 'Храни', label: 'Дневник Храни', range: 'Автоматични записи за храни', isLink: true, path: '/dnevniczi/food' },
];

interface Device {
  id: number;
  userId: number;
  deviceType: string;
  deviceName: string;
  minTemp: number;
  maxTemp: number;
  establishmentId: number | null;
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

interface Establishment {
  id: number;
  companyName: string;
  establishmentType: string;
}

interface IncomingControl {
  id: number;
  userId: number;
  establishmentId: number | null;
  controlDate: string;
  imageUrl: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  establishment?: {
    id: number;
    companyName: string;
    establishmentType: string;
  };
}

function DnevnicziContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<Device[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAddDeviceDialog, setShowAddDeviceDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [editingReading, setEditingReading] = useState<Reading | null>(null);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingReadings, setLoadingReadings] = useState(false);

  // Incoming control states
  const [incomingControls, setIncomingControls] = useState<IncomingControl[]>([]);
  const [loadingControls, setLoadingControls] = useState(false);
  const [showAddControlDialog, setShowAddControlDialog] = useState(false);
  const [newControl, setNewControl] = useState({
    controlDate: new Date().toISOString().split('T')[0],
    imageUrl: '',
    notes: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadEstablishments();
    
    // Check for type parameter
    const typeParam = searchParams.get('type');
    if (typeParam && DEVICE_TYPES.some(dt => dt.value === typeParam)) {
      setSelectedDeviceType(typeParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedEstablishment) {
      loadDevices(selectedEstablishment.id);
    }
  }, [selectedEstablishment]);

  useEffect(() => {
    if (selectedDevice) {
      loadReadings(selectedDevice.id, selectedDate);
    }
  }, [selectedDevice, selectedDate]);

  useEffect(() => {
    if (selectedDeviceType === 'Входящ контрол' && selectedEstablishment) {
      loadIncomingControls();
    }
  }, [selectedDeviceType, selectedDate, selectedEstablishment]);

  // When device type changes, auto-select first device of that type
  useEffect(() => {
    if (selectedDeviceType && selectedDeviceType !== 'Входящ контрол' && devices.length > 0) {
      const firstDevice = devices.find(d => d.deviceType === selectedDeviceType);
      if (firstDevice) {
        setSelectedDevice(firstDevice);
      } else {
        setSelectedDevice(null);
      }
    }
  }, [selectedDeviceType, devices]);

  const loadEstablishments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/establishments/user-all', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const establishmentsList = data.establishments || [];
        setEstablishments(establishmentsList);
        
        if (establishmentsList.length > 0) {
          // Auto-select first establishment
          setSelectedEstablishment(establishmentsList[0]);
        }
      } else {
        toast.error('Грешка при зареждане на заведенията');
      }
    } catch (error) {
      console.error('Error loading establishments:', error);
      toast.error('Грешка при свързване със сървъра');
    } finally {
      setLoading(false);
    }
  };

  const loadIncomingControls = async () => {
    if (!selectedEstablishment) return;

    try {
      setLoadingControls(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const url = selectedDate 
        ? `/api/incoming-controls/user?date=${selectedDate}`
        : '/api/incoming-controls/user';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter by selected establishment
        const filtered = data.filter((c: IncomingControl) => c.establishmentId === selectedEstablishment.id);
        setIncomingControls(filtered);
      } else {
        toast.error('Грешка при зареждане на контролите');
      }
    } catch (error) {
      console.error('Error loading incoming controls:', error);
      toast.error('Грешка при свързване със сървъра');
    } finally {
      setLoadingControls(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Моля изберете изображение');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Изображението е твърде голямо (макс. 5MB)');
      return;
    }

    try {
      setUploadingImage(true);

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setNewControl({ ...newControl, imageUrl: base64String });
        toast.success('Изображението е качено');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Грешка при качване на изображението');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddIncomingControl = async () => {
    if (!selectedEstablishment) {
      toast.error('Моля изберете заведение');
      return;
    }

    if (!newControl.controlDate) {
      toast.error('Моля изберете дата');
      return;
    }

    if (!newControl.imageUrl) {
      toast.error('Моля качете снимка');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/incoming-controls', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          establishmentId: selectedEstablishment.id,
          controlDate: newControl.controlDate,
          imageUrl: newControl.imageUrl,
          notes: newControl.notes.trim() || null,
        }),
      });

      if (response.ok) {
        toast.success('Входящият контрол е добавен');
        setShowAddControlDialog(false);
        setNewControl({
          controlDate: new Date().toISOString().split('T')[0],
          imageUrl: '',
          notes: '',
        });
        loadIncomingControls();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Грешка при добавяне');
      }
    } catch (error) {
      console.error('Error adding incoming control:', error);
      toast.error('Грешка при свързване със сървъра');
    }
  };

  const handleDeleteIncomingControl = async (controlId: number) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете този контрол?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/incoming-controls/${controlId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Контролът е изтрит');
        loadIncomingControls();
      } else {
        toast.error('Грешка при изтриване');
      }
    } catch (error) {
      console.error('Error deleting incoming control:', error);
      toast.error('Грешка при свързване със сървъра');
    }
  };

  const loadDevices = async (establishmentId: number) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/diary-devices/user?establishmentId=${establishmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDevices(data);
      } else {
        toast.error('Грешка при зареждане на устройствата');
      }
    } catch (error) {
      console.error('Error loading devices:', error);
      toast.error('Грешка при свързване със сървъра');
    }
  };

  const loadReadings = async (deviceId: number, date: string) => {
    try {
      setLoadingReadings(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/temperature-readings/by-device/${deviceId}?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReadings(data);
      } else {
        setReadings([]);
      }
    } catch (error) {
      console.error('Error loading readings:', error);
      setReadings([]);
    } finally {
      setLoadingReadings(false);
    }
  };

  const handleAddDevice = async () => {
    if (!selectedEstablishment) {
      toast.error('Моля изберете заведение');
      return;
    }

    if (!selectedDeviceType) {
      toast.error('Моля изберете тип устройство');
      return;
    }

    if (!newDeviceName.trim()) {
      toast.error('Моля въведете име на устройството');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/diary-devices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceType: selectedDeviceType,
          deviceName: newDeviceName.trim(),
          establishmentId: selectedEstablishment.id,
        }),
      });

      if (response.ok) {
        const newDevice = await response.json();
        toast.success('Устройството е добавено');
        setNewDeviceName('');
        setShowAddDeviceDialog(false);
        // Reload devices for selected establishment
        await loadDevices(selectedEstablishment.id);
        // Select the new device
        setSelectedDevice(newDevice);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Грешка при добавяне на устройство');
      }
    } catch (error) {
      console.error('Error adding device:', error);
      toast.error('Грешка при свързване със сървъра');
    }
  };

  const handleDeleteDevice = async (deviceId: number) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете това устройство?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/diary-devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Устройството е изтрито');
        // Reload devices
        if (selectedEstablishment) {
          await loadDevices(selectedEstablishment.id);
        }
        // Clear selected device if it was deleted
        if (selectedDevice?.id === deviceId) {
          setSelectedDevice(null);
        }
      } else {
        toast.error('Грешка при изтриване');
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      toast.error('Грешка при свързване със сървъра');
    }
  };

  const handleExport = async () => {
    if (!selectedDevice) {
      toast.error('Моля изберете устройство');
      return;
    }

    if (readings.length === 0) {
      toast.error('Няма данни за експорт');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Не сте влезли в системата');
        router.push('/login');
        return;
      }

      console.log('Exporting CSV for device:', selectedDevice.id);
      
      // For simplicity, export selected date only
      const response = await fetch(
        `/api/temperature-readings/export/${selectedDevice.id}?startDate=${selectedDate}&endDate=${selectedDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      console.log('CSV Export response status:', response.status);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedDevice.deviceName}-${selectedDate}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Файлът е изтеглен');
      } else {
        const errorText = await response.text();
        console.error('CSV Export error:', errorText);
        toast.error('Грешка при експортиране: ' + errorText);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Грешка при свързване със сървъра: ' + (error as Error).message);
    }
  };

  const handleExportImage = async (format: 'png' | 'jpeg' = 'png') => {
    console.log('=== handleExportImage START ===');
    console.log('Format:', format);
    console.log('selectedDevice:', selectedDevice);
    console.log('readings.length:', readings.length);
    
    if (!selectedDevice) {
      console.log('ERROR: No device selected');
      toast.error('Моля изберете устройство');
      return;
    }

    if (readings.length === 0) {
      console.log('ERROR: No readings');
      toast.error('Няма данни за експорт');
      return;
    }

    try {
      console.log('Showing toast...');
      toast.info(`Генериране на ${format.toUpperCase()}...`);
      
      console.log('Calling exportTemperatureLogsToImage...');
      await exportTemperatureLogsToImage(
        selectedDevice.deviceName,
        selectedDevice.deviceType,
        readings,
        selectedDate,
        selectedEstablishment?.companyName,
        format
      );
      
      console.log('Export successful!');
      toast.success(`${format.toUpperCase()} документът е изтеглен успешно!`);
    } catch (error) {
      console.error('=== ERROR in handleExportImage ===', error);
      toast.error('Грешка при генериране: ' + (error as Error).message);
    }
    
    console.log('=== handleExportImage END ===');
  };

  const handleExportAllDailyImage = async (format: 'png' | 'jpeg' = 'png') => {
    console.log('=== handleExportAllDailyImage START ===');
    console.log('Format:', format);
    console.log('selectedEstablishment:', selectedEstablishment);
    
    if (!selectedEstablishment) {
      console.log('ERROR: No establishment selected');
      toast.error('Моля изберете заведение');
      return;
    }

    try {
      console.log('Getting auth token...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('ERROR: No token');
        toast.error('Не сте влезли в системата');
        router.push('/login');
        return;
      }

      console.log('Showing loading toast...');
      toast.info('Зареждане на данни...');

      console.log('Fetching data from API...');
      const response = await fetch(`/api/temperature-readings/export-all-daily?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.log('API error:', error);
        if (error.code === 'NO_DEVICES') {
          toast.error('Няма добавени устройства за експорт');
        } else if (error.code === 'NO_READINGS') {
          toast.error('Няма температурни записи за избраната дата');
        } else {
          toast.error('Грешка при зареждане на данните');
        }
        return;
      }

      const data = await response.json();
      console.log('API data received:', data);
      console.log('Data structure:', JSON.stringify(data, null, 2));
      
      // FIX: Filter by d.device.establishmentId (not d.establishmentId)
      const filteredDevices = data.devices.filter((d: any) => {
        console.log('Checking device:', d.device?.deviceName, 'establishmentId:', d.device?.establishmentId, 'vs', selectedEstablishment.id);
        return d.device.establishmentId === selectedEstablishment.id;
      });
      console.log('Filtered devices count:', filteredDevices.length);

      if (!filteredDevices || filteredDevices.length === 0) {
        console.log('ERROR: No devices after filtering');
        toast.error('Няма данни за експорт за избраното заведение');
        return;
      }

      console.log('Showing generation toast...');
      toast.info(`Генериране на ${format.toUpperCase()} документ...`);

      console.log('Calling exportAllDailyDiariesToImage...');
      await exportAllDailyDiariesToImage(
        filteredDevices,
        selectedDate,
        selectedEstablishment.companyName,
        format
      );

      console.log('Export successful!');
      toast.success(`Дневният отчет е изтеглен успешно като ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('=== ERROR in handleExportAllDailyImage ===', error);
      toast.error('Грешка при генериране на отчета: ' + (error as Error).message);
    }
    
    console.log('=== handleExportAllDailyImage END ===');
  };

  const handleUpdateNotes = async () => {
    if (!editingReading) return;

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/temperature-readings/${editingReading.id}/notes`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        toast.success('Бележката е актуализирана');
        setShowNotesDialog(false);
        if (selectedDevice) {
          await loadReadings(selectedDevice.id, selectedDate);
        }
      } else {
        toast.error('Грешка при актуализиране на бележката');
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Грешка при свързване със сървъра');
    }
  };

  const openNotesDialog = (reading: Reading) => {
    setEditingReading(reading);
    setNotes(reading.notes || '');
    setShowNotesDialog(true);
  };

  const filteredDevices = selectedDeviceType && selectedDeviceType !== 'Входящ контрол'
    ? devices.filter(d => d.deviceType === selectedDeviceType)
    : [];

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

  // Show message if no establishments
  if (establishments.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 py-8">
          <div className="container mx-auto px-4 max-w-7xl">
            <Alert className="max-w-2xl mx-auto">
              <Building2 className="h-4 w-4" />
              <AlertTitle>Няма създадени заведения</AlertTitle>
              <AlertDescription>
                Моля първо създайте заведение в секцията "Справочници" преди да използвате дневниците.
              </AlertDescription>
              <Button
                onClick={() => router.push('/spravochnici')}
                className="mt-4"
              >
                Към Справочници
              </Button>
            </Alert>
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Дневници</h1>
            <p className="text-gray-600 mt-2">
              Управление на температурни дневници и входящ контрол
            </p>
          </div>

          {/* Establishment Selector */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Избор на заведение
              </CardTitle>
              <CardDescription>
                Изберете заведение за преглед на дневници
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedEstablishment?.id.toString()}
                onValueChange={(value) => {
                  const establishment = establishments.find(e => e.id === parseInt(value));
                  if (establishment) {
                    setSelectedEstablishment(establishment);
                    setSelectedDevice(null);
                  }
                }}
              >
                <SelectTrigger className="w-full md:w-96">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {establishments.map((est) => (
                    <SelectItem key={est.id} value={est.id.toString()}>
                      {est.companyName} ({est.establishmentType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedEstablishment && (
            <>
              {/* Combined Daily Export Button */}
              <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        📊 Дневен отчет - Всички дневници
                      </h3>
                      <p className="text-sm text-gray-600">
                        Експортирайте всички температурни дневници за <strong>{selectedEstablishment.companyName}</strong> като изображение (PNG/JPEG) в размер А4 за принтиране.
                      </p>
                    </div>
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <Input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-auto"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleExportAllDailyImage('png')}
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md flex-1 md:flex-initial"
                          disabled={devices.length === 0}
                        >
                          <FileImage className="w-4 h-4 mr-2" />
                          PNG
                        </Button>
                        <Button 
                          onClick={() => handleExportAllDailyImage('jpeg')}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex-1 md:flex-initial"
                          disabled={devices.length === 0}
                        >
                          <FileImage className="w-4 h-4 mr-2" />
                          JPEG
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Device Type Selector */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Избор на тип дневник</CardTitle>
                  <CardDescription>
                    Изберете типа дневник за преглед и управление
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {DEVICE_TYPES.map((type) => {
                      if (type.isLink && type.path) {
                        return (
                          <button
                            key={type.value}
                            onClick={() => router.push(type.path)}
                            className="p-4 border-2 rounded-lg transition-all border-gray-200 hover:border-blue-300"
                          >
                            <div className="flex items-center gap-2 font-semibold text-lg">
                              <UtensilsCrossed className="h-5 w-5 text-blue-600" />
                              {type.label}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">{type.range}</div>
                          </button>
                        );
                      }
                      
                      return (
                        <button
                          key={type.value}
                          onClick={() => {
                            setSelectedDeviceType(type.value);
                            if (type.value === 'Входящ контрол') {
                              setSelectedDevice(null);
                            }
                          }}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            selectedDeviceType === type.value
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="font-semibold text-lg">{type.label}</div>
                          <div className="text-sm text-gray-600 mt-1">{type.range}</div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Incoming Control Section */}
              {selectedDeviceType === 'Входящ контрол' && (
                <>
                  <Card className="mb-6">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Входящ контрол</CardTitle>
                          <CardDescription>
                            Управление на входящ контрол на суровини
                            <span className="block mt-1">Обект: <strong>{selectedEstablishment.companyName}</strong></span>
                          </CardDescription>
                        </div>
                        <Button onClick={() => setShowAddControlDialog(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Добави контрол
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <Label htmlFor="controlDate">Дата:</Label>
                        <Input
                          id="controlDate"
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-auto"
                        />
                      </div>

                      {loadingControls ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        </div>
                      ) : incomingControls.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p>Няма записи за избраната дата</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {incomingControls.map((control) => (
                            <Card key={control.id} className="overflow-hidden">
                              <div className="aspect-video relative">
                                <img
                                  src={control.imageUrl}
                                  alt="Входящ контрол"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <CardContent className="p-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Дата:</span>
                                    <span className="font-medium">{control.controlDate}</span>
                                  </div>
                                  {control.notes && (
                                    <div className="text-sm text-gray-600">
                                      <strong>Бележки:</strong> {control.notes}
                                    </div>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full mt-2"
                                    onClick={() => handleDeleteIncomingControl(control.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Изтрий
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Device Management - only show if NOT incoming control */}
              {selectedDeviceType && selectedDeviceType !== 'Входящ контрол' && (
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Устройства: {selectedDeviceType}</CardTitle>
                        <CardDescription>
                          Управление на устройства от избрания тип за {selectedEstablishment.companyName}
                        </CardDescription>
                      </div>
                      <Button onClick={() => setShowAddDeviceDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Добави устройство
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredDevices.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Няма добавени устройства. Използвайте бутона "Добави устройство" за да добавите.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredDevices.map((device) => (
                          <div
                            key={device.id}
                            className={`p-4 border-2 rounded-lg transition-all ${
                              selectedDevice?.id === device.id
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div 
                                className="flex-1 cursor-pointer"
                                onClick={() => setSelectedDevice(device)}
                              >
                                <div className="font-medium">{device.deviceName}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {device.minTemp}℃ до {device.maxTemp}℃
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDevice(device.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Temperature Readings - only show if device is selected */}
              {selectedDevice && selectedDeviceType !== 'Входящ контрол' && (
                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle>Температурни записи: {selectedDevice.deviceName}</CardTitle>
                        <CardDescription>
                          Преглед на дневни температурни записи - 10:00ч и 17:00ч (записите се генерират автоматично от системата)
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-600" />
                          <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-auto"
                          />
                        </div>
                        <Button onClick={() => handleExportImage('png')} variant="default" disabled={readings.length === 0}>
                          <FileImage className="w-4 h-4 mr-2" />
                          PNG
                        </Button>
                        <Button onClick={() => handleExportImage('jpeg')} variant="default" disabled={readings.length === 0}>
                          <FileImage className="w-4 h-4 mr-2" />
                          JPEG
                        </Button>
                        <Button onClick={handleExport} variant="outline" disabled={readings.length === 0}>
                          <Download className="w-4 h-4 mr-2" />
                          CSV
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingReadings ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      </div>
                    ) : readings.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>Няма записи за {selectedDate}. Записите за 10:00ч и 17:00ч се генерират автоматично при създаване на устройството.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Час</TableHead>
                              <TableHead>Температура</TableHead>
                              <TableHead>Бележки</TableHead>
                              <TableHead className="text-right">Действия</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {readings.map((reading) => (
                              <TableRow key={reading.id}>
                                <TableCell className="font-medium">
                                  {reading.hour.toString().padStart(2, '0')}:00
                                </TableCell>
                                <TableCell>
                                  <span className={`font-semibold ${
                                    reading.temperature < selectedDevice.minTemp || 
                                    reading.temperature > selectedDevice.maxTemp
                                      ? 'text-red-600'
                                      : 'text-green-600'
                                  }`}>
                                    {reading.temperature.toFixed(1)}℃
                                  </span>
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {reading.notes || '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openNotesDialog(reading)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>

      {/* Add Incoming Control Dialog */}
      <Dialog open={showAddControlDialog} onOpenChange={setShowAddControlDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Добавяне на входящ контрол</DialogTitle>
            <DialogDescription>
              Попълнете информацията за входящия контрол
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Обект</Label>
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="font-medium">{selectedEstablishment?.companyName}</div>
                <div className="text-sm text-gray-600">{selectedEstablishment?.establishmentType}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newControlDate">Дата на контрол *</Label>
              <Input
                id="newControlDate"
                type="date"
                value={newControl.controlDate}
                onChange={(e) => setNewControl({ ...newControl, controlDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUpload">Снимка *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="flex-1"
                />
                {uploadingImage && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
              {newControl.imageUrl && (
                <div className="mt-2">
                  <img
                    src={newControl.imageUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-md border"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="controlNotes">Бележки</Label>
              <textarea
                id="controlNotes"
                value={newControl.notes}
                onChange={(e) => setNewControl({ ...newControl, notes: e.target.value })}
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Добавете бележки..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleAddIncomingControl} disabled={!newControl.imageUrl}>
                Добави
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddControlDialog(false);
                  setNewControl({
                    controlDate: new Date().toISOString().split('T')[0],
                    imageUrl: '',
                    notes: '',
                  });
                }}
              >
                Откажи
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Device Dialog */}
      <Dialog open={showAddDeviceDialog} onOpenChange={setShowAddDeviceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавяне на устройство</DialogTitle>
            <DialogDescription>
              Въведете име за новото устройство
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Заведение</Label>
              <div className="text-sm text-gray-600">{selectedEstablishment?.companyName}</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deviceName">Име на устройството *</Label>
              <Input
                id="deviceName"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="напр. Фризер №1"
              />
            </div>
            <div className="space-y-2">
              <Label>Тип</Label>
              <div className="text-sm text-gray-600">{selectedDeviceType}</div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleAddDevice}>Добави</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDeviceDialog(false);
                  setNewDeviceName('');
                }}
              >
                Откажи
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактиране на бележка</DialogTitle>
            <DialogDescription>
              Добавете или редактирайте бележка за този запис
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editingReading && (
              <>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">Час</div>
                  <div className="font-medium">
                    {editingReading.hour.toString().padStart(2, '0')}:00
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">Температура</div>
                  <div className="font-medium">{editingReading.temperature.toFixed(1)}℃</div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">Бележки</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Въведете бележки..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleUpdateNotes}>Запази</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNotesDialog(false);
                  setEditingReading(null);
                  setNotes('');
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

export default function DnevnicziPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </main>
        <Footer />
      </div>
    }>
      <DnevnicziContent />
    </Suspense>
  );
}