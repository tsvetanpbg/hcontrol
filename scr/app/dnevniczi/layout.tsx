import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Дневници',
  description: 'Автоматични дневници за проследяване на температурите на хладилници, фризери и топли витрини. Експорт на отчети в PDF и Excel формат.',
  keywords: [
    'температурен дневник',
    'мониторинг хладилници',
    'контрол фризери',
    'автоматичен дневник',
    'температурни записи',
    'НАССР дневник',
    'експорт отчети'
  ],
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: '/dnevniczi',
  },
};

export default function DnevnicziLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}