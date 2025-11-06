import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Target, Users, Award } from 'lucide-react';

export const metadata = {
  title: 'За Нас - Х КОНТРОЛ БГ | Професионални консултантски услуги за НАССР системи',
  description: 'Х КОНТРОЛ БГ предлага дългогодишен опит в разработването и внедряването на Технологична документация и НАССР (хасеп) системи за хранителни обекти в България.',
  keywords: 'НАССР, хасеп, хранителна безопасност, консултантски услуги, технологична документация, България'
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-50 to-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                За Х КОНТРОЛ БГ
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Вашият надежден партньор за внедряване на НАССР системи и осигуряване на хранителна безопасност
              </p>
            </div>
          </div>
        </section>

        {/* Main Content with Image */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
                <div>
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 text-lg leading-relaxed mb-6">
                      <strong>„Х КОНТРОЛ БГ"</strong> е водеща консултантска фирма с дългогодишен опит в предоставяне на професионални услуги при разработването и внедряването на Технологична документация и <strong>НАССР (HACCP - хасеп)</strong> системи в хранително-вкусовата промишленост.
                    </p>
                    
                    <p className="text-gray-700 text-lg leading-relaxed">
                      Нашият екип от квалифицирани специалисти помага на хранителни обекти, ресторанти, заведения, кухни и производствени предприятия да постигнат пълно съответствие с изискванията за хранителна безопасност и да внедрят ефективни системи за контрол на качеството.
                    </p>
                  </div>
                </div>
                <div className="relative h-[400px] rounded-lg overflow-hidden shadow-xl">
                  <Image
                    src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/cacf8ee5-417d-485c-82be-11674f36ce9d/generated_images/professional-food-safety-consultation-sc-0848a2b9-20251014070400.jpg"
                    alt="Професионална консултация за хранителна безопасност"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Mission & Vision Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-2 border-blue-100">
                  <CardHeader>
                    <Target className="w-12 h-12 text-blue-600 mb-4" />
                    <CardTitle className="text-2xl">Нашата мисия</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Да предоставяме висококачествени консултантски услуги, които гарантират безопасността на храните и помагат на нашите клиенти да отговорят на най-високите стандарти в индустрията.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-blue-100">
                  <CardHeader>
                    <Award className="w-12 h-12 text-blue-600 mb-4" />
                    <CardTitle className="text-2xl">Нашата визия</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Да бъдем водещият партньор за хранителна безопасност в България, признат за професионализъм, експертиза и отдаденост към качеството.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section with Image */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                Нашите услуги
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
                <div className="relative h-[400px] rounded-lg overflow-hidden shadow-xl order-2 lg:order-1">
                  <Image
                    src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/cacf8ee5-417d-485c-82be-11674f36ce9d/generated_images/modern-restaurant-kitchen-with-food-safe-8cdc396e-20251014070413.jpg"
                    alt="Модерна ресторантска кухня с оборудване за хранителна безопасност"
                    fill
                    className="object-cover"
                  />
                </div>
                
                <div className="order-1 lg:order-2">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex gap-4">
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Разработка на НАССР системи</h3>
                        <p className="text-gray-600">Професионално проектиране и внедряване на системи за контрол на критичните точки</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Технологична документация</h3>
                        <p className="text-gray-600">Изготвяне на пълен комплект технологична документация според изискванията</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Обучение на персонал</h3>
                        <p className="text-gray-600">Провеждане на специализирани обучения за хранителна безопасност и хигиена</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Одити и проверки</h3>
                        <p className="text-gray-600">Редовни одити и проверки за поддържане на съответствие със стандартите</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Консултантски услуги</h3>
                        <p className="text-gray-600">Експертни консултации по всички въпроси свързани с хранителната безопасност</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Мониторинг и контрол</h3>
                        <p className="text-gray-600">Внедряване на системи за автоматичен мониторинг на температурни режими</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section with Team Image */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                Защо да изберете нас?
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
                <div className="space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" />
                        Опитен екип от специалисти
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Нашият екип се състои от квалифицирани експерти с дългогодишен опит в областта на хранителната безопасност и НАССР системите. Всеки проект се подхожда с максимална професионалност и внимание към детайла.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <Award className="w-8 h-8 text-blue-600" />
                        Доказана експертиза
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        С години успешно реализирани проекти в различни сектори на хранително-вкусовата промишленост, ние сме доказали нашата способност да предоставяме надеждни и ефективни решения.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <CheckCircle2 className="w-8 h-8 text-blue-600" />
                        Индивидуален подход
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Разбираме, че всеки обект е уникален със своите специфични нужди. Затова предлагаме персонализирани решения, адаптирани към конкретните изисквания на вашия бизнес.
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="relative h-[500px] rounded-lg overflow-hidden shadow-xl">
                  <Image
                    src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/cacf8ee5-417d-485c-82be-11674f36ce9d/generated_images/professional-team-of-food-safety-experts-826bef81-20251014070406.jpg"
                    alt="Професионален екип от специалисти по хранителна безопасност"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Нуждаете се от професионална консултация?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Свържете се с нас днес и ще ви помогнем да внедрите НАССР система в съответствие с най-високите стандарти
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="text-lg px-8">
                <a href="mailto:office@hcontrol.bg">Свържете се с нас</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
                <a href="tel:+359878763387">Обадете се: (+359) 878 763 387</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}