import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Табло',
  description: 'Личен профил с преглед на вашия обект, дневници, температурни записи и управление на акаунта.',
  keywords: [
    'потребителски профил',
    'управление акаунт',
    'преглед дневници',
    'dashboard'
  ],
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/dashboard',
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}