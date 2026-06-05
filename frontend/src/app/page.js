'use client';
import { FolderGit2, Plus, Lock } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetch('http://localhost:5000/api/repos', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          setRepos(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch repos', err);
          setLoading(false);
        });
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  if (authLoading || loading) return <div className="text-white">Loading...</div>;

  if (!user) {
    return (
      <div className="text-center mt-20">
        <h1 className="text-3xl font-bold text-white mb-4">Welcome to VersionVLT</h1>
        <p className="text-[#A0A0A0] mb-8">Sign in to manage your Git repositories.</p>
        <Link href="/login" className="bg-[#5E6BFF] hover:bg-[#4D58E5] text-white px-6 py-2 rounded-md font-medium transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6 border-b border-[#1F1F24] pb-4">
        <h1 className="text-2xl font-bold text-white">Your Repositories</h1>
        <Link href="/new" className="bg-[#5E6BFF] hover:bg-[#4D58E5] text-white px-3 py-1.5 rounded-md font-medium flex items-center gap-2 text-sm transition-colors">
          <Plus size={16} /> New
        </Link>
      </div>
      
      {repos.length === 0 ? (
        <div className="text-center py-12 border border-[#1F1F24] border-dashed rounded-lg bg-[#111114]">
          <h2 className="text-xl font-semibold text-white mb-2">No repositories yet</h2>
          <p className="text-[#A0A0A0] mb-6">Create your first repository to get started.</p>
          <Link href="/new" className="bg-[#1A1A1E] border border-[#1F1F24] hover:bg-[#1F1F24] text-white px-4 py-2 rounded-md text-sm transition-colors">
            Create Repository
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repos.map(repo => (
            <Link href={`/${repo.name}?id=${repo._id}&serverPath=${repo.server_path}`} key={repo._id}>
              <div className="border border-[#1F1F24] bg-[#111114] p-5 rounded-lg hover:border-gray-500 transition-colors cursor-pointer h-full flex flex-col">
                <div className="flex items-center gap-2 text-[#17B7C8] font-semibold text-lg mb-2">
                  <FolderGit2 size={20} />
                  <span className="truncate">{repo.name}</span>
                  <span className="ml-auto text-xs px-2 py-0.5 border border-[#1F1F24] text-[#A0A0A0] rounded-full flex items-center gap-1">
                    {repo.isPrivate && <Lock size={10} />}
                    {repo.isPrivate ? 'Private' : 'Public'}
                  </span>
                </div>
                <p className="text-sm text-[#A0A0A0] mb-4 flex-1">{repo.description || 'No description provided.'}</p>
                <div className="flex items-center gap-4 text-xs text-[#A0A0A0]">
                  <span>Created {new Date(repo.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
