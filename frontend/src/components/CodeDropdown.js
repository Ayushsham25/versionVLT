"use client";
import { useState, useRef, useEffect } from 'react';
import { Download, Link, Copy, Check, CloudUpload, CloudDownload, Loader } from 'lucide-react';

export default function CodeDropdown({ serverPath, repoId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const dropdownRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const handleCopy = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLocalDownload = () => {
        window.open(`http://localhost:5000/api/git/${encodeURIComponent(serverPath)}/download`, '_blank');
        setIsOpen(false);
    };

    const handleCloudSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch(`http://localhost:5000/api/repos/${repoId}/cloud/sync`, {
                method: 'POST',
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to sync');
            alert('Repository successfully backed up to cloud!');
        } catch (err) {
            alert('Failed to sync to cloud. Check credentials.');
        } finally {
            setSyncing(false);
        }
    };

    const handleCloudDownload = async () => {
        setDownloading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/repos/${repoId}/cloud/download`, {
                credentials: 'include'
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch download link');
            }
            const data = await res.json();
            window.open(data.downloadUrl, '_blank');
        } catch (err) {
            alert(err.message);
        } finally {
            setDownloading(false);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="text-sm font-medium text-white bg-[#5E6BFF] hover:bg-[#4D58E5] px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
            >
                Code ▼
            </button>
            
            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#111114] border border-[#1F1F24] rounded-md shadow-lg z-50 overflow-hidden">
                    <div className="p-3 border-b border-[#1F1F24]">
                        <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                            <Link size={16} /> Share Repository Link
                        </h4>
                        <div className="flex bg-[#070708] border border-[#1F1F24] rounded overflow-hidden">
                            <input 
                                type="text" 
                                readOnly 
                                value={typeof window !== 'undefined' ? window.location.href : ''} 
                                className="bg-transparent text-xs text-[#A0A0A0] px-2 py-1.5 w-full outline-none"
                            />
                            <button 
                                onClick={handleCopy}
                                className="bg-[#1F1F24] hover:bg-[#30363d] px-3 flex items-center justify-center transition-colors"
                            >
                                {copied ? <Check size={14} className="text-[#17B7C8]" /> : <Copy size={14} className="text-[#A0A0A0]" />}
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-2 border-b border-[#1F1F24]">
                        <h4 className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider mb-2 px-2">Local Server</h4>
                        <button 
                            onClick={handleLocalDownload}
                            className="w-full text-left px-2 py-2 text-sm text-white hover:bg-[#1A1A1E] rounded flex items-center gap-2 transition-colors"
                        >
                            <Download size={16} /> Download ZIP
                        </button>
                    </div>

                    <div className="p-2">
                        <h4 className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider mb-2 px-2 flex items-center gap-1">
                            AWS Cloud Storage
                        </h4>
                        <button 
                            onClick={handleCloudSync}
                            disabled={syncing}
                            className="w-full text-left px-2 py-2 text-sm text-[#17B7C8] hover:bg-[#1A1A1E] rounded flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {syncing ? <Loader size={16} className="animate-spin" /> : <CloudUpload size={16} />}
                            Sync to Cloud
                        </button>
                        <button 
                            onClick={handleCloudDownload}
                            disabled={downloading}
                            className="w-full text-left px-2 py-2 text-sm text-white hover:bg-[#1A1A1E] rounded flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {downloading ? <Loader size={16} className="animate-spin" /> : <CloudDownload size={16} />}
                            Download from Cloud
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
