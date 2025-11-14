'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { CoverLetterCard } from '@/components/cover-letters/cover-letter-card';
import { useAuth } from '@/hooks/use-optimized-auth';
import { useCoverLetters } from '@/hooks/use-cover-letters';
import { CompactFastLoader } from '@/components/ui/fast-loader';

export default function CoverLettersPage() {
  const { user } = useAuth();
  const { 
    coverLetters, 
    loading, 
    refetch, 
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
  
  const handleUpdateCoverLetter = async (coverLetterId: string, newText: string, name?: string) => {
    if (!user) return;
    
    try {
      await update(coverLetterId, newText, name);
    } catch(error) {
      console.error("Failed to update cover letter", error);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cover Letter Directory"
        description="Manage all your cover letters in one place."
      >
        <Button onClick={() => {/* Will be handled by card component */}} disabled>
          <PlusCircle className="mr-2" />
          Add Cover Letter
        </Button>
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
            />
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
          <h3 className="text-lg font-medium">No cover letters yet</h3>
          <p className="text-sm text-muted-foreground">
            Generate a cover letter from the ATS Checker page to get started.
          </p>
        </div>
      )}
    </div>
  );
}

