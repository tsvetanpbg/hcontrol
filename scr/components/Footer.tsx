import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">За нас</h3>
            <p className="text-gray-600 text-sm">
              „Х КОНТРОЛ БГ" е фирма с дългогодишен опит в предоставяне на консултантски услуги при разработването и внедряването на Технологична документация – НАССР (хасеп) системи.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Контакти</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <p>Email: office@hcontrol.bg</p>
              <p>Тел: (+359) 878 763 387</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Страници</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  Начало
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  За Нас
                </Link>
              </li>
              <li>
                <Link href="/spravochnici" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  Справочници
                </Link>
              </li>
              <li>
                <Link href="/dnevniczi" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  Дневници
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  Вход
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация</h3>
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} Х КОНТРОЛ БГ. Всички права запазени.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}