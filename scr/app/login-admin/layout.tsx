import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Администраторски вход',
  description: 'Вход за администратори на системата.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}