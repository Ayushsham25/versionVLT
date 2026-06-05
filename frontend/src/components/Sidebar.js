'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Home, GitPullRequest, Tag, Settings, FolderGit2 } from 'lucide-react';

export default function Sidebar() {
  const params = useParams();
  const repoName = params?.repo || 'demo-repo';

  return (
    <aside className="w-64 border-r border-[#1F1F24] bg-[#111114] h-screen fixed top-0 left-0 flex flex-col">
      <div className="p-4 border-b border-[#1F1F24] font-bold text-xl text-white">
        VersionVLT
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/" className="flex items-center gap-3 p-2 hover:bg-[#1F1F24] rounded-md transition-colors">
          <Home size={18} /> Dashboard
        </Link>
        
        {params?.repo && (
          <>
            <div className="pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Repository
            </div>
            <Link href={`/${repoName}`} className="flex items-center gap-3 p-2 hover:bg-[#1F1F24] rounded-md transition-colors">
              <FolderGit2 size={18} /> Code
            </Link>
            <Link href={`/${repoName}/merges`} className="flex items-center gap-3 p-2 hover:bg-[#1F1F24] rounded-md transition-colors">
              <GitPullRequest size={18} /> Merges
            </Link>
            <Link href={`/${repoName}/tags`} className="flex items-center gap-3 p-2 hover:bg-[#1F1F24] rounded-md transition-colors">
              <Tag size={18} /> Tags & Releases
            </Link>
          </>
        )}
      </nav>
      <div className="p-4 border-t border-[#1F1F24]">
        <Link href="/settings" className="flex items-center gap-3 p-2 hover:bg-[#1F1F24] rounded-md transition-colors">
          <Settings size={18} /> Settings
        </Link>
      </div>
    </aside>
  );
}
