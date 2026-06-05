'use client';
import { useState, useEffect } from 'react';

export default function DiffViewer({ serverPath }) {
  const [viewMode, setViewMode] = useState('split');
  const [diffText, setDiffText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDiff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/git/${serverPath}/diff`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDiffText(data.diff || '');
      }
    } catch (err) {
      console.error('Failed to fetch diff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serverPath) fetchDiff();
  }, [serverPath]);

  // Parse raw unified diff into a simple array of lines for display
  const parsedDiff = [];
  if (diffText) {
    const lines = diffText.split('\n');
    for (let line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        parsedDiff.push({ type: 'addition', text: line });
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        parsedDiff.push({ type: 'deletion', text: line });
      } else if (line.startsWith('@@')) {
        parsedDiff.push({ type: 'header', text: line });
      } else if (line.startsWith('diff --git')) {
        parsedDiff.push({ type: 'file', text: line });
      } else {
        parsedDiff.push({ type: 'unchanged', text: line });
      }
    }
  }

  return (
    <div className="border border-[#1F1F24] rounded-md bg-[#070708] overflow-hidden shadow-sm mb-6">
      <div className="bg-[#111114] p-3 border-b border-[#1F1F24] flex justify-between items-center text-sm font-medium">
        <span className="text-[#FFFFFF] flex items-center gap-4">
          Local Changes
          <button onClick={fetchDiff} className="text-[#17B7C8] hover:underline text-xs normal-case">Refresh</button>
        </span>
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode('unified')}
            className={`px-3 py-1 rounded-md text-xs border transition-colors ${viewMode === 'unified' ? 'bg-[#1F1F24] text-white border-transparent' : 'border-[#1F1F24] text-[#A0A0A0] hover:text-white'}`}
          >
            Unified
          </button>
        </div>
      </div>
      
      <div className="font-mono text-sm leading-relaxed overflow-x-auto p-2">
        {loading ? (
          <div className="p-4 text-[#A0A0A0]">Loading diff...</div>
        ) : parsedDiff.length === 0 ? (
          <div className="p-4 text-[#A0A0A0]">No uncommitted changes.</div>
        ) : (
          parsedDiff.map((line, idx) => (
            <div key={idx} className={`flex w-full ${
              line.type === 'addition' ? 'bg-[#4D58E5]/15 text-[#7ee787]' : 
              line.type === 'deletion' ? 'bg-[#C55F00]/15 text-[#ff7b72]' : 
              line.type === 'header' ? 'bg-[#388bfd]/15 text-[#79c0ff]' :
              line.type === 'file' ? 'font-bold text-[#FFFFFF] mt-4 mb-2' :
              'text-[#A0A0A0] hover:bg-[#111114]'
            }`}>
              <div className="whitespace-pre pl-4 py-0.5 flex-1">
                {line.text}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
