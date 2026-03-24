'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { analyzeResume, chatWithResumeAssistant, AtsAnalysisOutput, ChatInput } from '@/ai/flows/ats-checker-flow';
import { AlertCircle, Bot, Briefcase, Gauge, RotateCcw, Send, ShieldCheck, Sparkles, Target, TrendingUp, User as UserIcon } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { useOptimizedResumes } from '@/hooks/use-optimized-resumes';
import { useAuth } from '@/hooks/use-optimized-auth';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { AtsChatMessage, AtsStoredSession, clearAtsSession, getDefaultAtsSession, hydrateAtsSession, persistAtsSession } from '@/lib/state/ats-session-store';


type ChatMessage = AtsChatMessage;

type CoverageStatus = 'found' | 'partial' | 'missing';

type CoverageItem = {
  label: string;
  status: CoverageStatus;
  evidence: string[];
};

const QUICK_PROMPTS = [
  'What responsibilities from this job am I not proving strongly enough?',
  'Which missing skills should I prioritize adding to my resume?',
  'Rewrite one of my bullets to better match this role.',
];

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function overlapScore(a: string, b: string) {
  const aTokens = new Set(tokenize(a));
  const bTokens = new Set(tokenize(b));

  if (aTokens.size === 0 || bTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.min(aTokens.size, bTokens.size);
}

function findEvidence(label: string, pool: string[]) {
  return pool.filter((item) => overlapScore(label, item) >= 0.34);
}

function buildCoverageItems(items: string[], result: AtsAnalysisOutput, source: 'skills' | 'responsibilities'): CoverageItem[] {
  const uniqueItems = Array.from(new Set(items.filter(Boolean)));

  return uniqueItems.map((label) => {
    const foundEvidence = findEvidence(label, result.resume_fit.found);
    if (foundEvidence.length > 0) {
      return { label, status: 'found', evidence: foundEvidence };
    }

    const partialEvidence = findEvidence(label, result.resume_fit.partial);
    if (partialEvidence.length > 0) {
      return { label, status: 'partial', evidence: partialEvidence };
    }

    const missingEvidence = findEvidence(label, result.resume_fit.missing);
    if (missingEvidence.length > 0) {
      return { label, status: 'missing', evidence: missingEvidence };
    }

    if (source === 'skills') {
      return { label, status: 'missing', evidence: ['This skill is expected by the job description but not strongly evidenced in the resume.'] };
    }

    return { label, status: 'partial', evidence: ['Responsibility alignment is not explicit enough in the current resume wording.'] };
  });
}

function safeText(value: unknown, fallback: string) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || fallback;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return fallback;
}

function limitItems(items: string[] | undefined, limit: number, fallback: string) {
  if (!items || items.length === 0) {
    return [fallback];
  }

  return items.slice(0, limit);
}

