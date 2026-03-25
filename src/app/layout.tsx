// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Source_Serif_4 } from 'next/font/google';
import Navigation from '@/components/Navigation';
import { Toaster } from '@/components/ui/toaster';
import FooterWrapper from '@/components/FooterWrapper';
import Providers from '@/components/Providers';
import { GlobalErrorBoundary } from '@/components/error-boundary/GlobalErrorBoundary';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { AutoSchema } from '@/components/AutoSchema';
import ScrollToTop from '@/components/ScrollToTop';

// Load Source Serif 4 from Google Fonts for headings
const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
});

// Load Open Sans locally for body
const openSans = localFont({
  src: [
    {
      path: '../../public/fonts/opensans-400.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/opensans-600.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/opensans-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-open-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Quantum Computing Business Applications | Case Studies & Related Content - OpenQase',
  description: 'Discover how quantum computing solves real business problems. Access industry case studies and related content organized by role and industry to understand practical applications without technical complexity.',
  keywords: ['quantum computing business applications', 'quantum algorithms', 'quantum case studies', 'business quantum solutions', 'quantum computing industry'],
  metadataBase: new URL('https://openqase.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Quantum Computing Business Applications | OpenQase',
    description: 'Real-world quantum computing case studies and learning paths for business decision-makers',
    type: 'website',
    locale: 'en_US',
    url: 'https://openqase.com',
    siteName: 'OpenQase',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OpenQase - Quantum Computing Business Cases',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quantum Computing Business Applications | OpenQase',
    description: 'Real-world quantum computing case studies and learning paths for business decision-makers',
    images: ['/og-image.png'],
    creator: '@openqase',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sourceSerif4.variable} ${openSans.variable}`}>
      <body className="min-h-screen antialiased">
        {/* Ghost-style automatic schema - invisible to content creators */}
        <AutoSchema type="organization" />
        
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navigation />
            <main className="flex-grow">
              <GlobalErrorBoundary>
                {children}
              </GlobalErrorBoundary>
            </main>
            {/* Footer is only shown on non-admin routes */}
            <FooterWrapper />
          </div>
          <Toaster />
          <ScrollToTop />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}