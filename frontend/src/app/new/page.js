'use client';
import { useState } from 'react';
import { Book, Lock, Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function NewRepository() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, description, isPrivate })
      });

      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to create repository');
        setLoading(false);
        return;
      }

      // Redirect to the newly created repo dashboard
      window.location.href = `/${data.repo.name}?id=${data.repo._id}&serverPath=${data.repo.server_path}`;
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  if (!user) return <div className="text-white">Please log in to create a repository.</div>;

  return (
    <div className="max-w-3xl mx-auto pt-8">
      <div className="border-b border-[#1F1F24] pb-6 mb-6">
        <h1 className="text-2xl font-semibold text-white mb-2">Create a new repository</h1>
        <p className="text-[#A0A0A0] text-sm">
          A repository contains all project files, including the revision history. Already have a project repository elsewhere?
        </p>
      </div>

      {error && (
        <div className="bg-[#C55F00]/10 border border-[#C55F00]/50 text-[#C55F00] p-3 rounded-md text-sm mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-end gap-2">
          <div>
            <label className="block text-sm font-medium text-[#FFFFFF] mb-2">Owner</label>
            <div className="bg-[#1A1A1E] border border-[#1F1F24] rounded-md px-3 py-1.5 flex items-center gap-2 text-[#FFFFFF] cursor-not-allowed">
              <Book size={16} className="text-[#A0A0A0]" />
              {user.username}
            </div>
          </div>
          <span className="text-2xl text-[#A0A0A0] mb-1">/</span>
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#FFFFFF] mb-2">Repository name <span className="text-[#C55F00]">*</span></label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))} // Basic valid git name filter
              className="w-1/2 bg-[#070708] border border-[#1F1F24] rounded-md px-3 py-1.5 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#17B7C8] focus:ring-1 focus:ring-[#17B7C8]"
            />
          </div>
        </div>
        <p className="text-xs text-[#A0A0A0]">Great repository names are short and memorable.</p>

        <div className="border-t border-[#1F1F24] pt-6">
          <label className="block text-sm font-medium text-[#FFFFFF] mb-2">Description <span className="text-[#A0A0A0] font-normal">(optional)</span></label>
          <input 
            type="text" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#070708] border border-[#1F1F24] rounded-md px-3 py-1.5 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#17B7C8] focus:ring-1 focus:ring-[#17B7C8]"
          />
        </div>

        <div className="border-t border-[#1F1F24] pt-6 space-y-4">
          <div className="flex items-start gap-3">
            <input 
              type="radio" 
              id="public" 
              name="visibility" 
              checked={!isPrivate} 
              onChange={() => setIsPrivate(false)}
              className="mt-1"
            />
            <div>
              <label htmlFor="public" className="flex items-center gap-2 text-white font-medium cursor-pointer">
                <Globe size={18} className="text-[#A0A0A0]" /> Public
              </label>
              <p className="text-xs text-[#A0A0A0]">Anyone on the internet can see this repository. You choose who can commit.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <input 
              type="radio" 
              id="private" 
              name="visibility" 
              checked={isPrivate} 
              onChange={() => setIsPrivate(true)}
              className="mt-1"
            />
            <div>
              <label htmlFor="private" className="flex items-center gap-2 text-white font-medium cursor-pointer">
                <Lock size={18} className="text-[#d2a8ff]" /> Private
              </label>
              <p className="text-xs text-[#A0A0A0]">You choose who can see and commit to this repository.</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#1F1F24] pt-6">
          <button 
            type="submit" 
            disabled={loading || !name}
            className="bg-[#5E6BFF] hover:bg-[#4D58E5] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-1.5 px-4 rounded-md transition-colors text-sm"
          >
            {loading ? 'Creating...' : 'Create repository'}
          </button>
        </div>
      </form>
    </div>
  );
}