export function AtsCheckerTool() {
  const { resumes, refetch } = useOptimizedResumes();
  const { user, loading: authLoading } = useAuth();
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [result, setResult] = useState<AtsAnalysisOutput | null>(null);
  const { toast } = useToast();
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const latestSessionRef = useRef<AtsStoredSession>(getDefaultAtsSession());

  useLayoutEffect(() => {
    const restored = hydrateAtsSession();
    if (restored.ownerUid && user?.uid && restored.ownerUid !== user.uid) {
      clearAtsSession();
      setIsSessionLoaded(true);
      return;
    }
    setJobDescription(restored.jobDescription);
    setSelectedResumeId(restored.selectedResumeId);
    setResult(restored.result);
    setChatHistory(restored.chatHistory);
    setIsSessionLoaded(true);
  }, [user?.uid]);

  // Set default resume when resumes are loaded
  useEffect(() => {
    if (!isSessionLoaded) {
      return;
    }

    if (resumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(resumes[0].resume_id);
    }
    
    // Debug: Log all resumes when they load
    if (resumes.length > 0) {
      console.log('📚 ATS Checker: Resumes loaded:', resumes.map(r => ({
        id: r.resume_id,
        name: r.resume_name,
        hasText: !!r.editable_text && r.editable_text.length > 0,
        textLength: r.editable_text?.length || 0
      })));
    }
  }, [isSessionLoaded, resumes, selectedResumeId]);

  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      clearAnalysis();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!isSessionLoaded) {
      return;
    }

    const session = {
      jobDescription,
      selectedResumeId,
      result,
      chatHistory,
      ownerUid: user?.uid,
    };
    latestSessionRef.current = session;
    persistAtsSession(session);
  }, [chatHistory, isSessionLoaded, jobDescription, result, selectedResumeId, user?.uid]);

  useEffect(() => {
    return () => {
      persistAtsSession(latestSessionRef.current);
    };
  }, []);

  // Add initial helpful message when ATS analysis is completed
  useEffect(() => {
    if (result && chatHistory.length === 0) {
      const initialMessage: ChatMessage = {
        role: 'model',
        content: `Hi! I've analyzed your resume and found it has an ATS score of ${result.ats_match_score}/100. I can help you improve specific areas like:

• **Skills & Tools** (${result.subscores.skills_tools}/100) - ${result.subscores.skills_tools < 70 ? 'Needs improvement' : 'Good'}
• **Responsibilities** (${result.subscores.responsibilities}/100) - ${result.subscores.responsibilities < 70 ? 'Needs improvement' : 'Good'}
• **Formatting** (${result.subscores.formatting_ats}/100) - ${result.subscores.formatting_ats < 70 ? 'Needs improvement' : 'Good'}

Ask me anything about improving your resume! For example:
- "How can I improve my skills section?"
- "What keywords should I add?"
- "Help me rewrite my experience bullets"
- "What's wrong with my formatting?"`
      };
      setChatHistory([initialMessage]);
    }
  }, [result, chatHistory.length]);

  const getResumeLabel = (resume: (typeof resumes)[number]) => {
    const resumeName = safeText(resume.resume_name, 'Untitled resume');
    const hasText = typeof resume.editable_text === 'string' && resume.editable_text.trim().length > 0;
    return hasText ? resumeName : `${resumeName} (No text)`;
  };

  const clearAnalysis = () => {
    setResult(null);
    setChatHistory([]);
    setUserMessage('');
    setJobDescription('');
    setSelectedResumeId(resumes[0]?.resume_id);
    clearAtsSession();
  };


  const handleAnalyze = async () => {
    if (!jobDescription || !selectedResumeId) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide a job description and select a resume.",
      });
      return;
    }
    const selectedResume = resumes.find(r => r.resume_id === selectedResumeId);
    if (!selectedResume) {
        toast({
            variant: "destructive",
            title: "Resume Not Found",
            description: "Could not find the selected resume. Please try again.",
        });
        return;
    }

    // Validate resume text is available
    console.log('🔍 Full resume object:', JSON.stringify({
      resume_id: selectedResume.resume_id,
      resume_name: selectedResume.resume_name,
      editable_text: selectedResume.editable_text ? `${selectedResume.editable_text.substring(0, 50)}...` : 'EMPTY',
      editable_text_length: selectedResume.editable_text?.length || 0,
      editable_text_type: typeof selectedResume.editable_text,
      allKeys: Object.keys(selectedResume)
    }, null, 2));
    
    let resumeText = selectedResume.editable_text?.trim();
    console.log('🔍 Resume validation:', {
        resumeId: selectedResume.resume_id,
        resumeName: selectedResume.resume_name,
        hasEditableText: !!selectedResume.editable_text,
        editableTextType: typeof selectedResume.editable_text,
        editableTextValue: selectedResume.editable_text === null ? 'NULL' : selectedResume.editable_text === undefined ? 'UNDEFINED' : selectedResume.editable_text === '' ? 'EMPTY STRING' : 'HAS VALUE',
        textLength: selectedResume.editable_text?.length || 0,
        trimmedLength: resumeText?.length || 0,
        firstChars: selectedResume.editable_text?.substring(0, 100) || 'N/A'
    });
    
    // Clean up old error messages that might be in the resume text
    if (resumeText && typeof resumeText === 'string') {
        if (resumeText.includes('text extraction is not yet implemented') ||
            resumeText.includes('has been uploaded successfully, but text extraction')) {
            console.warn('⚠️ Detected old error message in resume text, treating as empty');
            resumeText = '';
        }
    }
    
    if (!resumeText || resumeText.length === 0) {
        console.error('❌ CRITICAL: Resume text is empty or missing', {
            resumeId: selectedResume.resume_id,
            resumeName: selectedResume.resume_name,
            extractionWarning: selectedResume.extraction_warning,
            editableTextExists: !!selectedResume.editable_text,
            editableTextType: typeof selectedResume.editable_text,
            editableTextValue: selectedResume.editable_text
        });
        toast({
            variant: "destructive",
            title: "Resume Text Unavailable",
            description: `The resume "${selectedResume.resume_name}" has no extractable text. ${selectedResume.extraction_warning ? `Warning: ${selectedResume.extraction_warning}. ` : ''}Please go to the Resumes page and click "Edit Text" to manually add your resume content, or re-upload as a PDF file.`,
            duration: 15000,
        });
        return;
    }

    // Additional validation: ensure resume text is meaningful
    if (resumeText.length < 10) {
        console.warn('⚠️ Resume text is very short:', resumeText.length, 'characters');
        toast({
            variant: "destructive",
            title: "Resume Text Too Short",
            description: `The resume text is too short (${resumeText.length} characters). Please ensure the resume has been properly extracted or manually add the text.`,
        });
        return;
    }

    setIsLoading(true);
    setResult(null);
    setChatHistory([]);
    try {
        // Debug: Log the resume text being sent
        console.log('✅ Sending resume text to ATS analysis:', {
            textLength: resumeText.length,
            firstChars: resumeText.substring(0, 200),
            lastChars: resumeText.substring(Math.max(0, resumeText.length - 100))
        });
        
        // Double-check before sending
        if (!resumeText || resumeText.trim().length === 0) {
            throw new Error('Resume text is empty. Cannot proceed with analysis.');
        }
        
        // Final validation - ensure we have meaningful text
        const finalResumeText = resumeText.trim();
        const finalJobDesc = jobDescription.trim();
        
        console.log('🚀 Final check before API call:', {
            resumeTextFinalLength: finalResumeText.length,
            jobDescFinalLength: finalJobDesc.length,
            resumeTextSample: finalResumeText.substring(0, 300),
            willSend: finalResumeText.length > 0 && finalJobDesc.length > 0
        });
        
        if (finalResumeText.length < 10) {
            throw new Error(`Resume text is too short (${finalResumeText.length} characters). Minimum 10 characters required.`);
        }
        
        const analysis = await analyzeResume({
            jobDescription: finalJobDesc,
            resumeText: finalResumeText,
        });
        setResult(analysis);
        const nextChatHistory: ChatMessage[] = [
            { role: 'model', content: `Your resume has a match score of ${analysis.ats_match_score}%. Here are my suggestions. How can I help you improve it?` }
        ];
        setChatHistory(nextChatHistory);
        persistAtsSession({
          jobDescription: finalJobDesc,
          selectedResumeId,
          result: analysis,
          chatHistory: nextChatHistory,
        });
    } catch (error) {
        console.error("Analysis failed:", error);
        toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: "Could not analyze the resume. Please try again later.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || !selectedResumeId || !jobDescription) return;

    const selectedResume = resumes.find(r => r.resume_id === selectedResumeId);
    if (!selectedResume) return;

    // Validate resume text is available
    const resumeText = selectedResume.editable_text?.trim();
    if (!resumeText || resumeText.length === 0) {
        toast({
            variant: "destructive",
            title: "Resume Text Unavailable",
            description: "The selected resume does not have extractable text. Please re-upload the resume or edit the text manually.",
        });
        return;
    }

    const nextUserMessage = userMessage;
    const newUserMessage: ChatMessage = { role: 'user', content: nextUserMessage };
    const optimisticChatHistory = [...chatHistory, newUserMessage];
    setChatHistory(optimisticChatHistory);
    setUserMessage('');
    setIsChatting(true);
    
    try {
        const chatInput: ChatInput = {
            jobDescription,
            resumeText: resumeText,
            chatHistory: optimisticChatHistory,
            userMessage: nextUserMessage,
            atsAnalysis: result || undefined, // Include the ATS analysis results
        };
        const { response } = await chatWithResumeAssistant(chatInput);
        const nextChatHistory = [...optimisticChatHistory, { role: 'model' as const, content: response }];
        setChatHistory(nextChatHistory);
        persistAtsSession({
          jobDescription,
          selectedResumeId,
          result,
          chatHistory: nextChatHistory,
        });

    } catch(error) {
        console.error("Chat failed:", error);
        toast({
            variant: "destructive",
            title: "Chat Error",
            description: "The assistant could not respond. Please try again.",
        });
        const nextChatHistory = [...optimisticChatHistory, { role: 'model' as const, content: "Sorry, I encountered an error. Please try again." }];
        setChatHistory(nextChatHistory);
    } finally {
        setIsChatting(false);
    }
  };

  const handleQuickPrompt = async (prompt: string) => {
    setUserMessage(prompt);
    await Promise.resolve();
  };

  const skillsCoverage = result ? buildCoverageItems(result.role_expectations.skills_and_tools, result, 'skills') : [];
  const responsibilitiesCoverage = result ? buildCoverageItems(result.role_expectations.responsibilities, result, 'responsibilities') : [];
  const missingSkills = skillsCoverage.filter((item) => item.status === 'missing');
  const partialSkills = skillsCoverage.filter((item) => item.status === 'partial');
  const foundResponsibilities = responsibilitiesCoverage.filter((item) => item.status === 'found');
  const missingResponsibilities = responsibilitiesCoverage.filter((item) => item.status !== 'found');
  const provenResponsibilitiesCount = foundResponsibilities.length;
  const responsibilitiesTrackedCount = responsibilitiesCoverage.length;
  const responsibilitiesConfidence = responsibilitiesTrackedCount > 0
    ? Math.round((provenResponsibilitiesCount / responsibilitiesTrackedCount) * 100)
    : 0;
  const strongestResponsibility = foundResponsibilities[0]?.label || 'No responsibility is strongly proven yet';
  const highestRiskResponsibility = missingResponsibilities[0]?.label || 'No major responsibility risk identified';
  const readinessLabel = responsibilitiesConfidence >= 75
    ? 'Resume strongly demonstrates you can fulfill the role'
    : responsibilitiesConfidence >= 45
      ? 'Resume partially demonstrates responsibility fit'
      : 'Resume needs stronger proof for core responsibilities';
  const seniorityAnalysis = result?.seniority_analysis;
  const responsibilityEvidence = result?.responsibility_evidence;
  const experienceAlignment = result?.experience_alignment;
  const impactEvidence = result?.impact_evidence;
  const hiringReadiness = result?.hiring_readiness;
  const responsibilityMatrix = result?.responsibility_matrix ?? [];
  const interviewRisks = result?.interview_risks ?? [];
  const rewritePriorities = result?.rewrite_priorities ?? [];
  const keywordAlignment = result?.keyword_alignment;
  const recruiterSignals = result?.recruiter_signals;
  const exactKeywordMatches = limitItems(keywordAlignment?.exact_matches, 6, 'No exact keyword matches were extracted.');
  const adjacentKeywordMatches = limitItems(keywordAlignment?.adjacent_matches, 6, 'No adjacent terminology matches were extracted.');
  const highValueMissingKeywords = limitItems(keywordAlignment?.high_value_missing, 6, 'No major missing keywords were isolated.');
  const provenResponsibilities = responsibilityEvidence?.proven ?? [];
  const weakResponsibilities = responsibilityEvidence?.weak_or_missing ?? [];
  const seniorityTone =
    seniorityAnalysis?.alignment === 'strong'
      ? 'border-emerald-500/25 bg-emerald-500/8 text-emerald-300'
      : seniorityAnalysis?.alignment === 'partial'
        ? 'border-amber-500/25 bg-amber-500/8 text-amber-300'
        : 'border-red-500/25 bg-red-500/8 text-red-300';
  const experienceTone =
    experienceAlignment?.alignment === 'strong'
      ? 'border-emerald-500/25 bg-emerald-500/8 text-emerald-300'
      : experienceAlignment?.alignment === 'partial'
        ? 'border-amber-500/25 bg-amber-500/8 text-amber-300'
        : 'border-red-500/25 bg-red-500/8 text-red-300';
  const readinessTone = hiringReadiness?.recruiter_screen === 'likely' && hiringReadiness?.hiring_manager_review === 'likely'
    ? 'border-emerald-500/25 bg-emerald-500/8 text-emerald-300'
    : hiringReadiness?.recruiter_screen === 'unlikely' || hiringReadiness?.hiring_manager_review === 'unlikely'
      ? 'border-red-500/25 bg-red-500/8 text-red-300'
      : 'border-amber-500/25 bg-amber-500/8 text-amber-300';
  const analysisInsights = result ? [
    { label: 'Strong Matches', value: result.resume_fit.found.length, tone: 'text-emerald-400 border-emerald-500/25 bg-emerald-500/8' },
    { label: 'Partial Matches', value: result.resume_fit.partial.length, tone: 'text-yellow-400 border-yellow-500/25 bg-yellow-500/8' },
    { label: 'Missing Signals', value: result.resume_fit.missing.length, tone: 'text-red-400 border-red-500/25 bg-red-500/8' },
    { label: 'Priority Skills Gaps', value: missingSkills.length, tone: 'text-sky-400 border-sky-500/25 bg-sky-500/8' },
  ] : [];
  const recruiterSignalCards = recruiterSignals ? [
    { label: 'Leadership', value: recruiterSignals.leadership, icon: ShieldCheck },
    { label: 'Ownership', value: recruiterSignals.ownership, icon: Briefcase },
    { label: 'Business Impact', value: recruiterSignals.business_impact, icon: TrendingUp },
    { label: 'Collaboration', value: recruiterSignals.collaboration, icon: Sparkles },
    { label: 'ATS Readability', value: recruiterSignals.ats_readability, icon: AlertCircle },
  ] : [];
  const scoreCards = result ? [
    { label: 'Skills & Tools', value: result.subscores.skills_tools, accent: 'from-sky-500/35 to-sky-500/5' },
    { label: 'Responsibilities', value: result.subscores.responsibilities, accent: 'from-emerald-500/35 to-emerald-500/5' },
    { label: 'Industry', value: result.subscores.domain_industry, accent: 'from-violet-500/35 to-violet-500/5' },
    { label: 'Seniority', value: result.subscores.seniority_experience, accent: 'from-amber-500/35 to-amber-500/5' },
  ] : [];
  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) {
      return 'Not saved yet';
    }

    return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Analysis Setup</CardTitle>
              <CardDescription>
                Paste a job description and select your resume to get started.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste the job description here..."
            className="min-h-60 font-code"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            disabled={isLoading}
          />
          <div className="flex gap-2">
            <Select onValueChange={setSelectedResumeId} value={selectedResumeId} disabled={isLoading || resumes.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Select a resume" />
              </SelectTrigger>
              <SelectContent>
                {resumes.map((resume) => {
                  const hasText = resume.editable_text?.trim()?.length > 0;
                  return (
                    <SelectItem key={resume.resume_id} value={resume.resume_id}>
                      {getResumeLabel(resume)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => refetch()} 
              disabled={isLoading}
              title="Refresh resumes"
            >
              🔄
            </Button>
          </div>
          {selectedResumeId && (() => {
            const selectedResume = resumes.find(r => r.resume_id === selectedResumeId);
            if (!selectedResume) return null;
            const hasText = selectedResume.editable_text?.trim()?.length > 0;
            if (!hasText) {
              return (
                <div className="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded space-y-2">
                  <div className="font-medium">⚠️ No Resume Text Available</div>
                  <div className="text-xs">
                    This resume has no extractable text. To fix this:
                  </div>
                  <ol className="text-xs list-decimal list-inside space-y-1 ml-2">
                    <li>Go to <strong>Resumes</strong> page</li>
                    <li>Click <strong>Edit Text</strong> on this resume</li>
                    <li>Paste your resume content</li>
                    <li>Click <strong>Save Changes</strong></li>
                    <li>Return here and click <strong>🔄 Refresh</strong> button</li>
                  </ol>
                  <p className="text-xs">
                    Resume: <strong>{safeText(selectedResume.resume_name, 'Untitled resume')}</strong>
                  </p>
                </div>
              );
            }
            return null;
          })()}
        </CardContent>
        <CardFooter>
          <Button onClick={handleAnalyze} disabled={isLoading || resumes.length === 0} className="w-full">
            {isLoading ? 'Analyzing...' : resumes.length === 0 ? 'Upload a resume first' : 'Analyze Resume'}
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/8 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Session Controls</CardTitle>
          <CardDescription>
            Your ATS results now stay on this device until you clear them.
          </CardDescription>
        </CardHeader>
          <CardContent className="space-y-3">
          <div className="rounded-xl border border-border/60 bg-background/60 p-3 text-sm text-muted-foreground">
            {result || chatHistory.length > 0
              ? 'An analysis session is saved locally and will stay visible when you navigate away and come back.'
              : 'No saved ATS session yet. Run an analysis and it will remain here until you reset it.'}
          </div>
          {(result || chatHistory.length > 0) && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/6 p-3 text-sm text-emerald-300">
              Saved analysis is active for this browser. Use Clear only when you want to reset the ATS session. Last saved {formatTimestamp(latestSessionRef.current.updatedAt)}.
            </div>
          )}
          <Button
            variant={result || chatHistory.length > 0 ? 'destructive' : 'outline'}
            className="w-full"
            onClick={clearAnalysis}
            disabled={!result && chatHistory.length === 0}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Clear ATS Analysis
          </Button>
        </CardContent>
      </Card>
      </div>
      
      <div className="lg:col-span-3 space-y-8">
        {isLoading && (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        )}
        
        {result && !isLoading && (
            <>
            <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-card via-card to-primary/5 shadow-[0_24px_80px_rgba(8,15,28,0.35)]">
                <CardHeader className="border-b border-border/60 bg-gradient-to-r from-primary/8 via-transparent to-sky-500/5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="text-2xl">ATS Analysis Result</CardTitle>
                        <CardDescription>
                          Deep-fit review of your resume against the role’s skills, responsibilities, and likely hiring signals.
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">Score {result.ats_match_score}%</Badge>
                        <Badge variant="outline">{result.resume_fit.found.length} aligned signals</Badge>
                        <Badge variant="outline">{result.resume_fit.missing.length} gaps</Badge>
                        <Button variant="destructive" size="sm" onClick={clearAnalysis}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Clear ATS Analysis
                        </Button>
                      </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_1fr]">
                      <div className="rounded-[28px] border border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_35%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(10,14,24,0.92))] p-6 shadow-[0_30px_90px_rgba(8,15,28,0.45)]">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-primary/80">ATS Scoreboard</div>
                            <div className="mt-3 text-5xl font-semibold text-primary">{result.ats_match_score}%</div>
                            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                              A recruiter-style read of how convincingly your resume proves the role, not just how many keywords overlap.
                            </p>
                          </div>
                          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3">
                            <Gauge className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                          {scoreCards.map((card) => (
                            <div key={card.label} className={`rounded-2xl border border-border/60 bg-gradient-to-br ${card.accent} p-4`}>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium">{card.label}</span>
                                <span className="text-lg font-semibold">{card.value}%</span>
                              </div>
                              <Progress value={card.value} className="mt-3 h-2.5" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/7 p-5">
                        <div className="text-xs uppercase tracking-[0.18em] text-emerald-300/80">Responsibility Readiness</div>
                        <div className="mt-3 flex items-end justify-between gap-3">
                          <div className="text-4xl font-semibold text-emerald-300">{responsibilitiesConfidence}%</div>
                          <Badge variant="outline" className="border-emerald-500/35 text-emerald-300">
                            {provenResponsibilitiesCount}/{responsibilitiesTrackedCount || 0} proven
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm text-emerald-100/80">{readinessLabel}</p>
                      </div>

                      <div className="rounded-2xl border border-sky-500/20 bg-sky-500/7 p-5">
                        <div className="text-xs uppercase tracking-[0.18em] text-sky-300/80">Strongest Proof</div>
                        <p className="mt-3 text-lg font-medium text-sky-100">{strongestResponsibility}</p>
                        <p className="mt-2 text-sm text-sky-100/70">
                          This is the clearest responsibility signal your current resume is already communicating.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/7 p-5">
                        <div className="text-xs uppercase tracking-[0.18em] text-amber-300/80">Biggest Responsibility Gap</div>
                        <p className="mt-3 text-lg font-medium text-amber-100">{highestRiskResponsibility}</p>
                        <p className="mt-2 text-sm text-amber-100/70">
                          Make this more explicit with bullets that show ownership, outcomes, and decision-making.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      {analysisInsights.map((insight) => (
                        <div key={insight.label} className={`rounded-2xl border p-4 ${insight.tone}`}>
                          <div className="text-xs uppercase tracking-[0.18em] opacity-80">{insight.label}</div>
                          <div className="mt-2 text-3xl font-semibold">{insight.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <div className="space-y-2 rounded-xl border border-border/50 bg-background/50 p-4">
                            <div className="flex justify-between text-sm">
                                <span>Skills & Tools</span>
                                <span className="font-medium">{result.subscores.skills_tools}%</span>
                            </div>
                            <Progress value={result.subscores.skills_tools} className="h-2"/>
                        </div>
                        <div className="space-y-2 rounded-xl border border-border/50 bg-background/50 p-4">
                            <div className="flex justify-between text-sm">
                                <span>Responsibilities</span>
                                <span className="font-medium">{result.subscores.responsibilities}%</span>
                            </div>
                            <Progress value={result.subscores.responsibilities} className="h-2"/>
                        </div>
                        <div className="space-y-2 rounded-xl border border-border/50 bg-background/50 p-4">
                            <div className="flex justify-between text-sm">
                                <span>Domain/Industry</span>
                                <span className="font-medium">{result.subscores.domain_industry}%</span>
                            </div>
                            <Progress value={result.subscores.domain_industry} className="h-2"/>
                        </div>
                        <div className="space-y-2 rounded-xl border border-border/50 bg-background/50 p-4">
                            <div className="flex justify-between text-sm">
                                <span>Education/Certs</span>
                                <span className="font-medium">{result.subscores.education_certs}%</span>
                            </div>
                            <Progress value={result.subscores.education_certs} className="h-2"/>
                        </div>
                        <div className="space-y-2 rounded-xl border border-border/50 bg-background/50 p-4">
                            <div className="flex justify-between text-sm">
                                <span>Experience Level</span>
                                <span className="font-medium">{result.subscores.seniority_experience}%</span>
                            </div>
                            <Progress value={result.subscores.seniority_experience} className="h-2"/>
                        </div>
                        <div className="space-y-2 rounded-xl border border-border/50 bg-background/50 p-4">
                            <div className="flex justify-between text-sm">
                                <span>Soft Skills</span>
                                <span className="font-medium">{result.subscores.soft_skills}%</span>
                            </div>
                            <Progress value={result.subscores.soft_skills} className="h-2"/>
                        </div>
                        <div className="space-y-2 rounded-xl border border-border/50 bg-background/50 p-4 md:col-span-2 xl:col-span-1">
                            <div className="flex justify-between text-sm">
                                <span>Formatting & ATS</span>
                                <span className="font-medium">{result.subscores.formatting_ats}%</span>
                            </div>
                            <Progress value={result.subscores.formatting_ats} className="h-2"/>
                            <p className="text-xs leading-5 text-muted-foreground">
                              Parsing safety, structure, clarity, and how easy the document feels to scan in an ATS or recruiter pass.
                            </p>
                        </div>
                    </div>

                    {/* Fit Summary */}
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Fit Analysis</AlertTitle>
                        <AlertDescription>{result.fit_summary}</AlertDescription>
                    </Alert>

                    <Tabs defaultValue="overview" className="space-y-4">
                      <TabsList className="grid h-auto w-full grid-cols-2 rounded-2xl border border-border/60 bg-muted/25 p-1 lg:grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="coverage">Coverage</TabsTrigger>
                        <TabsTrigger value="evidence">Evidence</TabsTrigger>
                        <TabsTrigger value="actions">Action Plan</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-5">
                        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                          <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-transparent to-sky-500/10 p-6">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h4 className="text-lg font-semibold">Executive Fit Summary</h4>
                                <p className="mt-2 text-sm text-muted-foreground">
                                  This combines ATS compatibility with whether the resume actually proves the level, scope, and execution the job expects.
                                </p>
                              </div>
                              <Badge variant="secondary">Recruiter-style read</Badge>
                            </div>
                            <p className="mt-5 text-base leading-7 text-foreground/90">{result.fit_summary}</p>
                            {responsibilityEvidence?.summary && (
                              <div className="mt-5 rounded-xl border border-border/50 bg-background/60 p-4">
                                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Responsibility verdict</div>
                                <p className="mt-2 text-sm leading-6 text-foreground/85">{responsibilityEvidence.summary}</p>
                              </div>
                            )}
                          </div>

                          <div className={`rounded-2xl border p-6 ${seniorityTone}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-xs uppercase tracking-[0.18em] opacity-80">Seniority Match</div>
                                <div className="mt-2 text-3xl font-semibold capitalize">{seniorityAnalysis?.alignment ?? 'pending'}</div>
                              </div>
                              <Badge variant="outline" className="capitalize">
                                JD: {seniorityAnalysis?.expected_level ?? result?.role_expectations.seniority_level ?? 'Not inferred'}
                              </Badge>
                            </div>
                            <div className="mt-5 space-y-4">
                              <div>
                                <div className="text-xs uppercase tracking-[0.16em] opacity-75">Resume appears at</div>
                                <div className="mt-1 text-base font-medium">{seniorityAnalysis?.resume_level ?? 'Not yet inferred'}</div>
                              </div>
                              <p className="text-sm leading-6 opacity-90">{seniorityAnalysis?.rationale ?? 'Run another analysis to populate the seniority assessment.'}</p>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                  <div className="mb-2 text-xs uppercase tracking-[0.16em] opacity-75">Evidence</div>
                                  <ul className="space-y-2 text-sm opacity-90">
                                    {limitItems(seniorityAnalysis?.evidence, 4, 'No supporting seniority signals extracted.').map((item) => (
                                      <li key={item}>• {item}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <div className="mb-2 text-xs uppercase tracking-[0.16em] opacity-75">Gaps</div>
                                  <ul className="space-y-2 text-sm opacity-90">
                                    {limitItems(seniorityAnalysis?.gaps, 4, 'No major seniority gaps were called out.').map((item) => (
                                      <li key={item}>• {item}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-2">
                          <div className={`rounded-2xl border p-6 ${experienceTone}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-xs uppercase tracking-[0.18em] opacity-80">Experience Alignment</div>
                                <div className="mt-2 text-3xl font-semibold capitalize">{experienceAlignment?.alignment ?? 'pending'}</div>
                              </div>
                              <Badge variant="outline">Role depth check</Badge>
                            </div>
                            <div className="mt-5 space-y-4">
                              <div>
                                <div className="text-xs uppercase tracking-[0.16em] opacity-75">Required profile</div>
                                <p className="mt-1 text-sm leading-6 opacity-90">{experienceAlignment?.required_profile ?? result.role_expectations.experience_required}</p>
                              </div>
                              <div>
                                <div className="text-xs uppercase tracking-[0.16em] opacity-75">Resume profile</div>
                                <p className="mt-1 text-sm leading-6 opacity-90">{experienceAlignment?.resume_profile ?? 'Not yet inferred'}</p>
                              </div>
                              <p className="text-sm leading-6 opacity-90">{experienceAlignment?.rationale ?? 'Run another analysis to populate the experience assessment.'}</p>
                              <div>
                                <div className="mb-2 text-xs uppercase tracking-[0.16em] opacity-75">Missing experience signals</div>
                                <ul className="space-y-2 text-sm opacity-90">
                                  {limitItems(experienceAlignment?.missing_experience_signals, 4, 'No major missing experience signals were identified.').map((item) => (
                                    <li key={item}>• {item}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>

                          <div className={`rounded-2xl border p-6 ${readinessTone}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-xs uppercase tracking-[0.18em] opacity-80">Hiring Readiness</div>
                                <div className="mt-2 text-3xl font-semibold">Decision Outlook</div>
                              </div>
                              <Badge variant="outline">Screening view</Badge>
                            </div>
                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                              <div className="rounded-xl border border-current/20 bg-background/20 p-4">
                                <div className="text-xs uppercase tracking-[0.16em] opacity-75">Recruiter screen</div>
                                <div className="mt-2 text-xl font-semibold capitalize">{hiringReadiness?.recruiter_screen ?? 'pending'}</div>
                              </div>
                              <div className="rounded-xl border border-current/20 bg-background/20 p-4">
                                <div className="text-xs uppercase tracking-[0.16em] opacity-75">Hiring manager review</div>
                                <div className="mt-2 text-xl font-semibold capitalize">{hiringReadiness?.hiring_manager_review ?? 'pending'}</div>
                              </div>
                            </div>
                            <p className="mt-4 text-sm leading-6 opacity-90">{hiringReadiness?.rationale ?? 'The model has not yet produced a hiring-readiness outlook for this session.'}</p>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                          {recruiterSignalCards.map((signal) => {
                            const Icon = signal.icon;
                            return (
                              <div key={signal.label} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <Icon className="h-4 w-4 text-primary" />
                                  {signal.label}
                                </div>
                                <p className="mt-3 text-sm leading-6 text-muted-foreground">{signal.value}</p>
                              </div>
                            );
                          })}
                        </div>

                        <div className="grid gap-4 xl:grid-cols-3">
                          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/6 p-5">
                            <div className="text-xs uppercase tracking-[0.16em] text-emerald-300/85">Exact keyword matches</div>
                            <ul className="mt-4 space-y-2 text-sm text-emerald-50/90">
                              {exactKeywordMatches.map((item) => (
                                <li key={item}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/6 p-5">
                            <div className="text-xs uppercase tracking-[0.16em] text-sky-300/85">Adjacent terminology</div>
                            <ul className="mt-4 space-y-2 text-sm text-sky-50/90">
                              {adjacentKeywordMatches.map((item) => (
                                <li key={item}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-2xl border border-red-500/20 bg-red-500/6 p-5">
                            <div className="text-xs uppercase tracking-[0.16em] text-red-300/85">High-value missing terms</div>
                            <ul className="mt-4 space-y-2 text-sm text-red-50/90">
                              {highValueMissingKeywords.map((item) => (
                                <li key={item}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-2">
                          <div className="rounded-2xl border border-primary/15 bg-background/60 p-5">
                            <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Best impact evidence from the resume</div>
                            <p className="mt-3 text-sm leading-6 text-foreground/85">
                              {impactEvidence?.summary ?? 'The analysis has not yet returned an impact-evidence summary.'}
                            </p>
                            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                              {limitItems(impactEvidence?.strong_examples, 4, 'No strong quantified impact examples were extracted.').map((item) => (
                                <li key={item}>• {item}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/6 p-5">
                            <div className="text-xs uppercase tracking-[0.16em] text-amber-300/85">Where your resume still feels weak</div>
                            <ul className="mt-4 space-y-2 text-sm text-amber-50/90">
                              {limitItems(impactEvidence?.weak_spots, 4, 'No major impact weak spots were extracted.').map((item) => (
                                <li key={item}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-2">
                          <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
                            <div className="flex items-center justify-between gap-3">
                              <h4 className="text-lg font-semibold">Responsibility Matrix</h4>
                              <Badge variant="outline">{responsibilityMatrix.length} tracked areas</Badge>
                            </div>
                            <div className="mt-4 space-y-3">
                              {responsibilityMatrix.length > 0 ? responsibilityMatrix.map((item) => (
                                <div key={`${item.area}-${item.jd_expectation}`} className="rounded-xl border border-border/50 bg-muted/10 p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="font-medium">{item.area}</div>
                                    <Badge
                                      variant="outline"
                                      className={item.confidence === 'high' ? 'border-emerald-500/30 text-emerald-400' : item.confidence === 'medium' ? 'border-amber-500/30 text-amber-400' : 'border-red-500/30 text-red-400'}
                                    >
                                      {item.confidence} confidence
                                    </Badge>
                                  </div>
                                  <div className="mt-3 grid gap-3 text-xs text-muted-foreground">
                                    <div>
                                      <div className="uppercase tracking-[0.16em]">JD expectation</div>
                                      <div className="mt-1">{item.jd_expectation}</div>
                                    </div>
                                    <div>
                                      <div className="uppercase tracking-[0.16em]">Resume evidence</div>
                                      <div className="mt-1">{item.resume_evidence}</div>
                                    </div>
                                    <div>
                                      <div className="uppercase tracking-[0.16em]">Gap</div>
                                      <div className="mt-1">{item.gap}</div>
                                    </div>
                                  </div>
                                </div>
                              )) : (
                                <div className="rounded-xl border border-border/50 bg-muted/10 p-4 text-sm text-muted-foreground">
                                  Run a fresh analysis to populate the structured responsibility matrix.
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
                            <div className="flex items-center justify-between gap-3">
                              <h4 className="text-lg font-semibold">Interview Risks</h4>
                              <Badge variant="outline">{interviewRisks.length} risks</Badge>
                            </div>
                            <div className="mt-4 space-y-3">
                              {interviewRisks.length > 0 ? interviewRisks.map((item) => (
                                <div key={item.risk} className="rounded-xl border border-red-500/15 bg-red-500/5 p-4">
                                  <div className="font-medium text-foreground">{item.risk}</div>
                                  <div className="mt-2 text-xs text-muted-foreground">{item.why_it_matters}</div>
                                  <div className="mt-3 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-foreground/85">
                                    Mitigation: {item.mitigation}
                                  </div>
                                </div>
                              )) : (
                                <div className="rounded-xl border border-border/50 bg-muted/10 p-4 text-sm text-muted-foreground">
                                  No interview risks were extracted for this analysis yet.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="coverage" className="space-y-5">
                        <div className="space-y-3">
                          <h4 className="font-semibold">Role Expectations</h4>
                          <p className="text-sm text-muted-foreground">{result.role_expectations.summary}</p>
                        </div>

                        <div className="rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/8 via-transparent to-sky-500/5 p-5">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <h4 className="text-lg font-semibold">Can your resume prove you can fulfill this job?</h4>
                              <p className="mt-2 text-sm text-muted-foreground">
                                This section checks whether your bullets and achievements visibly support the job’s real responsibilities, not just keyword overlap.
                              </p>
                            </div>
                            <Badge variant="secondary" className="w-fit">
                              {readinessLabel}
                            </Badge>
                          </div>
                          <div className="mt-4 grid gap-4 md:grid-cols-3">
                            <div className="rounded-xl border border-border/50 bg-background/60 p-4">
                              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Responsibilities clearly proven</div>
                              <div className="mt-2 text-3xl font-semibold text-emerald-400">{provenResponsibilitiesCount}</div>
                            </div>
                            <div className="rounded-xl border border-border/50 bg-background/60 p-4">
                              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Responsibilities needing stronger proof</div>
                              <div className="mt-2 text-3xl font-semibold text-amber-400">{missingResponsibilities.length}</div>
                            </div>
                            <div className="rounded-xl border border-border/50 bg-background/60 p-4">
                              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Priority missing skills</div>
                              <div className="mt-2 text-3xl font-semibold text-sky-400">{missingSkills.length}</div>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/15 p-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium">Skills Coverage</h5>
                              <Badge variant="outline">{skillsCoverage.length} tracked</Badge>
                            </div>
                            <div className="space-y-3">
                              {skillsCoverage.map((item) => (
                                <div key={item.label} className="rounded-lg border border-border/50 bg-background/50 p-3">
                                  <div className="mb-2 flex items-center justify-between gap-3">
                                    <span className="text-sm font-medium">{item.label}</span>
                                    <Badge
                                      variant={item.status === 'found' ? 'secondary' : 'outline'}
                                      className={item.status === 'missing' ? 'border-red-500/40 text-red-400' : item.status === 'partial' ? 'border-yellow-500/40 text-yellow-400' : 'text-emerald-400'}
                                    >
                                      {item.status}
                                    </Badge>
                                  </div>
                                  <ul className="space-y-1 text-xs text-muted-foreground">
                                    {item.evidence.map((evidence) => (
                                      <li key={evidence}>• {evidence}</li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/15 p-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium">Responsibilities Coverage</h5>
                              <Badge variant="outline">{responsibilitiesCoverage.length} tracked</Badge>
                            </div>
                            <div className="space-y-3">
                              {responsibilitiesCoverage.map((item) => (
                                <div key={item.label} className="rounded-lg border border-border/50 bg-background/50 p-3">
                                  <div className="mb-2 flex items-center justify-between gap-3">
                                    <span className="text-sm font-medium">{item.label}</span>
                                    <Badge
                                      variant={item.status === 'found' ? 'secondary' : 'outline'}
                                      className={item.status === 'missing' ? 'border-red-500/40 text-red-400' : item.status === 'partial' ? 'border-yellow-500/40 text-yellow-400' : 'text-emerald-400'}
                                    >
                                      {item.status}
                                    </Badge>
                                  </div>
                                  <ul className="space-y-1 text-xs text-muted-foreground">
                                    {item.evidence.map((evidence) => (
                                      <li key={evidence}>• {evidence}</li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                            <div className="mb-2 text-sm font-medium text-emerald-400">Found</div>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              {result.resume_fit.found.slice(0, 4).map((item) => (
                                <li key={item}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                            <div className="mb-2 text-sm font-medium text-yellow-400">Partial</div>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              {result.resume_fit.partial.slice(0, 4).map((item) => (
                                <li key={item}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                            <div className="mb-2 text-sm font-medium text-red-400">Missing</div>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              {result.resume_fit.missing.slice(0, 4).map((item) => (
                                <li key={item}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="evidence" className="space-y-5">
                        <div className="rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/8 via-transparent to-transparent p-5">
                          <h4 className="text-lg font-semibold">Responsibility Proof Audit</h4>
                          <p className="mt-2 text-sm text-muted-foreground">
                            This section checks the actual evidence in your resume for each responsibility the job asks for, including where the resume feels believable, where it feels thin, and where it lacks the scope or impact the employer expects.
                          </p>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                            <div className="mb-3 flex items-center gap-2">
                              <Target className="h-4 w-4 text-red-400" />
                              <h5 className="font-medium">Missing Skills You Likely Need</h5>
                            </div>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                              {missingSkills.length > 0 ? missingSkills.map((item) => (
                                <li key={item.label}>
                                  <span className="font-medium text-foreground">{item.label}</span>
                                  <div className="text-xs text-muted-foreground">{item.evidence[0]}</div>
                                </li>
                              )) : <li>No critical missing skills were isolated from the current analysis.</li>}
                            </ul>
                          </div>

                          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                            <div className="mb-3 flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-yellow-400" />
                              <h5 className="font-medium">Skills To Strengthen</h5>
                            </div>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                              {partialSkills.length > 0 ? partialSkills.map((item) => (
                                <li key={item.label}>
                                  <span className="font-medium text-foreground">{item.label}</span>
                                  <div className="text-xs text-muted-foreground">{item.evidence.join(' ')}</div>
                                </li>
                              )) : <li>No partially matched skills were flagged.</li>}
                            </ul>
                          </div>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-2">
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                            <h5 className="mb-3 font-medium text-emerald-400">Responsibilities Already Proven</h5>
                            <div className="space-y-3">
                              {provenResponsibilities.length > 0 ? provenResponsibilities.map((item) => (
                                <div key={item.responsibility} className="rounded-lg border border-emerald-500/15 bg-background/50 p-3">
                                  <div className="mb-2 flex items-center justify-between gap-3">
                                    <span className="font-medium text-foreground">{item.responsibility}</span>
                                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 capitalize">
                                      {item.strength}
                                    </Badge>
                                  </div>
                                  <ul className="space-y-1 text-xs text-muted-foreground">
                                    {item.evidence.map((evidence) => (
                                      <li key={evidence}>• {evidence}</li>
                                    ))}
                                  </ul>
                                </div>
                              )) : foundResponsibilities.length > 0 ? foundResponsibilities.map((item) => (
                                <div key={item.label} className="rounded-lg border border-emerald-500/15 bg-background/50 p-3 text-sm text-muted-foreground">
                                  • {item.label}
                                </div>
                              )) : <div className="text-sm text-muted-foreground">No responsibilities were confidently matched yet.</div>}
                            </div>
                          </div>

                          <div className="rounded-xl border border-border/60 bg-muted/15 p-4">
                            <h5 className="mb-3 font-medium">Responsibilities To Make More Explicit</h5>
                            <div className="space-y-3">
                              {weakResponsibilities.length > 0 ? weakResponsibilities.map((item) => (
                                <div key={item.responsibility} className="rounded-lg border border-border/60 bg-background/50 p-3">
                                  <div className="font-medium text-foreground">{item.responsibility}</div>
                                  <div className="mt-2 text-xs text-muted-foreground">{item.gap_reason}</div>
                                  <div className="mt-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-foreground/80">
                                    Improve with: {item.improvement_hint}
                                  </div>
                                </div>
                              )) : missingResponsibilities.length > 0 ? missingResponsibilities.map((item) => (
                                <div key={item.label} className="rounded-lg border border-border/60 bg-background/50 p-3">
                                  <div className="font-medium text-foreground">{item.label}</div>
                                  <div className="mt-2 text-xs text-muted-foreground">{item.evidence[0]}</div>
                                </div>
                              )) : <div className="text-sm text-muted-foreground">Responsibility alignment looks strong across the board.</div>}
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="actions" className="space-y-5">
                        <div className="rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/8 via-transparent to-transparent p-5">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-lg font-semibold">Rewrite Priorities</h4>
                            <Badge variant="secondary">{rewritePriorities.length} queued improvements</Badge>
                          </div>
                          <div className="mt-4 grid gap-3">
                            {rewritePriorities.length > 0 ? rewritePriorities.map((item) => (
                              <div key={`${item.section}-${item.action}`} className="rounded-xl border border-border/50 bg-background/60 p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="font-medium">{item.section}</div>
                                  <Badge
                                    variant="outline"
                                    className={item.priority === 'high' ? 'border-red-500/30 text-red-400' : item.priority === 'medium' ? 'border-amber-500/30 text-amber-400' : 'border-sky-500/30 text-sky-400'}
                                  >
                                    {item.priority} priority
                                  </Badge>
                                </div>
                                <div className="mt-2 text-sm text-muted-foreground">{item.action}</div>
                                <div className="mt-2 text-xs text-foreground/75">Expected benefit: {item.expected_benefit}</div>
                              </div>
                            )) : (
                              <div className="rounded-xl border border-border/50 bg-background/60 p-4 text-sm text-muted-foreground">
                                No structured rewrite priorities were returned for this analysis yet.
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">Current Issues</h4>
                          <ul className="space-y-2">
                            {result.current_problems.map((problem, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <span>{problem}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="font-semibold mb-3">Improvement Suggestions</h4>
                          <ul className="space-y-2">
                            {result.improvement_suggestions.map((suggestion, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="font-semibold mb-3">Predicted Score Improvements</h4>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                              <div className="text-2xl font-bold text-emerald-400">{result.predicted_score_improvement.keyword_alignment}</div>
                              <div className="text-sm text-muted-foreground">Keyword Alignment</div>
                            </div>
                            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-center">
                              <div className="text-2xl font-bold text-sky-400">{result.predicted_score_improvement.quantified_results}</div>
                              <div className="text-sm text-muted-foreground">Quantified Results</div>
                            </div>
                            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 text-center">
                              <div className="text-2xl font-bold text-violet-400">{result.predicted_score_improvement.formatting_fix}</div>
                              <div className="text-sm text-muted-foreground">Formatting Fix</div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Card className="flex flex-col overflow-hidden border-primary/15 bg-gradient-to-br from-card via-card to-sky-500/5 shadow-[0_24px_80px_rgba(8,15,28,0.28)]">
                <CardHeader className="border-b border-border/60 bg-gradient-to-r from-sky-500/6 via-transparent to-primary/6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-2xl">Resume Assistant</CardTitle>
                        <CardDescription>
                          Ask focused questions about missing skills, responsibilities, bullet rewrites, and ATS gaps.
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="px-3 py-1">Analysis-aware</Badge>
                        <Badge variant="outline" className="px-3 py-1">{chatHistory.length} messages</Badge>
                      </div>
                    </div>
                    <CardDescription>
                        The assistant uses your active ATS analysis to give role-specific resume advice.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden px-0">
                    <div className="border-y border-border/60 bg-muted/10 px-6 py-3">
                      <div className="flex flex-wrap gap-2">
                        {QUICK_PROMPTS.map((prompt) => (
                          <Button key={prompt} type="button" variant="outline" size="sm" className="rounded-full border-primary/20 bg-background/60" onClick={() => void handleQuickPrompt(prompt)}>
                            {prompt}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <ScrollArea className="h-[460px] px-6 py-6" ref={chatContainerRef}>
                        <div className="space-y-4">
                        {chatHistory.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <div className="rounded-full border border-primary/30 bg-primary/10 p-2"><Bot className="w-4 h-4 text-primary flex-shrink-0"/></div>}
                                <div className={`max-w-[85%] rounded-3xl border p-4 shadow-sm ${msg.role === 'model' ? 'border-border/60 bg-muted/20 backdrop-blur-sm' : 'border-primary/40 bg-primary text-primary-foreground'}`}>
                                    <p className="mb-2 text-[11px] uppercase tracking-[0.2em] opacity-70">{msg.role === 'model' ? 'Assistant' : 'You'}</p>
                                    <p className="text-sm whitespace-pre-wrap leading-6">{msg.content}</p>
                                </div>
                                {msg.role === 'user' && <div className="rounded-full border border-border/60 bg-background p-2"><UserIcon className="w-4 h-4 text-muted-foreground flex-shrink-0"/></div>}
                            </div>
                        ))}
                         {isChatting && (
                            <div className="flex items-start gap-3">
                                <div className="rounded-full border border-primary/30 bg-primary/10 p-2"><Bot className="w-4 h-4 text-primary flex-shrink-0"/></div>
                                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        )}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="border-t border-border/60 bg-background/90 px-6 py-5 backdrop-blur-sm">
                    <div className="w-full space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ask the assistant something specific</div>
                          <div className="text-xs text-muted-foreground">
                            Try: responsibilities, missing skills, rewrite bullets, quantify impact
                          </div>
                        </div>
                        <div className="flex w-full items-center space-x-2">
                        <Input
                            type="text"
                            placeholder={result ? "Ask about missing skills, responsibilities, or how to rewrite your experience..." : "Run an analysis first, then ask questions here..."}
                            value={userMessage}
                            onChange={(e) => setUserMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={isChatting}
                            className="min-h-12 rounded-2xl border-primary/15 bg-background/70"
                        />
                        <Button type="submit" size="icon" className="h-12 w-12 rounded-2xl" onClick={handleSendMessage} disabled={isChatting || !userMessage.trim()}>
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send</span>
                        </Button>
                        </div>
                    </div>
                </CardFooter>
            </Card>
            </>
        )}

        {!result && !isLoading && (
            <Card className="lg:col-span-3 flex items-center justify-center h-96">
                <div className="text-center">
                    <CardTitle>Ready for Analysis</CardTitle>
                    <CardDescription className="mt-2">
                        Fill out the form to see your resume analysis here.
                    </CardDescription>
                </div>
            </Card>
        )}
      </div>
    </div>
  );
}
