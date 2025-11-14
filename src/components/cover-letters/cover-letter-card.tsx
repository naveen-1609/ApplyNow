'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, FileText, Pencil, Trash2 } from 'lucide-react';
import type { CoverLetter } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

type CoverLetterCardProps = {
  coverLetter: CoverLetter;
  onDelete: (coverLetterId: string) => void;
  onSaveText: (coverLetterId: string, newText: string, name?: string) => void;
};

export function CoverLetterCard({ coverLetter, onDelete, onSaveText }: CoverLetterCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editText, setEditText] = useState(coverLetter.cover_letter_text);
  const [editName, setEditName] = useState(coverLetter.cover_letter_name);
  const { toast } = useToast();

  const handleSave = () => {
    if (!editText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cover letter text cannot be empty.',
      });
      return;
    }
    onSaveText(coverLetter.cover_letter_id, editText, editName);
    setIsEditOpen(false);
    toast({
      title: 'Success',
      description: 'Cover letter updated successfully.',
    });
  };

  const handleDelete = () => {
    onDelete(coverLetter.cover_letter_id);
    setIsDeleteOpen(false);
    toast({
      title: 'Deleted',
      description: 'Cover letter deleted successfully.',
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{coverLetter.cover_letter_name}</CardTitle>
              <CardDescription className="mt-1">
                {coverLetter.company_name && coverLetter.job_title 
                  ? `${coverLetter.company_name} - ${coverLetter.job_title}`
                  : coverLetter.company_name || coverLetter.job_title || 'General cover letter'}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setIsDeleteOpen(true)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{coverLetter.cover_letter_text.length} characters</span>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Created {formatDistanceToNow(coverLetter.created_at, { addSuffix: true })}
        </CardFooter>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Cover Letter</DialogTitle>
            <DialogDescription>
              Update your cover letter text and name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cover-letter-name">Name</Label>
              <Input
                id="cover-letter-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Cover letter name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover-letter-text">Cover Letter Text</Label>
              <Textarea
                id="cover-letter-text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Your cover letter content..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the cover letter
              "{coverLetter.cover_letter_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

