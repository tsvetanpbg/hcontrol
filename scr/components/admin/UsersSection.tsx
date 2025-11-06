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
import { Loader2, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Users, Shield, User, CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserData {
  id: number;
  email: string;
  role: string;
  managerName: string;
  profileImageUrl: string | null;
  isActive: number;
  createdAt: string;
}

const ROLES = [
  { value: 'admin', label: 'Администратор', icon: Shield },
  { value: 'moderator', label: 'Модератор', icon: Users },
  { value: 'user', label: 'Потребител', icon: User },
];

export default function UsersSection() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  
  // Filters
  const [filterRole, setFilterRole] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [filterActive, setFilterActive] = useState('');
  
  // Add/Edit Dialog
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [page, filterRole, filterActive]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
      });

      if (filterRole) params.append('role', filterRole);
      if (searchEmail) params.append('search', searchEmail);
      if (filterActive) params.append('isActive', filterActive);

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotal(data.total);
      } else {
        toast.error('Грешка при зареждане на потребителите');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Грешка при свързване със сървъра');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadUsers();
  };

  const handleToggleActive = async (userId: number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    
    // Optimistic UI update - update local state immediately
    setUsers(prevUsers => 
      prevUsers.map(u => 
        u.id === userId ? { ...u, isActive: newStatus } : u
      )
    );
    
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/admin/users/${userId}/activate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (response.ok) {
        toast.success(newStatus === 1 ? 'Потребителят е активиран' : 'Потребителят е деактивиран');
        // Refresh data from server to ensure consistency
        loadUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Грешка при промяна на статус');
        // Rollback optimistic update on error
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === userId ? { ...u, isActive: currentStatus } : u
          )
        );
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Грешка при свързване със сървъра');
      // Rollback optimistic update on error
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, isActive: currentStatus } : u
        )
      );
    }
  };

  const openAddDialog = () => {
    setEditingUser(null);
    setFormData({ email: '', password: '', role: 'user' });
    setShowDialog(true);
  };

  const openEditDialog = (user: UserData) => {
    setEditingUser(user);
    setFormData({ email: user.email, password: '', role: user.role });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.email.trim()) {
      toast.error('Моля въведете имейл');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      toast.error('Моля въведете парола');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      toast.error('Паролата трябва да е поне 6 символа');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const url = editingUser 
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users';
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const body: any = {
        email: formData.email.trim(),
        role: formData.role,
      };

      if (formData.password.trim()) {
        body.password = formData.password.trim();
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingUser ? 'Потребителят е актуализиран' : 'Потребителят е създаден');
        setShowDialog(false);
        loadUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Грешка при запазване');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Грешка при свързване със сървъра');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете този потребител?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Потребителят е изтрит');
        loadUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Грешка при изтриване');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Грешка при свързване със сървъра');
    }
  };

  const getRoleLabel = (role: string) => {
    const roleData = ROLES.find(r => r.value === role);
    return roleData?.label || role;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'moderator':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Управление на потребители</CardTitle>
              <CardDescription>
                Преглед и управление на всички регистрирани потребители и техните роли
              </CardDescription>
            </div>
            <Button onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Добави потребител
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Търсене по имейл</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Търси..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} variant="outline">
                  Търси
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Филтър по роля</Label>
              <Select value={filterRole || undefined} onValueChange={(value) => {
                setFilterRole(value || '');
                setPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Всички роли" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filterRole && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setFilterRole('');
                    setPage(1);
                  }}
                  className="w-full"
                >
                  Изчисти филтър
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Филтър по статус</Label>
              <Select value={filterActive || undefined} onValueChange={(value) => {
                setFilterActive(value || '');
                setPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Всички статуси" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Активни</SelectItem>
                  <SelectItem value="0">Неактивни</SelectItem>
                </SelectContent>
              </Select>
              {filterActive && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setFilterActive('');
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
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Няма намерени потребители
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Снимка</TableHead>
                      <TableHead>Управител</TableHead>
                      <TableHead>Имейл</TableHead>
                      <TableHead>Роля</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Регистриран на</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>
                          {user.profileImageUrl ? (
                            <img 
                              src={user.profileImageUrl} 
                              alt={user.managerName}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-500" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{user.managerName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {user.isActive === 1 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                              <CheckCircle className="w-3 h-3" />
                              Активен
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                              <XCircle className="w-3 h-3" />
                              Неактивен
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString('bg-BG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant={user.isActive === 1 ? "outline" : "default"}
                              onClick={() => handleToggleActive(user.id, user.isActive)}
                              className={user.isActive === 1 ? "" : "bg-green-600 hover:bg-green-700"}
                            >
                              {user.isActive === 1 ? (
                                <>
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Деактивирай
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Активирай
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(user.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Показани {(page - 1) * limit + 1} до {Math.min(page * limit, total)} от {total} потребители
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

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Редактиране на потребител' : 'Добавяне на потребител'}
            </DialogTitle>
            <DialogDescription>
              {editingUser 
                ? 'Редактирайте информацията за потребителя' 
                : 'Въведете данните за новия потребител'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Имейл *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">
                Парола {editingUser ? '(оставете празно за да запазите сегашната)' : '*'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? 'Нова парола' : 'Парола'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Роля *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => {
                    const Icon = role.icon;
                    return (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {role.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <strong>Забележка:</strong> Ролите определят нивото на достъп:
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li><strong>Администратор:</strong> Пълен достъп до всички функции</li>
                <li><strong>Модератор:</strong> Може да преглежда и редактира съдържание</li>
                <li><strong>Потребител:</strong> Стандартен достъп</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Запазване...
                  </>
                ) : (
                  editingUser ? 'Актуализирай' : 'Създай'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setEditingUser(null);
                  setFormData({ email: '', password: '', role: 'user' });
                }}
                disabled={submitting}
              >
                Откажи
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}