import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";

export const metadata: Metadata = {
  title: {
    default: "Х КОНТРОЛ БГ - Система за мониторинг и НАССР контрол на хранителни обекти",
    template: "%s | Х КОНТРОЛ БГ"
  },
  description: "Професионална платформа за регистрация и автоматично проследяване на температурни записи за ресторанти, заведения, кафенета и хранителни обекти. НАССР системи и технологична документация.",
  keywords: [
    "НАССР",
    "хасеп",
    "HACCP",
    "температурен контрол",
    "хранителна безопасност",
    "мониторинг температура",
    "дневници хранителни обекти",
    "ресторанти България",
    "заведения контрол",
    "хладилници мониторинг",
    "технологична документация",
    "консултантски услуги НАССР",
    "Х КОНТРОЛ БГ",
    "автоматичен дневник",
    "температурни записи"
  ],
  authors: [{ name: "Х КОНТРОЛ БГ" }],
  creator: "Х КОНТРОЛ БГ",
  publisher: "Х КОНТРОЛ БГ",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://hcontrol.bg'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'bg_BG',
    url: 'https://hcontrol.bg',
    title: 'Х КОНТРОЛ БГ - Система за мониторинг и НАССР контрол',
    description: 'Професионална платформа за регистрация и автоматично проследяване на температурни записи за ресторанти и хранителни обекти в България.',
    siteName: 'Х КОНТРОЛ БГ',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Х КОНТРОЛ БГ - Система за мониторинг и НАССР контрол',
    description: 'Професионална платформа за регистрация и автоматично проследяване на температурни записи за ресторанти и хранителни обекти.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Х КОНТРОЛ БГ',
    description: 'Професионални консултантски услуги за НАССР системи и технологична документация',
    url: 'https://hcontrol.bg',
    logo: 'https://hcontrol.bg/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+359-878-763-387',
      email: 'office@hcontrol.bg',
      contactType: 'customer service',
      areaServed: 'BG',
      availableLanguage: 'Bulgarian'
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'BG'
    },
    sameAs: [
      // Add social media links when available
    ]
  };

  return (
    <html lang="bg">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        {children}
        <VisualEditsMessenger />
      </body>
    </html>
  );
}