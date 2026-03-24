'use client';

import { PageHeader } from '@/components/shared/page-header';
import { AtsCheckerTool } from '@/components/ats-checker/ats-checker-tool';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSubscription } from '@/hooks/use-subscription';
import { Lock } from 'lucide-react';

export default function AtsCheckerPage() {
  const { canUseAIFeatures, loading } = useSubscription();

  return (
    <div className="space-y-8">
       <PageHeader
        title="ATS Checker"
        description="Analyze your resume against a job description and get AI-powered feedback."
      />
      {!loading && !canUseAIFeatures ? (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>AI access required</AlertTitle>
          <AlertDescription>
            Your account is set to `records_only`. Ask the workspace admin to upgrade your permissions to `ai_features` if you need ATS analysis.
          </AlertDescription>
        </Alert>
      ) : (
        <AtsCheckerTool />
      )}
    </div>
  );
}
