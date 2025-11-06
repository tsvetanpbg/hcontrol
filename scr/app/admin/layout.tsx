import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Администраторски панел',
  description: 'Администраторски панел за управление на системата.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}