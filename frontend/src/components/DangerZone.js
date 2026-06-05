'use client';
import { AlertTriangle, GitMerge, RotateCcw, Trash2 } from 'lucide-react';

export default function DangerZone({ repoId, repoName }) {

  const handleDelete = async () => {
    const confirmDelete = window.confirm(`Are you absolutely sure you want to delete ${repoName}? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`http://localhost:5000/api/repos/${repoId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        window.location.href = '/';
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete repository');
      }
    } catch (err) {
      alert('Network error. Failed to delete.');
    }
  };

  return (
    <div className="border border-[#C55F00] rounded-md overflow-hidden bg-[#070708] mb-6">
      <div className="bg-[#C55F00]/10 p-4 border-b border-[#C55F00]/30 flex items-center gap-3">
        <AlertTriangle className="text-[#C55F00]" size={20} />
        <h3 className="text-[#C55F00] font-bold text-lg">Danger Zone</h3>
      </div>
      <div className="divide-y divide-[#1F1F24]">
        
        {/* Reset */}
        <div className="p-4 flex justify-between items-center hover:bg-[#111114] transition-colors">
          <div>
            <h4 className="text-white font-medium mb-1">Reset Commits</h4>
            <p className="text-sm text-[#A0A0A0]">Undo recent commits. A hard reset will wipe working tree changes.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1E] border border-[#C55F00]/50 text-[#C55F00] rounded-md hover:bg-[#C55F00] hover:text-white transition-colors text-sm font-medium">
            <RotateCcw size={16} /> Hard Reset
          </button>
        </div>

        {/* Revert */}
        <div className="p-4 flex justify-between items-center hover:bg-[#111114] transition-colors">
          <div>
            <h4 className="text-white font-medium mb-1">Revert Commit</h4>
            <p className="text-sm text-[#A0A0A0]">Create a new commit that undoes the changes of a previous commit.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1E] border border-[#1F1F24] text-white rounded-md hover:bg-[#1F1F24] transition-colors text-sm font-medium">
            <GitMerge size={16} /> Revert Latest
          </button>
        </div>

        {/* Delete */}
        <div className="p-4 flex justify-between items-center hover:bg-[#111114] transition-colors">
          <div>
            <h4 className="text-white font-medium mb-1">Delete Repository</h4>
            <p className="text-sm text-[#A0A0A0]">Permanently delete this repository and its git history from the server.</p>
          </div>
          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#C55F00] text-[#C55F00] rounded-md hover:bg-[#C55F00] hover:text-white transition-colors text-sm font-medium"
          >
            <Trash2 size={16} /> Delete Repo
          </button>
        </div>

      </div>
    </div>
  );
}
