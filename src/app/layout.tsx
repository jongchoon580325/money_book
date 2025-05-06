import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import FireworkProvider from '@/components/animations/FireworkProvider';

export const metadata: Metadata = {
  title: '스마트 재무관리',
  description: '당신의 재무를 스마트하게 관리하세요.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-[#41416e] min-h-screen flex flex-col">
        <FireworkProvider />
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
