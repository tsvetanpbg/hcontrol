import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Справочници',
  description: 'Управлявайте информацията за вашите заведения, служители и технологична документация. ЕИК валидация и автоматизирани справочници.',
  keywords: [
    'справочници заведения',
    'управление персонал',
    'ЕИК валидация',
    'служители хранителен обект',
    'технологична документация',
    'НАССР справочници'
  ],
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: '/spravochnici',
  },
};

export default function SpravochniciLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}