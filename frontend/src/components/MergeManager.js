'use client';
import { useState, useEffect } from 'react';
import { GitMerge, GitBranch, ArrowRight, Loader } from 'lucide-react';

export default function MergeManager({ serverPath }) {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState(false);
  const [sourceBranch, setSourceBranch] = useState('');
  const [targetBranch, setTargetBranch] = useState('');
  const [message, setMessage] = useState(null);

  const fetchBranches = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/git/${encodeURIComponent(serverPath)}/branches`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBranches(data.all || []);
        setTargetBranch(data.current);
        setSourceBranch(data.all.find(b => b !== data.current) || '');
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serverPath) {
      fetchBranches();
    }
  }, [serverPath]);

  const handleMerge = async () => {
    if (!sourceBranch || !targetBranch || sourceBranch === targetBranch) {
      setMessage({ type: 'error', text: 'Please select different source and target branches.' });
      return;
    }
    
    setMerging(true);
    setMessage(null);
    try {
      const res = await fetch(`http://localhost:5000/api/git/${encodeURIComponent(serverPath)}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fromBranch: sourceBranch, toBranch: targetBranch })
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Successfully merged ${sourceBranch} into ${targetBranch}.` });
        // Refresh page or trigger sibling component re-render ideally, but for now we just show success
      } else {
        setMessage({ type: 'error', text: data.error || 'Merge failed. There may be conflicts.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error occurred while merging.' });
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="border border-[#1F1F24] rounded-md bg-[#111114] shadow-sm p-5 mb-8">
      <div className="flex items-center gap-2 mb-6 border-b border-[#1F1F24] pb-4">
        <GitMerge className="text-[#5E6BFF]" size={24} />
        <h3 className="text-lg font-bold text-white">Merge Branches</h3>
      </div>
      
      {loading ? (
        <div className="text-sm text-[#A0A0A0] text-center py-4">Loading branches...</div>
      ) : branches.length < 2 ? (
        <div className="text-sm text-[#A0A0A0] text-center py-4">
          You need at least two branches to perform a merge.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-4 bg-[#070708] p-4 rounded-md border border-[#1F1F24]">
            
            {/* Source Branch */}
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-[#A0A0A0] mb-2 uppercase tracking-wider">Source Branch</label>
              <div className="relative">
                <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" size={16} />
                <select 
                  className="w-full bg-[#1A1A1E] text-white text-sm border border-[#1F1F24] rounded-md py-2 pl-9 pr-3 focus:outline-none focus:border-[#5E6BFF] appearance-none"
                  value={sourceBranch}
                  onChange={(e) => setSourceBranch(e.target.value)}
                >
                  <option value="" disabled>Select branch</option>
                  {branches.map(b => (
                    <option key={b} value={b} disabled={b === targetBranch}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <ArrowRight className="text-[#A0A0A0] hidden md:block mt-6" size={20} />

            {/* Target Branch */}
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-[#A0A0A0] mb-2 uppercase tracking-wider">Target Branch</label>
              <div className="relative">
                <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" size={16} />
                <select 
                  className="w-full bg-[#1A1A1E] text-white text-sm border border-[#1F1F24] rounded-md py-2 pl-9 pr-3 focus:outline-none focus:border-[#5E6BFF] appearance-none"
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                >
                  {branches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              {message && (
                <div className={`text-sm p-3 rounded-md border ${message.type === 'success' ? 'bg-[#102B1D] border-[#1D5E39] text-[#4ADE80]' : 'bg-[#3A141A] border-[#7A2733] text-[#F87171]'}`}>
                  {message.text}
                </div>
              )}
            </div>
            
            <button
              onClick={handleMerge}
              disabled={merging || !sourceBranch || sourceBranch === targetBranch}
              className="bg-[#5E6BFF] hover:bg-[#4D58E5] text-white font-medium py-2 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {merging ? <Loader className="animate-spin" size={18} /> : <GitMerge size={18} />}
              Merge Branches
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
