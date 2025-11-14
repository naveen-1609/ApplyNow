'use client';

import { useState, useRef, useEffect } from 'react';
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
import { analyzeResume, chatWithResumeAssistant, generateCoverLetter, AtsAnalysisOutput, ChatInput, CoverLetterInput, CoverLetterOutput } from '@/ai/flows/ats-checker-flow';
import { AlertCircle, Bot, Send, User as UserIcon, FileText, Copy, Download } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-optimized-auth';
import { useOptimizedResumes } from '@/hooks/use-optimized-resumes';
import { useCoverLetters } from '@/hooks/use-cover-letters';
import { AddCoverLetterDialog } from '@/components/cover-letters/add-cover-letter-dialog';
import Link from 'next/link';


type ChatMessage = {
    role: 'user' | 'model';
    content: string;
};

export function AtsCheckerTool() {
  const { user } = useAuth();
  const { resumes, refetch } = useOptimizedResumes();
  const { add: addCoverLetter } = useCoverLetters();
  const [jobDescription, setJobDescription] = useState('');
  const [isAddCoverLetterDialogOpen, setIsAddCoverLetterDialogOpen] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [result, setResult] = useState<AtsAnalysisOutput | null>(null);
  const { toast } = useToast();
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Cover letter states
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [coverLetterResult, setCoverLetterResult] = useState<CoverLetterOutput | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [coverLetterTone, setCoverLetterTone] = useState<'professional' | 'enthusiastic' | 'confident' | 'conversational'>('professional');
  const [coverLetterLength, setCoverLetterLength] = useState<'short' | 'medium' | 'long'>('medium');

  // Set default resume when resumes are loaded
  useEffect(() => {
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
  }, [resumes, selectedResumeId]);

  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

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
        setChatHistory([
            { role: 'model', content: `Your resume has a match score of ${analysis.ats_match_score}%. Here are my suggestions. How can I help you improve it?` }
        ]);
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

    const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
    setChatHistory(prev => [...prev, newUserMessage]);
    setUserMessage('');
    setIsChatting(true);
    
    try {
        const chatInput: ChatInput = {
            jobDescription,
            resumeText: resumeText,
            chatHistory: [...chatHistory, newUserMessage],
            userMessage: userMessage,
            atsAnalysis: result || undefined, // Include the ATS analysis results
        };
        const { response } = await chatWithResumeAssistant(chatInput);
        setChatHistory(prev => [...prev, { role: 'model', content: response }]);

    } catch(error) {
        console.error("Chat failed:", error);
        toast({
            variant: "destructive",
            title: "Chat Error",
            description: "The assistant could not respond. Please try again.",
        });
         setChatHistory(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
        setIsChatting(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
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
    const resumeText = selectedResume.editable_text?.trim();
    if (!resumeText || resumeText.length === 0) {
        toast({
            variant: "destructive",
            title: "Resume Text Unavailable",
            description: "The selected resume does not have extractable text. Please re-upload the resume or edit the text manually in the Resumes page.",
        });
        return;
    }

    setIsGeneratingCoverLetter(true);
    setCoverLetterResult(null);

    try {
      const coverLetterInput: CoverLetterInput = {
        jobDescription,
        resumeText: resumeText,
        companyName: companyName || undefined,
        jobTitle: jobTitle || undefined,
        tone: coverLetterTone,
        length: coverLetterLength,
      };

      const result = await generateCoverLetter(coverLetterInput);
      setCoverLetterResult(result);
      
      toast({
        title: "Cover Letter Generated",
        description: "Your personalized cover letter is ready!",
      });
    } catch (error) {
      console.error("Cover letter generation failed:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate the cover letter. Please try again later.",
      });
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const handleCopyCoverLetter = () => {
    if (coverLetterResult) {
      navigator.clipboard.writeText(coverLetterResult.coverLetter);
      toast({
        title: "Copied to Clipboard",
        description: "Cover letter has been copied to your clipboard.",
      });
    }
  };

  const handleDownloadCoverLetter = () => {
    if (coverLetterResult) {
      const blob = new Blob([coverLetterResult.coverLetter], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cover-letter-${companyName || 'application'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Downloaded",
        description: "Cover letter has been downloaded.",
      });
    }
  };

  const handleAddToDirectory = async (name: string, text: string, companyName?: string, jobTitle?: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please sign in to save cover letters.',
      });
      return;
    }
    
    try {
      await addCoverLetter(name, text, companyName, jobTitle);
      // Success toast is handled in the hook
    } catch (error) {
      console.error('Error saving cover letter:', error);
      // Error toast is handled in the hook, but we still throw to let dialog know
      throw error;
    }
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <Card>
        <CardHeader>
          <CardTitle>Analysis Setup</CardTitle>
          <CardDescription>
            Paste a job description and select your resume to get started.
          </CardDescription>
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
                      <div className="flex items-center gap-2">
                        <span>{resume.resume_name}</span>
                        {!hasText && (
                          <span className="text-xs text-yellow-600">(No text)</span>
                        )}
                      </div>
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
      
        {/* Cover Letter Generation Card */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Cover Letter Generator
          </CardTitle>
          <CardDescription>
            Generate a personalized cover letter based on your resume and the job description.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Company Name (Optional)</label>
            <Input
              placeholder="e.g., Google, Microsoft"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isGeneratingCoverLetter}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Job Title (Optional)</label>
            <Input
              placeholder="e.g., Software Engineer, Product Manager"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              disabled={isGeneratingCoverLetter}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tone</label>
            <Select value={coverLetterTone} onValueChange={(value: any) => setCoverLetterTone(value)} disabled={isGeneratingCoverLetter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                <SelectItem value="confident">Confident</SelectItem>
                <SelectItem value="conversational">Conversational</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Length</label>
            <Select value={coverLetterLength} onValueChange={(value: any) => setCoverLetterLength(value)} disabled={isGeneratingCoverLetter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short (200-300 words)</SelectItem>
                <SelectItem value="medium">Medium (300-400 words)</SelectItem>
                <SelectItem value="long">Long (400-500 words)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleGenerateCoverLetter} 
            disabled={isGeneratingCoverLetter || !jobDescription || !selectedResumeId || resumes.length === 0} 
            className="w-full"
          >
            {isGeneratingCoverLetter ? 'Generating...' : 'Generate Cover Letter'}
          </Button>
        </CardFooter>
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
            <Card>
                <CardHeader>
                    <CardTitle>ATS Analysis Result</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Overall Score */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="font-semibold text-muted-foreground">Overall Match Score</h3>
                            <span className="font-bold text-primary text-2xl">{result.ats_match_score}%</span>
                        </div>
                        <Progress value={result.ats_match_score} className="h-3"/>
                    </div>

                    {/* Detailed Subscores */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Skills & Tools</span>
                                <span className="font-medium">{result.subscores.skills_tools}%</span>
                            </div>
                            <Progress value={result.subscores.skills_tools} className="h-2"/>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Responsibilities</span>
                                <span className="font-medium">{result.subscores.responsibilities}%</span>
                            </div>
                            <Progress value={result.subscores.responsibilities} className="h-2"/>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Domain/Industry</span>
                                <span className="font-medium">{result.subscores.domain_industry}%</span>
                            </div>
                            <Progress value={result.subscores.domain_industry} className="h-2"/>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Education/Certs</span>
                                <span className="font-medium">{result.subscores.education_certs}%</span>
                            </div>
                            <Progress value={result.subscores.education_certs} className="h-2"/>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Experience Level</span>
                                <span className="font-medium">{result.subscores.seniority_experience}%</span>
                            </div>
                            <Progress value={result.subscores.seniority_experience} className="h-2"/>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Soft Skills</span>
                                <span className="font-medium">{result.subscores.soft_skills}%</span>
                            </div>
                            <Progress value={result.subscores.soft_skills} className="h-2"/>
                        </div>
                    </div>

                    {/* Fit Summary */}
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Fit Analysis</AlertTitle>
                        <AlertDescription>{result.fit_summary}</AlertDescription>
                    </Alert>

                    {/* Role Expectations */}
                    <div className="space-y-3">
                        <h4 className="font-semibold">Role Expectations</h4>
                        <p className="text-sm text-muted-foreground">{result.role_expectations.summary}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <h5 className="font-medium mb-2">Required Skills:</h5>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    {result.role_expectations.skills_and_tools.slice(0, 5).map((skill, i) => (
                                        <li key={i}>{skill}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-medium mb-2">Key Responsibilities:</h5>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    {result.role_expectations.responsibilities.slice(0, 3).map((resp, i) => (
                                        <li key={i}>{resp}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Resume Fit Analysis */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <h5 className="font-medium text-green-600 mb-2">✓ Found ({result.resume_fit.found.length})</h5>
                            <ul className="text-sm space-y-1">
                                {result.resume_fit.found.slice(0, 3).map((item, i) => (
                                    <li key={i} className="text-green-700">• {item}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-medium text-yellow-600 mb-2">⚠ Partial ({result.resume_fit.partial.length})</h5>
                            <ul className="text-sm space-y-1">
                                {result.resume_fit.partial.slice(0, 3).map((item, i) => (
                                    <li key={i} className="text-yellow-700">• {item}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-medium text-red-600 mb-2">✗ Missing ({result.resume_fit.missing.length})</h5>
                            <ul className="text-sm space-y-1">
                                {result.resume_fit.missing.slice(0, 3).map((item, i) => (
                                    <li key={i} className="text-red-700">• {item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Current Problems */}
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

                    {/* Improvement Suggestions */}
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

                    {/* Predicted Improvements */}
                    <div>
                        <h4 className="font-semibold mb-3">Predicted Score Improvements</h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-green-50 rounded-lg">
                                <div className="text-lg font-bold text-green-600">{result.predicted_score_improvement.keyword_alignment}</div>
                                <div className="text-sm text-green-700">Keyword Alignment</div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <div className="text-lg font-bold text-blue-600">{result.predicted_score_improvement.quantified_results}</div>
                                <div className="text-sm text-blue-700">Quantified Results</div>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                                <div className="text-lg font-bold text-purple-600">{result.predicted_score_improvement.formatting_fix}</div>
                                <div className="text-sm text-purple-700">Formatting Fix</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="flex flex-col h-[600px]">
                <CardHeader>
                    <CardTitle>Resume Assistant</CardTitle>
                    <CardDescription>
                        Chat with the AI to refine your resume. 
                        {result && (
                            <span className="text-green-600 font-medium"> The assistant has access to your ATS analysis and can provide targeted suggestions!</span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full pr-4" ref={chatContainerRef}>
                        <div className="space-y-4 font-code">
                        {chatHistory.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <Bot className="w-6 h-6 text-primary flex-shrink-0"/>}
                                <div className={`p-3 rounded-lg max-w-[80%] ${msg.role === 'model' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                                {msg.role === 'user' && <UserIcon className="w-6 h-6 text-muted-foreground flex-shrink-0"/>}
                            </div>
                        ))}
                         {isChatting && (
                            <div className="flex items-start gap-3">
                                <Bot className="w-6 h-6 text-primary flex-shrink-0"/>
                                <div className="p-3 rounded-lg bg-muted">
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        )}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="pt-4 border-t">
                    <div className="flex w-full items-center space-x-2">
                        <Input
                            type="text"
                            placeholder={result ? "Ask about improving your ATS score..." : "Ask for changes or advice..."}
                            value={userMessage}
                            onChange={(e) => setUserMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={isChatting}
                            className="font-code"
                        />
                        <Button type="submit" size="icon" onClick={handleSendMessage} disabled={isChatting || !userMessage.trim()}>
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
            </>
        )}

        {/* Cover Letter Results */}
        {coverLetterResult && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Generated Cover Letter
                  </CardTitle>
                  <CardDescription>
                    Personalized cover letter based on your resume and job description
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyCoverLetter}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadCoverLetter}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button size="sm" onClick={() => setIsAddCoverLetterDialogOpen(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Add to Directory
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cover Letter Content */}
              <div className="space-y-4">
                <h4 className="font-semibold">Cover Letter</h4>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                    {coverLetterResult.coverLetter}
                  </pre>
                </div>
              </div>

              {/* Key Points */}
              <div className="space-y-3">
                <h4 className="font-semibold">Key Points Highlighted</h4>
                <ul className="space-y-2">
                  {coverLetterResult.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Customization Tips */}
              <div className="space-y-3">
                <h4 className="font-semibold">Customization Tips</h4>
                <ul className="space-y-2">
                  {coverLetterResult.customizationTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {isGeneratingCoverLetter && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generating Cover Letter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        )}

        {!result && !isLoading && !coverLetterResult && !isGeneratingCoverLetter && (
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

      <AddCoverLetterDialog
        isOpen={isAddCoverLetterDialogOpen}
        onOpenChange={setIsAddCoverLetterDialogOpen}
        onSave={handleAddToDirectory}
        defaultText={coverLetterResult?.coverLetter || ''}
        defaultCompanyName={companyName}
        defaultJobTitle={jobTitle}
      />
    </div>
  );
}
