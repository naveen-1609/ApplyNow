'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { CoverLetterCard } from '@/components/cover-letters/cover-letter-card';
import { useAuth } from '@/hooks/use-optimized-auth';
import { useCoverLetters } from '@/hooks/use-cover-letters';
import { CompactFastLoader } from '@/components/ui/fast-loader';
import { AddCoverLetterDialog } from '@/components/cover-letters/add-cover-letter-dialog';
import { logger } from '@/lib/utils/logger';

export default function CoverLettersPage() {
  const { user } = useAuth();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const { 
    coverLetters, 
    loading, 
    add,
    remove,
    update,
  } = useCoverLetters();
  
  const handleDeleteCoverLetter = async (coverLetterId: string) => {
    if (!user) return;
    
    try {
      await remove(coverLetterId);
    } catch (error) {
      console.error("Failed to delete cover letter", error);
    }
  };
  
  const handleUpdateCoverLetter = async (
    coverLetterId: string,
    newText: string,
    name?: string,
    options?: { additionalTemplateVariables?: string[] }
  ) => {
    if (!user) return;
    
    try {
      await update(coverLetterId, newText, name, options);
    } catch(error) {
      logger.warn('Failed to update cover letter', error);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cover Letter Directory"
        description="Manage your cover letters and reusable templates in one place. Upload PDF or DOCX files, detect {{ variables }}, and generate tailored versions for each role."
      >
        {
          <Button onClick={() => setIsImportDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Import Cover Letter
          </Button>
        }
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12">
          <CompactFastLoader />
        </div>
      ) : coverLetters.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {coverLetters.map((coverLetter) => (
            <CoverLetterCard 
              key={coverLetter.cover_letter_id} 
              coverLetter={coverLetter} 
              onDelete={handleDeleteCoverLetter}
              onSaveText={handleUpdateCoverLetter}
              onCreateCoverLetter={add}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
          <h3 className="text-lg font-medium">No cover letters yet</h3>
          <p className="text-sm text-muted-foreground">
            Import a PDF or DOCX sample, or add a reusable template with `{{ variables }}` to get started.
          </p>
        </div>
      )}

      <AddCoverLetterDialog
        isOpen={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onSave={add}
      />
    </div>
  );
}
