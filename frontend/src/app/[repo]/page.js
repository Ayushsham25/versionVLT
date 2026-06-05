import { Clock } from 'lucide-react';
import FileExplorer from '@/components/FileExplorer';
import BranchSelector from '@/components/BranchSelector';
import StagingArea from '@/components/StagingArea';
import DiffViewer from '@/components/DiffViewer';
import DangerZone from '@/components/DangerZone';
import CommitHistory from '@/components/CommitHistory';
import CodeDropdown from '@/components/CodeDropdown';
import CollaboratorSettings from '@/components/CollaboratorSettings';

export default async function RepositoryView({ params, searchParams }) {
  // Fix Next.js dynamic params promise by awaiting it
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const repoName = resolvedParams?.repo || 'demo-repo';
  const repoId = resolvedSearchParams?.id;
  const serverPath = resolvedSearchParams?.serverPath || repoName;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-end mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          {repoName}
          <span className="text-xs px-2 py-0.5 border border-[#1F1F24] text-[#A0A0A0] rounded-full font-medium">Public</span>
        </h1>
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between mb-6 bg-[#111114] p-3 rounded-md border border-[#1F1F24]">
        <div className="flex items-center gap-4">
          <BranchSelector serverPath={serverPath} />
        </div>
        <div className="flex gap-2">
          <CodeDropdown serverPath={serverPath} repoId={repoId} />
        </div>
      </div>

      {/* File Explorer */}
      <FileExplorer repoName={repoName} serverPath={serverPath} />
      
      {/* Commit History Timeline */}
      <CommitHistory serverPath={serverPath} />
      
      <div className="my-10">
        <h2 className="text-xl font-bold text-white mb-4">Workspace & Staging</h2>
        {/* Staging Area */}
        <StagingArea serverPath={serverPath} />
        
        {/* Diff Viewer */}
        <DiffViewer serverPath={serverPath} />
      </div>

      <div className="mt-16">
        <h2 className="text-xl font-bold text-white mb-4">Repository Management</h2>
        
        {/* Collaborators */}
        <CollaboratorSettings repoId={repoId} />
        
        {/* Danger Zone */}
        <DangerZone repoId={repoId} repoName={repoName} serverPath={serverPath} />
      </div>
    </div>
  );
}
