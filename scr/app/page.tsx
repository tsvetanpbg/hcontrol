"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, FileText, Shield, Clock } from 'lucide-react';
import { getAuthToken, getAuthUser, isAdmin } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = getAuthToken();
    const user = getAuthUser();

    if (token && user) {
      // If regular user (not admin), redirect to dashboard
      if (!isAdmin()) {
        router.push('/dashboard');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-50 to-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Професионални решения за НАССР системи и хранителна безопасност
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                „Х КОНТРОЛ БГ" предлага консултантски услуги при разработването и внедряването на Технологична документация и НАССР (хасеп) системи за вашия хранителен обект.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8">
                  <Link href="/register">Регистрирай обект</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg px-8">
                  <Link href="/about">Научете повече</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Основни функционалности
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Link href="/register">
                <Card className="border-2 hover:border-blue-500 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <ClipboardList className="w-12 h-12 text-blue-600 mb-4" />
                    <CardTitle>Регистрация</CardTitle>
                    <CardDescription>
                      Бърза и лесна регистрация на вашия хранителен обект с всички необходими данни
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/dnevniczi">
                <Card className="border-2 hover:border-blue-500 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <Clock className="w-12 h-12 text-blue-600 mb-4" />
                    <CardTitle>Автоматичен дневник</CardTitle>
                    <CardDescription>
                      Автоматично записване на температурни данни за всички регистрирани устройства
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/dnevniczi">
                <Card className="border-2 hover:border-blue-500 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <FileText className="w-12 h-12 text-blue-600 mb-4" />
                    <CardTitle>Отчети</CardTitle>
                    <CardDescription>
                      Експорт на дневни, седмични и месечни отчети в PDF или Excel формат
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/about">
                <Card className="border-2 hover:border-blue-500 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <Shield className="w-12 h-12 text-blue-600 mb-4" />
                    <CardTitle>Сигурност</CardTitle>
                    <CardDescription>
                      Защитени данни с модерна система за автентикация и криптиране
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
                Как работи системата?
              </h2>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">1</span>
                      Регистрация на обект
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Попълнете формата с данни за вашия обект - име, тип, адрес, брой хладилници, фризери и други съоръжения.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">2</span>
                      Автоматично проследяване
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Системата автоматично генерира дневни записи с температури в зададените диапазони за всяко устройство.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">3</span>
                      Преглед и експорт
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Прегледайте дневните записи, генерирайте отчети и ги експортирайте за архивиране или проверки.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Готови ли сте да започнете?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Регистрирайте вашия обект днес и започнете автоматичното проследяване на температурните режими
            </p>
            <Button asChild size="lg" variant="secondary" className="text-lg px-8">
              <Link href="/register">Регистрирай се сега</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}