import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Вход в системата',
  description: 'Влезте в личния си профил за достъп до дневници, температурни записи и управление на вашия хранителен обект.',
  keywords: [
    'вход система',
    'login',
    'потребителски профил',
    'достъп дневници',
    'НАССР система вход'
  ],
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: '/login',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}