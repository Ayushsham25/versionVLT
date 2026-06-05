'use client';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function ClientLayout({ children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  // Render sidebar only if user is authenticated and not on login/signup pages
  const showSidebar = user && !isAuthPage;

  return (
    <>
      <Navbar />
      <div className="flex flex-1 pt-16">
        {showSidebar && <Sidebar />}
        <main className={`${showSidebar ? 'ml-64' : 'mx-auto max-w-7xl w-full'} flex-1 p-8 min-h-screen`}>
          {children}
        </main>
      </div>
    </>
  );
}
