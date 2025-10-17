'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/logo';
import { ArrowRight, CheckCircle, Target, FileText, BarChart3, Clock, Users, Zap } from 'lucide-react';
import Link from 'next/link';

export function LandingPage() {
  const features = [
    {
      icon: <Target className="h-6 w-6" />,
      title: "Smart Job Targeting",
      description: "AI-powered job matching to find opportunities that align with your skills and career goals."
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "ATS-Optimized Resumes",
      description: "Get your resume optimized for Applicant Tracking Systems to pass initial screenings."
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Application Analytics",
      description: "Track your application success rates and get insights to improve your job search strategy."
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Automated Follow-ups",
      description: "Never miss a follow-up opportunity with intelligent reminders and automated email sequences."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Network Management",
      description: "Organize and track your professional network to leverage connections in your job search."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Quick Applications",
      description: "Streamlined application process with saved templates and one-click submissions."
    }
  ];

  const benefits = [
    "Increase application success rate by 3x",
    "Save 10+ hours per week on job searching",
    "Get personalized job recommendations",
    "Track progress with detailed analytics",
    "Never miss important deadlines",
    "Professional resume optimization"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 to-transparent rounded-full -translate-x-1/4 -translate-y-1/4 w-[200%] h-[200%]"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8 flex justify-center">
              <Logo className="h-16 w-16 text-primary" />
            </div>
            
            <h1 className="font-headline text-5xl md:text-7xl font-bold text-foreground mb-6">
              Land Your
              <span className="text-primary block">Dream Job</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              The ultimate job application management platform that helps you organize, optimize, and accelerate your career journey with AI-powered insights.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button asChild size="lg" className="text-lg px-8 py-6 font-bold">
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Setup in 2 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-headline text-4xl md:text-5xl font-bold text-foreground mb-6">
              Everything You Need to
              <span className="text-primary block">Succeed</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools you need to streamline your job search and land your dream position.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-headline text-4xl md:text-5xl font-bold text-foreground mb-6">
                Why Choose
                <span className="text-primary block">ApplyNow?</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Join thousands of job seekers who have transformed their career prospects with our intelligent platform.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <Button asChild size="lg" className="text-lg px-8 py-6 font-bold">
                  <Link href="/signup">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl transform rotate-3"></div>
              <Card className="relative bg-background/80 backdrop-blur-sm border-primary/20 p-8">
                <div className="text-center">
                  <div className="mb-6">
                    <Logo className="h-12 w-12 text-primary mx-auto" />
                  </div>
                  <h3 className="font-headline text-2xl font-bold text-foreground mb-4">
                    Ready to Get Started?
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Join ApplyNow today and take control of your job search with our powerful, AI-driven platform.
                  </p>
                  <div className="space-y-3">
                    <Button asChild className="w-full font-bold">
                      <Link href="/signup">Create Free Account</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/login">Sign In</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-headline text-4xl md:text-5xl font-bold text-foreground mb-6">
            Ready to Land Your Dream Job?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of successful job seekers who have accelerated their career with ApplyNow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6 font-bold">
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
