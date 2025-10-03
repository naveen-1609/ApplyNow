'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockResumes } from '@/lib/mock-data';
import { improveJobApplicationSuccessPredictions, ImproveJobApplicationSuccessPredictionsOutput } from '@/ai/flows/improve-job-application-success-predictions';
import { Wand2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export function AiPredictionTool() {
  const [jobDescription, setJobDescription] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(mockResumes[0]?.resume_id);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImproveJobApplicationSuccessPredictionsOutput | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const { toast } = useToast();

  const handlePredict = async () => {
    if (!jobDescription || !selectedResumeId) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide a job description and select a resume.",
      });
      return;
    }
    const selectedResume = mockResumes.find(r => r.resume_id === selectedResumeId);
    if (!selectedResume) return;

    setIsLoading(true);
    setResult(null);
    try {
        const prediction = await improveJobApplicationSuccessPredictions({
            jobDescription,
            resumeText: selectedResume.editable_text,
        });
        setResult(prediction);
        setIsResultOpen(true);
    } catch (error) {
        console.error("Prediction failed:", error);
        toast({
            variant: "destructive",
            title: "Prediction Failed",
            description: "Could not get a prediction. Please try again later.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="col-span-1 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="text-primary" />
            AI Success Predictor
          </CardTitle>
          <CardDescription>
            Paste a job description and select a resume to get an AI-powered
            prediction on your chances of success.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste the job description here..."
            className="min-h-40"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
          <Select onValueChange={setSelectedResumeId} defaultValue={selectedResumeId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a resume" />
            </SelectTrigger>
            <SelectContent>
              {mockResumes.map((resume) => (
                <SelectItem key={resume.resume_id} value={resume.resume_id}>
                  {resume.resume_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
        <CardFooter>
          <Button onClick={handlePredict} disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Predict Success'}
          </Button>
        </CardFooter>
      </Card>
      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>AI Prediction Result</DialogTitle>
                <DialogDescription>
                    Based on the provided job description and your resume.
                </DialogDescription>
            </DialogHeader>
            {result ? (
            <div className="space-y-4">
                <div>
                    <h3 className="font-semibold">Likelihood of Success</h3>
                    <p className="text-lg font-bold text-primary">{result.successLikelihood}</p>
                </div>
                <div>
                    <h3 className="font-semibold">Reasoning</h3>
                    <p className="text-sm text-muted-foreground">{result.reasoning}</p>
                </div>
            </div>
            ) : (
                <div className="space-y-4">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-20 w-full" />
                </div>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
