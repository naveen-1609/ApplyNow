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
import { analyzeResume, chatWithResumeAssistant, AtsAnalysisOutput, ChatInput } from '@/ai/flows/ats-checker-flow';
import { AlertCircle, Bot, Send, User as UserIcon } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-auth';
import type { Resume } from '@/lib/types';
import { getResumes } from '@/lib/services/resumes';


type ChatMessage = {
    role: 'user' | 'model';
    content: string;
};

export function AtsCheckerTool() {
  const { user } = useAuth();
  const [jobDescription, setJobDescription] = useState('');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [result, setResult] = useState<AtsAnalysisOutput | null>(null);
  const { toast } = useToast();
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchResumes = async () => {
        if(user) {
            const userResumes = await getResumes(user.uid);
            setResumes(userResumes);
            if (userResumes.length > 0) {
                setSelectedResumeId(userResumes[0].resume_id);
            }
        }
    }
    fetchResumes();
  }, [user]);

  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);


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
    };

    setIsLoading(true);
    setResult(null);
    setChatHistory([]);
    try {
        // Debug: Log the resume text being sent
        console.log('Resume text being sent to ATS:', selectedResume.editable_text);
        console.log('Resume text length:', selectedResume.editable_text?.length);
        console.log('First 200 characters:', selectedResume.editable_text?.substring(0, 200));
        
        const analysis = await analyzeResume({
            jobDescription,
            resumeText: selectedResume.editable_text,
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

    const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
    setChatHistory(prev => [...prev, newUserMessage]);
    setUserMessage('');
    setIsChatting(true);
    
    try {
        const chatInput: ChatInput = {
            jobDescription,
            resumeText: selectedResume.editable_text,
            chatHistory: [...chatHistory, newUserMessage],
            userMessage: userMessage,
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


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1">
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
          <Select onValueChange={setSelectedResumeId} value={selectedResumeId} disabled={isLoading || resumes.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder="Select a resume" />
            </SelectTrigger>
            <SelectContent>
              {resumes.map((resume) => (
                <SelectItem key={resume.resume_id} value={resume.resume_id}>
                  {resume.resume_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
        <CardFooter>
          <Button onClick={handleAnalyze} disabled={isLoading || resumes.length === 0} className="w-full">
            {isLoading ? 'Analyzing...' : resumes.length === 0 ? 'Upload a resume first' : 'Analyze Resume'}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="lg:col-span-2 space-y-8">
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
                    <CardDescription>Chat with the AI to refine your resume.</CardDescription>
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
                            placeholder="Ask for changes or advice..."
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

        {!result && !isLoading && (
            <Card className="lg:col-span-2 flex items-center justify-center h-96">
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
