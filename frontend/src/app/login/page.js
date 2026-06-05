'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      
      // On success, redirect to dashboard
      window.location.href = '/';
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] flex flex-col items-center pt-20">
      <div className="mb-6 font-bold text-2xl text-white">
        VersionVLT
      </div>
      
      <div className="bg-[#111114] border border-[#1F1F24] rounded-md p-6 w-full max-w-sm shadow-md">
        <h1 className="text-xl font-semibold text-white text-center mb-4">Sign in to VersionVLT</h1>
        
        {error && (
          <div className="bg-[#C55F00]/10 border border-[#C55F00]/50 text-[#C55F00] p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#FFFFFF] mb-1">Email address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#070708] border border-[#1F1F24] rounded-md px-3 py-1.5 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#17B7C8] focus:ring-1 focus:ring-[#17B7C8]"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-[#FFFFFF]">Password</label>
              <a href="#" className="text-xs text-[#17B7C8] hover:underline">Forgot password?</a>
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#070708] border border-[#1F1F24] rounded-md px-3 py-1.5 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#17B7C8] focus:ring-1 focus:ring-[#17B7C8]"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-[#5E6BFF] hover:bg-[#4D58E5] text-white font-medium py-1.5 rounded-md transition-colors text-sm mt-2"
          >
            Sign in
          </button>
        </form>
      </div>

      <div className="mt-4 border border-[#1F1F24] rounded-md p-4 w-full max-w-sm text-center text-sm text-[#FFFFFF]">
        New to VersionVLT? <Link href="/signup" className="text-[#17B7C8] hover:underline">Create an account</Link>.
      </div>
    </div>
  );
}
