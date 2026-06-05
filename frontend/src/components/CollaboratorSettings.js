'use client';
import { useState, useEffect } from 'react';
import { Users, UserPlus, X } from 'lucide-react';

export default function CollaboratorSettings({ repoId }) {
    const [collaborators, setCollaborators] = useState([]);
    const [newUsername, setNewUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRepo();
    }, [repoId]);

    const fetchRepo = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/repos/${repoId}`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setCollaborators(data.collaborators || []);
            }
        } catch (err) {
            console.error('Failed to fetch collaborators');
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newUsername.trim()) return;
        setLoading(true);
        setError('');
        
        try {
            const res = await fetch(`http://localhost:5000/api/repos/${repoId}/collaborators`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username: newUsername.trim() })
            });
            
            const data = await res.json();
            if (res.ok) {
                setNewUsername('');
                fetchRepo();
            } else {
                setError(data.error || 'Failed to add collaborator');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (username) => {
        const confirm = window.confirm(`Remove ${username} from collaborators?`);
        if (!confirm) return;
        
        try {
            const res = await fetch(`http://localhost:5000/api/repos/${repoId}/collaborators/${username}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (res.ok) {
                fetchRepo();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to remove collaborator');
            }
        } catch (err) {
            alert('Network error');
        }
    };

    return (
        <div className="border border-[#1F1F24] rounded-md bg-[#111114] shadow-sm mb-6">
            <div className="bg-[#1A1A1E] p-3 border-b border-[#1F1F24] font-medium text-white flex items-center gap-2">
                <Users size={18} className="text-[#17B7C8]" />
                Manage Access
            </div>
            
            <div className="p-4">
                <form onSubmit={handleAdd} className="flex gap-3 mb-4">
                    <input 
                        type="text" 
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Invite user by username..." 
                        className="flex-1 bg-[#070708] border border-[#1F1F24] rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#5E6BFF] transition-colors"
                    />
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-[#5E6BFF] hover:bg-[#4D58E5] text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <UserPlus size={16} /> {loading ? 'Adding...' : 'Add'}
                    </button>
                </form>

                {error && <p className="text-[#C55F00] text-sm mb-4">{error}</p>}

                <div>
                    <h4 className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider mb-2">Current Collaborators</h4>
                    {collaborators.length === 0 ? (
                        <p className="text-sm text-[#A0A0A0] italic">No collaborators invited yet.</p>
                    ) : (
                        <ul className="divide-y divide-[#1F1F24] border border-[#1F1F24] rounded-md bg-[#070708]">
                            {collaborators.map(c => (
                                <li key={c._id} className="p-3 flex justify-between items-center hover:bg-[#1A1A1E] transition-colors">
                                    <span className="text-sm font-medium text-white">@{c.username}</span>
                                    <button 
                                        onClick={() => handleRemove(c.username)}
                                        className="text-[#A0A0A0] hover:text-[#C55F00] transition-colors"
                                        title="Remove collaborator"
                                    >
                                        <X size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
