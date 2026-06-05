import MergeManager from '@/components/MergeManager';
import CommitHistory from '@/components/CommitHistory';
import BranchSelector from '@/components/BranchSelector';
import { GitPullRequest } from 'lucide-react';

export default async function MergesPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const repoName = resolvedParams?.repo || 'demo-repo';
  const serverPath = resolvedSearchParams?.serverPath || repoName;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-end mb-6 border-b border-[#1F1F24] pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <GitPullRequest className="text-[#5E6BFF]" />
          Merges & Commits - {repoName}
        </h1>
      </div>

      {/* Control Bar for Context */}
      <div className="flex items-center justify-between mb-8 bg-[#111114] p-3 rounded-md border border-[#1F1F24]">
        <div className="flex items-center gap-4">
          <BranchSelector serverPath={serverPath} />
        </div>
        <div className="text-xs text-[#A0A0A0]">
          Active branch context
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Merge Manager UI */}
        <section>
          <MergeManager serverPath={serverPath} />
        </section>

        {/* Commit History showing all merges and commits */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Repository History</h2>
          <CommitHistory serverPath={serverPath} />
        </section>
      </div>
    </div>
  );
}
