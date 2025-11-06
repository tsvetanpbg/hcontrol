"use client"

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Menu, X, ChevronDown, User, LogOut } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthUser, logout } from '@/lib/auth';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check auth status
    const checkAuth = () => {
      try {
        const currentUser = getAuthUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
          setIsAdmin(currentUser.role === 'admin');
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    };
    
    checkAuth();
    
    // Listen for storage changes (login/logout events)
    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab auth changes
    const handleAuthChange = () => {
      checkAuth();
    };
    
    window.addEventListener('auth-change', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('auth-change'));
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image 
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/logo-concept-1760425219928.png"
              alt="H CONTROL"
              width={180}
              height={50}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              Начало
            </Link>
            
            <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
              Табло
            </Link>
            
            <Link href="/about" className="text-gray-700 hover:text-blue-600 transition-colors">
              За Нас
            </Link>
            
            {/* Справочници Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Link href="/spravochnici" className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors">
                  Справочници
                  <ChevronDown className="w-4 h-4" />
                </Link>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/spravochnici?tab=establishments" className="cursor-pointer">
                    Данни на вашето заведение
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/spravochnici?tab=personnel" className="cursor-pointer">
                    Служители
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Дневници Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Link href="/dnevniczi" className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors">
                  Дневници
                  <ChevronDown className="w-4 h-4" />
                </Link>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/dnevniczi?type=Фризери" className="cursor-pointer">
                    Дневник Фризери
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dnevniczi?type=Хладилници" className="cursor-pointer">
                    Дневник Хладилници
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dnevniczi?type=Топли витрини" className="cursor-pointer">
                    Дневник Топли витрини
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dnevniczi/food" className="cursor-pointer">
                    Дневник Храни
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/template-cleaning" className="cursor-pointer">
                    Шаблон почистване
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/spravochnici/food" className="cursor-pointer">
                    Справочник храна
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/cleaning-log" className="cursor-pointer">
                    Дневник почистване
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Потребители Dropdown (Admin only) */}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Link href="/admin" className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors">
                    Потребители
                    <ChevronDown className="w-4 h-4" />
                  </Link>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      Всички потребители
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin?action=add" className="cursor-pointer">
                      Добави потребител
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Login/Profile Button - Animated */}
            <AnimatePresence mode="wait">
              {isAuthenticated ? (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="default" 
                        className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:shadow-lg"
                      >
                        <User className="w-4 h-4 mr-2" />
                        <span className="font-medium">{user?.name || 'Потребител'} – Профил</span>
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer">
                          <User className="w-4 h-4 mr-2" />
                          Моят профил
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleLogout}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Излез
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ) : (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="default" 
                        className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:shadow-lg"
                      >
                        <span className="font-medium">ВЛЕЗ / РЕГИСТРАЦИЯ</span>
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem asChild>
                        <Link href="/login-admin" className="cursor-pointer">
                          Влез като администратор
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/login" className="cursor-pointer">
                          Влез като потребител
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/register" className="cursor-pointer">
                          Регистрирай се
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              )}
            </AnimatePresence>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Начало
              </Link>
              
              <Link 
                href="/dashboard" 
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Табло
              </Link>
              
              <Link 
                href="/about" 
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                За Нас
              </Link>
              
              {/* Mobile Справочници */}
              <div className="space-y-2">
                <Link 
                  href="/spravochnici" 
                  className="text-gray-700 hover:text-blue-600 transition-colors font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Справочници
                </Link>
                <Link 
                  href="/spravochnici?tab=establishments" 
                  className="block pl-4 text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Данни на вашето заведение
                </Link>
                <Link 
                  href="/spravochnici?tab=personnel" 
                  className="block pl-4 text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Служители
                </Link>
              </div>

              {/* Mobile Дневници */}
              <div className="space-y-2">
                <Link 
                  href="/dnevniczi" 
                  className="text-gray-700 hover:text-blue-600 transition-colors font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Дневници
                </Link>
                <Link 
                  href="/dnevniczi?type=Фризери" 
                  className="block pl-4 text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Дневник Фризери
                </Link>
                <Link 
                  href="/dnevniczi?type=Хладилници" 
                  className="block pl-4 text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Дневник Хладилници
                </Link>
                <Link 
                  href="/dnevniczi?type=Топли витрини" 
                  className="block pl-4 text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Дневник Топли витрини
                </Link>
                <Link 
                  href="/dnevniczi/food" 
                  className="block pl-4 text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Дневник Храни
                </Link>
                <div className="border-t border-gray-200 my-2"></div>
                <Link 
                  href="/template-cleaning" 
                  className="block pl-4 text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Шаблон почистване
                </Link>
                <Link 
                  href="/spravochnici/food" 
                  className="block pl-4 text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Справочник храна
                </Link>
                <Link 
                  href="/cleaning-log" 
                  className="block pl-4 text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Дневник почистване
                </Link>
              </div>

              {/* Mobile Потребители (Admin only) */}
              {isAdmin && (
                <div className="space-y-2">
                  <Link 
                    href="/admin" 
                    className="text-gray-700 hover:text-blue-600 transition-colors font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Потребители
                  </Link>
                  <Link 
                    href="/admin?action=add" 
                    className="block pl-4 text-gray-700 hover:text-blue-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Добави потребител
                  </Link>
                </div>
              )}

              {/* Mobile Login/Profile Section */}
              <div className="pt-2 border-t border-gray-200">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 mb-2">
                      <User className="w-4 h-4" />
                      {user?.name || 'Потребител'} – Профил
                    </div>
                    <Link 
                      href="/dashboard" 
                      className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Моят профил
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left py-2 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      Излез
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-semibold text-gray-500 mb-2">ВЛЕЗ / РЕГИСТРАЦИЯ</div>
                    <Link 
                      href="/login-admin" 
                      className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Влез като администратор
                    </Link>
                    <Link 
                      href="/login" 
                      className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Влез като потребител
                    </Link>
                    <div className="border-t border-gray-200 my-2"></div>
                    <Link 
                      href="/register" 
                      className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Регистрирай се
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}