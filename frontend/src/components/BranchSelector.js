'use client';
import { GitBranch, ChevronDown, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function BranchSelector({ serverPath }) {
  const [isOpen, setIsOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBranches = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/git/${serverPath}/branches`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        // data.all is an array of branch names, data.current is current branch
        setBranches(data.all || []);
        setCurrentBranch(data.current || 'main');
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serverPath) fetchBranches();
  }, [serverPath]);

  const handleCheckoutBranch = async (branch) => {
    if (branch === currentBranch) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/git/${serverPath}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ branchName: branch })
      });
      if (res.ok) {
        window.location.reload(); // Reload the whole page to refresh FileExplorer, StagingArea, DiffViewer
      } else {
        alert('Failed to switch branch');
      }
    } catch (err) {
      console.error('Failed to checkout branch:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/git/${serverPath}/branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ branchName: newBranchName })
      });
      if (res.ok) {
        window.location.reload(); // Reload the whole page after branching
      } else {
        alert('Failed to create branch');
      }
    } catch (err) {
      console.error('Failed to create branch:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm bg-[#1A1A1E] border border-[#1F1F24] px-3 py-1.5 rounded-md text-[#FFFFFF] hover:bg-[#1F1F24] transition-colors font-medium"
      >
        <GitBranch size={16} className="text-[#A0A0A0]" /> 
        {loading ? 'loading...' : currentBranch}
        <ChevronDown size={14} className="text-[#A0A0A0] ml-1" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-64 bg-[#111114] border border-[#1F1F24] rounded-md shadow-lg z-10 overflow-hidden">
          <div className="p-3 border-b border-[#1F1F24] text-xs font-semibold text-[#A0A0A0]">
            Switch branches/tags
          </div>
          <div className="p-2">
            <div className="flex items-center gap-2 mb-2">
              <input 
                type="text" 
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                placeholder="Find or create a branch..." 
                className="w-full bg-[#070708] border border-[#1F1F24] rounded-md px-3 py-1.5 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#17B7C8]"
              />
              {newBranchName && !branches.includes(newBranchName) && (
                <button onClick={handleCreateBranch} className="bg-[#5E6BFF] text-white p-1.5 rounded-md hover:bg-[#4D58E5]">
                  <Plus size={16} />
                </button>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto">
              {branches.map(branch => (
                <div 
                  key={branch} 
                  onClick={() => handleCheckoutBranch(branch)}
                  className={`px-3 py-2 text-sm cursor-pointer rounded-md flex items-center gap-2 ${branch === currentBranch ? 'bg-[#1F1F24] text-white font-medium' : 'text-[#FFFFFF] hover:bg-[#1A1A1E]'}`}
                >
                  <GitBranch size={14} className="opacity-70" /> {branch}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
