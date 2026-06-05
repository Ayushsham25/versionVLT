'use client';
import { useState, useEffect } from 'react';
import { Clock, GitCommit, User } from 'lucide-react';

export default function CommitHistory({ serverPath }) {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/git/${serverPath}/log`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        // data.all contains the array of commit objects from simple-git
        setCommits(data.all || []);
      }
    } catch (err) {
      console.error('Failed to fetch commit history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serverPath) fetchHistory();
  }, [serverPath]);

  return (
    <div className="border border-[#1F1F24] rounded-md bg-[#111114] shadow-sm mb-6 mt-10">
      <div className="bg-[#1F1F24]/50 p-3 border-b border-[#1F1F24] font-medium text-[#FFFFFF] flex justify-between items-center">
        <span className="flex items-center gap-2"><Clock size={16} /> Commit History Timeline</span>
        <button onClick={fetchHistory} className="text-[#17B7C8] hover:underline text-xs normal-case">Refresh</button>
      </div>
      
      <div className="p-4">
        {loading ? (
          <div className="text-sm text-[#A0A0A0]">Loading commit history...</div>
        ) : commits.length === 0 ? (
          <div className="text-sm text-[#A0A0A0]">No commits yet.</div>
        ) : (
          <div className="relative border-l border-[#1F1F24] ml-3 space-y-6 pb-4">
            {commits.map((commit, idx) => (
              <div key={commit.hash} className="relative pl-6">
                {/* Timeline Dot */}
                <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-[#17B7C8] rounded-full ring-4 ring-[#111114]"></div>
                
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-[#FFFFFF]">{commit.message}</span>
                    <span className="text-xs font-mono text-[#A0A0A0] px-1.5 py-0.5 bg-[#1A1A1E] rounded border border-[#1F1F24]">
                      {commit.hash.substring(0, 7)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#A0A0A0]">
                    <span className="flex items-center gap-1"><User size={12} /> {commit.author_name}</span>
                    <span>{new Date(commit.date).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
