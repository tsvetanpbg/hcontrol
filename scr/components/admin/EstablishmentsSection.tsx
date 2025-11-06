"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ESTABLISHMENT_TYPES = [
  "Ресторант",
  "Кафе",
  "Бар",
  "Бързо хранене",
  "Сладкарница",
  "Други"
];

interface Establishment {
  id: number;
  userId: number;
  establishmentType: string;
  employeeCount: number;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  companyName: string;
  eik: string;
  registrationAddress: string;
  contactEmail: string;
  createdAt: string;
  updatedAt: string;
}

interface Personnel {
  id: number;
  establishmentId: number;
  fullName: string;
  egn: string;
  position: string;
  workBookImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function EstablishmentsSection() {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  
  // Filters
  const [searchCompanyName, setSearchCompanyName] = useState('');
  const [searchEik, setSearchEik] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // View details
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    loadEstablishments();
  }, [page]);

  const loadEstablishments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
      });

      if (searchCompanyName) params.append('companyName', searchCompanyName);
      if (searchEik) params.append('eik', searchEik);
      if (filterType && filterType !== 'all') params.append('establishmentType', filterType);

      const response = await fetch(`/api/admin/establishments?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEstablishments(data.establishments);
        setTotal(data.total);
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

  const handleSearch = () => {
    setPage(1);
    loadEstablishments();
  };

  const handleViewDetails = async (establishment: Establishment) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/admin/establishments/${establishment.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedEstablishment(data.establishment);
        setPersonnel(data.personnel);
        setShowDetailsDialog(true);
      } else {
        toast.error('Грешка при зареждане на детайлите');
      }
    } catch (error) {
      console.error('Error loading details:', error);
      toast.error('Грешка при свързване със сървъра');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Справочници - Заведения</CardTitle>
          <CardDescription>
            Преглед и управление на всички регистрирани заведения
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Име на фирма</Label>
              <Input
                placeholder="Търсене..."
                value={searchCompanyName}
                onChange={(e) => setSearchCompanyName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="space-y-2">
              <Label>ЕИК</Label>
              <Input
                placeholder="ЕИК..."
                value={searchEik}
                onChange={(e) => setSearchEik(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="space-y-2">
              <Label>Тип заведение</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Всички типове" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всички типове</SelectItem>
                  {ESTABLISHMENT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Търси
              </Button>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : establishments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Няма намерени заведения
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Фирма</TableHead>
                      <TableHead>ЕИК</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Управител</TableHead>
                      <TableHead>Брой служители</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {establishments.map((est) => (
                      <TableRow key={est.id}>
                        <TableCell className="font-medium">{est.id}</TableCell>
                        <TableCell>{est.companyName}</TableCell>
                        <TableCell>{est.eik}</TableCell>
                        <TableCell>{est.establishmentType}</TableCell>
                        <TableCell>{est.managerName}</TableCell>
                        <TableCell>{est.employeeCount}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(est)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Преглед
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Показани {(page - 1) * limit + 1} до {Math.min(page * limit, total)} от {total} заведения
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Детайли за заведение</DialogTitle>
            <DialogDescription>
              Пълна информация за заведението и неговия персонал
            </DialogDescription>
          </DialogHeader>
          {selectedEstablishment && (
            <div className="space-y-6">
              {/* Company Data */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Данни за фирмата</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Име на фирмата</div>
                    <div className="font-medium">{selectedEstablishment.companyName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">ЕИК</div>
                    <div className="font-medium">{selectedEstablishment.eik}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Тип заведение</div>
                    <div className="font-medium">{selectedEstablishment.establishmentType}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Брой служители</div>
                    <div className="font-medium">{selectedEstablishment.employeeCount}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-600">Адрес на регистрация</div>
                    <div className="font-medium">{selectedEstablishment.registrationAddress}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Имейл за контакт</div>
                    <div className="font-medium">{selectedEstablishment.contactEmail}</div>
                  </div>
                </div>
              </div>

              {/* Manager Data */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Управител</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Име и фамилия</div>
                    <div className="font-medium">{selectedEstablishment.managerName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Телефон</div>
                    <div className="font-medium">{selectedEstablishment.managerPhone}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-600">Имейл</div>
                    <div className="font-medium">{selectedEstablishment.managerEmail}</div>
                  </div>
                </div>
              </div>

              {/* Personnel */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Персонал ({personnel.length})</h3>
                {personnel.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    Няма добавени служители
                  </div>
                ) : (
                  <div className="space-y-3">
                    {personnel.map((person) => (
                      <div key={person.id} className="border rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm text-gray-600">Име</div>
                            <div className="font-medium">{person.fullName}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">ЕГН</div>
                            <div className="font-medium">{person.egn}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Длъжност</div>
                            <div className="font-medium">{person.position}</div>
                          </div>
                          {person.workBookImageUrl && (
                            <div className="col-span-3">
                              <div className="text-sm text-gray-600 mb-1">Трудова книжка</div>
                              <a
                                href={person.workBookImageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                Преглед на документа
                              </a>
                            </div>
                          )}
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