'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="h-16 border-b border-[#1F1F24] bg-[#111114] fixed top-0 w-full z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-bold text-xl text-white hover:text-gray-300 transition-colors">
          VersionVLT
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {!loading && (
          user ? (
            <div className="flex items-center gap-4 text-sm">
              <Link href="/profile" className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors">
                <div className="bg-[#1F1F24] p-1.5 rounded-full">
                  <UserIcon size={16} />
                </div>
                <span className="font-semibold">{user.username}</span>
              </Link>
              <button 
                onClick={logout}
                className="flex items-center gap-2 text-[#C55F00] hover:text-red-400 font-medium transition-colors border border-[#C55F00]/30 hover:bg-[#C55F00]/10 px-3 py-1.5 rounded-md"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm font-medium">
              <Link href="/login" className="text-[#FFFFFF] hover:text-white transition-colors">
                Sign in
              </Link>
              <Link href="/signup" className="border border-[#1F1F24] hover:border-gray-500 text-white px-3 py-1.5 rounded-md transition-colors">
                Sign up
              </Link>
            </div>
          )
        )}
      </div>
    </header>
  );
}
