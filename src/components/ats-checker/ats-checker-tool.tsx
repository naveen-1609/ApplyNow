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
import { mockResumes } from '@/lib/mock-data';
import { analyzeResume, chatWithResumeAssistant, AtsAnalysisOutput, ChatInput } from '@/ai/flows/ats-checker-flow';
import { AlertCircle, Bot, Send, User as UserIcon } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';

type ChatMessage = {
    role: 'user' | 'model';
    content: string;
};

export function AtsCheckerTool() {
  const [jobDescription, setJobDescription] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(mockResumes[0]?.resume_id);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [result, setResult] = useState<AtsAnalysisOutput | null>(null);
  const { toast } = useToast();
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
    const selectedResume = mockResumes.find(r => r.resume_id === selectedResumeId);
    if (!selectedResume) return;

    setIsLoading(true);
    setResult(null);
    setChatHistory([]);
    try {
        const analysis = await analyzeResume({
            jobDescription,
            resumeText: selectedResume.editable_text,
        });
        setResult(analysis);
        setChatHistory([
            { role: 'model', content: `Your resume has a match score of ${analysis.matchScore}%. Here are my suggestions. How can I help you improve it?` }
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

    const currentResumeText = mockResumes.find(r => r.resume_id === selectedResumeId)?.editable_text || '';

    const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
    setChatHistory(prev => [...prev, newUserMessage]);
    setUserMessage('');
    setIsChatting(true);
    
    try {
        const chatInput: ChatInput = {
            jobDescription,
            resumeText: currentResumeText,
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
          <Select onValueChange={setSelectedResumeId} defaultValue={selectedResumeId} disabled={isLoading}>
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
          <Button onClick={handleAnalyze} disabled={isLoading} className="w-full">
            {isLoading ? 'Analyzing...' : 'Analyze Resume'}
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
                    <CardTitle>Analysis Result</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="font-semibold text-muted-foreground">Match Score</h3>
                            <span className="font-bold text-primary text-lg">{result.matchScore}%</span>
                        </div>
                        <Progress value={result.matchScore} className="h-3"/>
                    </div>
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Summary</AlertTitle>
                        <AlertDescription>{result.summary}</AlertDescription>
                    </Alert>
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
