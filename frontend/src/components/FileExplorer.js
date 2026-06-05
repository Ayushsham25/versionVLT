'use client';
import { useState, useEffect } from 'react';
import { File, Folder, X, Save } from 'lucide-react';

export default function FileExplorer({ repoName, serverPath }) {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingFile, setEditingFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const fetchFiles = async (path = '') => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/git/${serverPath}/files?path=${encodeURIComponent(path)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFiles(data.tree || []);
        setCurrentPath(path);
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serverPath) {
      fetchFiles('');
    }
  }, [serverPath]);

  const handleItemClick = async (item) => {
    if (item.type === 'folder') {
      fetchFiles(item.path);
    } else {
      // Load file content
      try {
        const res = await fetch(`http://localhost:5000/api/git/${serverPath}/files/content?path=${encodeURIComponent(item.path)}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setFileContent(data.content || '');
          setEditingFile(item);
        }
      } catch (err) {
        console.error('Failed to load file:', err);
      }
    }
  };

  const handleSaveFile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/api/git/${serverPath}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ path: editingFile.path, content: fileContent })
      });
      if (res.ok) {
        setEditingFile(null);
      } else {
        alert('Failed to save file');
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const uploadWithProgress = (url, formData) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.withCredentials = true; // equivalent to credentials: 'include'

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(true);
        } else {
          resolve(false);
        }
      };

      xhr.onerror = () => reject(new Error(`Network error - the server might have closed the connection. Check if the folder is too large (e.g. contains node_modules). Status: ${xhr.status}`));
      xhr.send(formData);
    });
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', currentPath);
    
    e.target.value = '';
    setUploadProgress(0);

    try {
      const success = await uploadWithProgress(`http://localhost:5000/api/git/${encodeURIComponent(serverPath)}/upload`, formData);
      if (success) {
        fetchFiles(currentPath); // refresh directory
      } else {
        alert('Failed to upload file');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('An error occurred during file upload: ' + err.message);
    } finally {
      setUploadProgress(null);
    }
  };

  const handleUploadFolder = async (e) => {
    try {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const formData = new FormData();
      const paths = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const relativePath = file.webkitRelativePath || file.name;
        
        // Skip heavy or hidden directories that crash the upload
        if (relativePath.includes('node_modules/') || relativePath.includes('.git/') || relativePath.includes('.next/')) {
          continue;
        }

        formData.append('files', file);
        paths.push(relativePath);
      }
      
      if (paths.length === 0) {
        alert('No valid files to upload (node_modules and .git are ignored).');
        return;
      }
      
      formData.append('paths', JSON.stringify(paths));
      formData.append('currentPath', currentPath);

      e.target.value = '';
      setUploadProgress(0);

      const success = await uploadWithProgress(`http://localhost:5000/api/git/${encodeURIComponent(serverPath)}/upload-folder`, formData);
      
      if (success) {
        fetchFiles(currentPath); // refresh directory
      } else {
        alert('Failed to upload folder');
      }
    } catch (err) {
      console.error('Folder upload error:', err);
      alert('An error occurred while preparing the folder for upload.');
    } finally {
      setUploadProgress(null);
    }
  };

  const navigateUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    fetchFiles(parts.join('/'));
  };

  return (
    <div className="border border-[#1F1F24] rounded-md bg-[#111114] overflow-hidden shadow-sm">
      {/* Progress Bar overlay */}
      {uploadProgress !== null && (
        <div className="bg-[#1A1A1E] p-3 border-b border-[#1F1F24]">
          <div className="flex justify-between text-xs text-[#FFFFFF] mb-1">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-[#070708] rounded-full h-2 overflow-hidden border border-[#1F1F24]">
            <div 
              className="bg-[#5E6BFF] h-2 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      <div className="bg-[#1F1F24]/50 p-3 flex justify-between items-center text-sm font-medium border-b border-[#1F1F24]">
        <div className="flex items-center gap-3 text-[#FFFFFF]">
          <span className="font-semibold">{repoName}</span>
          <span className="text-[#A0A0A0]">/ {currentPath}</span>
        </div>
        {!editingFile && (
          <div className="flex gap-2">
            <label className="cursor-pointer px-3 py-1 text-xs rounded-md bg-[#5E6BFF] text-white hover:bg-[#4D58E5] flex items-center gap-1 transition-colors">
              Upload File
              <input type="file" className="hidden" onChange={handleUploadFile} />
            </label>
            <label className="cursor-pointer px-3 py-1 text-xs rounded-md bg-[#5E6BFF] text-white hover:bg-[#4D58E5] flex items-center gap-1 transition-colors">
              Upload Folder
              <input type="file" className="hidden" webkitdirectory="true" multiple onChange={handleUploadFolder} />
            </label>
          </div>
        )}
        {editingFile && (
          <div className="flex gap-2">
            <button onClick={() => setEditingFile(null)} className="px-3 py-1 text-xs rounded-md bg-[#1A1A1E] text-[#FFFFFF] border border-[#1F1F24] hover:bg-[#1F1F24] flex items-center gap-1">
              <X size={14} /> Close
            </button>
            <button onClick={handleSaveFile} disabled={saving} className="px-3 py-1 text-xs rounded-md bg-[#5E6BFF] text-white hover:bg-[#4D58E5] flex items-center gap-1">
              <Save size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
      
      {editingFile ? (
        <div className="p-4">
          <textarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            className="w-full h-64 bg-[#070708] border border-[#1F1F24] rounded-md p-3 text-sm font-mono text-[#FFFFFF] focus:outline-none focus:border-[#17B7C8]"
          />
        </div>
      ) : (
        <div className="divide-y divide-[#1F1F24]">
          {currentPath && (
            <div onClick={navigateUp} className="flex items-center p-3 hover:bg-[#1A1A1E] transition-colors text-sm cursor-pointer text-[#A0A0A0]">
              .. (Up a directory)
            </div>
          )}
          {loading ? (
            <div className="p-4 text-center text-[#A0A0A0] text-sm">Loading files...</div>
          ) : files.length === 0 ? (
            <div className="p-4 text-center text-[#A0A0A0] text-sm">This directory is empty.</div>
          ) : (
            files.map((file, idx) => (
              <div key={idx} onClick={() => handleItemClick(file)} className="flex items-center p-3 hover:bg-[#1A1A1E] transition-colors text-sm group cursor-pointer">
                <div className="flex items-center gap-3 flex-1">
                  {file.type === 'folder' ? <Folder size={18} className="text-[#17B7C8]" /> : <File size={18} className="text-[#A0A0A0]" />}
                  <span className="text-[#FFFFFF] group-hover:text-[#17B7C8]">{file.name}</span>
                </div>
                <div className="w-32 text-right text-[#A0A0A0]">{new Date(file.modified).toLocaleDateString()}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
