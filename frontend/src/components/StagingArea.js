'use client';
import { useState, useEffect } from 'react';
import { CheckSquare, Square, GitCommit } from 'lucide-react';

export default function StagingArea({ serverPath }) {
  const [stagedFiles, setStagedFiles] = useState([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [modifiedFiles, setModifiedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/git/${serverPath}/status`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        // simple-git status object contains 'files' array, plus arrays like modified, not_added, deleted, etc.
        const allChanges = data.files ? data.files.map(f => f.path) : [];
        setModifiedFiles(allChanges);
        // By default, let's auto-stage everything for convenience if we want, or keep it empty
        setStagedFiles([]);
      }
    } catch (err) {
      console.error('Failed to fetch git status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serverPath) fetchStatus();
  }, [serverPath]);

  const toggleStage = (file) => {
    setStagedFiles(prev => 
      prev.includes(file) ? prev.filter(f => f !== file) : [...prev, file]
    );
  };

  const handleSelectAll = () => {
    if (stagedFiles.length === modifiedFiles.length && modifiedFiles.length > 0) {
      setStagedFiles([]);
    } else {
      setStagedFiles([...modifiedFiles]);
    }
  };

  const handleCommit = async () => {
    setCommitting(true);
    try {
      // 1. Add staged files
      await fetch(`http://localhost:5000/api/git/${serverPath}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ files: stagedFiles })
      });

      // 2. Commit
      const res = await fetch(`http://localhost:5000/api/git/${serverPath}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: commitMessage })
      });

      if (res.ok) {
        setCommitMessage('');
        fetchStatus(); // Refresh status after commit
      } else {
        alert('Commit failed');
      }
    } catch (err) {
      console.error('Failed to commit:', err);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="border border-[#1F1F24] rounded-md bg-[#111114] shadow-sm mb-6">
      <div className="bg-[#1F1F24]/50 p-3 border-b border-[#1F1F24] font-medium text-[#FFFFFF] flex justify-between items-center">
        <span>Staging Area & Committing</span>
        <span className="text-xs text-[#A0A0A0]">{stagedFiles.length} files staged</span>
      </div>
      
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Files List */}
        <div>
          <h3 className="text-sm font-semibold text-[#A0A0A0] uppercase tracking-wider mb-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span>Modified Files</span>
              {modifiedFiles.length > 0 && (
                <button 
                  onClick={handleSelectAll} 
                  className="text-[#17B7C8] hover:underline text-xs normal-case cursor-pointer font-medium"
                >
                  {stagedFiles.length === modifiedFiles.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
            <button onClick={fetchStatus} className="text-[#17B7C8] hover:underline text-xs normal-case">Refresh</button>
          </h3>
          <div className="space-y-1">
            {loading ? (
              <div className="text-sm text-[#A0A0A0]">Loading status...</div>
            ) : modifiedFiles.length === 0 ? (
              <div className="text-sm text-[#A0A0A0]">Working tree clean. No changes.</div>
            ) : (
              modifiedFiles.map((file) => (
                <div 
                  key={file} 
                  onClick={() => toggleStage(file)}
                  className="flex items-center gap-3 p-2 hover:bg-[#1A1A1E] rounded-md cursor-pointer transition-colors text-sm text-[#FFFFFF]"
                >
                  {stagedFiles.includes(file) ? (
                    <CheckSquare size={16} className="text-[#4D58E5]" />
                  ) : (
                    <Square size={16} className="text-[#A0A0A0]" />
                  )}
                  <span className={stagedFiles.includes(file) ? 'text-[#FFFFFF]' : 'text-[#A0A0A0]'}>{file}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Commit Box */}
        <div className="flex flex-col border-l border-[#1F1F24] pl-6">
          <h3 className="text-sm font-semibold text-[#A0A0A0] uppercase tracking-wider mb-3">Create Commit</h3>
          <textarea 
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message..."
            className="w-full bg-[#070708] border border-[#1F1F24] rounded-md p-3 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#17B7C8] focus:ring-1 focus:ring-[#17B7C8] min-h-[100px] mb-3"
          />
          <button 
            onClick={handleCommit}
            disabled={stagedFiles.length === 0 || !commitMessage || committing}
            className="bg-[#5E6BFF] hover:bg-[#4D58E5] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors"
          >
            <GitCommit size={16} /> {committing ? 'Committing...' : 'Commit Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
