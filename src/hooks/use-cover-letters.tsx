'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-optimized-auth';
import { getCoverLetters, addCoverLetter, deleteCoverLetter, updateCoverLetter } from '@/lib/services/cover-letters';
import type { CoverLetter } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useCoverLetters() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    if (!user) {
      setCoverLetters([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getCoverLetters(user.uid);
      setCoverLetters(data);
    } catch (error) {
      console.error('Error fetching cover letters:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load cover letters.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [user]);

  const add = async (name: string, text: string, companyName?: string, jobTitle?: string) => {
    if (!user) {
      const error = new Error('User not authenticated');
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please sign in to save cover letters.',
      });
      throw error;
    }
    
    try {
      const id = await addCoverLetter(user.uid, name, text, companyName, jobTitle);
      await refetch();
      toast({
        title: 'Success',
        description: 'Cover letter added to directory successfully!',
      });
      return id;
    } catch (error: any) {
      console.error('Error adding cover letter:', error);
      const errorMessage = error?.message || 'Failed to save cover letter. Please try again.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      throw error;
    }
  };

  const remove = async (coverLetterId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await deleteCoverLetter(user.uid, coverLetterId);
      await refetch();
    } catch (error) {
      console.error('Error deleting cover letter:', error);
      throw error;
    }
  };

  const update = async (coverLetterId: string, newText: string, name?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await updateCoverLetter(user.uid, coverLetterId, newText, name);
      await refetch();
    } catch (error) {
      console.error('Error updating cover letter:', error);
      throw error;
    }
  };

  return {
    coverLetters,
    loading,
    refetch,
    add,
    remove,
    update,
  };
}

