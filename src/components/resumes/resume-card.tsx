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
import type { Resume } from '@/lib/types';
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
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

type ResumeCardProps = {
  resume: Resume;
  onDelete: (resumeId: string) => void;
  onSaveText: (resumeId: string, newText: string) => void;
};

export function ResumeCard({ resume, onDelete, onSaveText }: ResumeCardProps) {
    const { toast } = useToast();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editableText, setEditableText] = useState(resume.editable_text);
    
    const handleSaveChanges = () => {
        onSaveText(resume.resume_id, editableText);
        setIsEditOpen(false);
        toast({ title: "Resume text updated!" });
    };

    const confirmDelete = () => {
        onDelete(resume.resume_id);
        setIsDeleteOpen(false);
        toast({ title: "Resume deleted." });
    };

  return (
    <>
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start gap-4">
        <FileText className="mt-1 h-8 w-8 text-primary" />
        <div className="flex-1">
          <CardTitle className="text-base font-semibold leading-tight">{resume.resume_name}</CardTitle>
          <CardDescription>
            Added {formatDistanceToNow(resume.created_at, { addSuffix: true })}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Text
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => setIsDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {resume.editable_text}
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" asChild className="w-full">
            <a href={resume.file_url} target="_blank" rel="noopener noreferrer">View File</a>
        </Button>
      </CardFooter>
    </Card>

    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Edit Resume Text</DialogTitle>
                <DialogDescription>
                    This text is used by the AI to analyze your resume against job descriptions.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="resume-text" className="sr-only">Resume Text</Label>
                <Textarea id="resume-text" value={editableText} onChange={(e) => setEditableText(e.target.value)} className="min-h-[60vh] font-code" />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveChanges}>Save Changes</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    
    <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your resume and its associated file. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
