import { PageHeader } from '@/components/shared/page-header';
import { AtsCheckerTool } from '@/components/ats-checker/ats-checker-tool';

export default function AtsCheckerPage() {
  return (
    <div className="space-y-8">
       <PageHeader
        title="ATS Checker"
        description="Analyze your resume against a job description and get AI-powered feedback."
      />
      <AtsCheckerTool />
    </div>
  );
}
