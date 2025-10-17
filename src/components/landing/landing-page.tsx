'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/logo';
import { ArrowRight, CheckCircle, Target, FileText, BarChart3, Clock, Users, Zap, Sparkles, TrendingUp, Shield, Globe } from 'lucide-react';
import Link from 'next/link';

export function LandingPage() {
  const features = [
    {
      icon: <Target className="h-6 w-6" />,
      title: "Smart Job Targeting",
      description: "AI-powered job matching to find opportunities that align with your skills and career goals.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "ATS-Optimized Resumes",
      description: "Get your resume optimized for Applicant Tracking Systems to pass initial screenings.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Application Analytics",
      description: "Track your application success rates and get insights to improve your job search strategy.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Automated Follow-ups",
      description: "Never miss a follow-up opportunity with intelligent reminders and automated email sequences.",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Network Management",
      description: "Organize and track your professional network to leverage connections in your job search.",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Quick Applications",
      description: "Streamlined application process with saved templates and one-click submissions.",
      gradient: "from-yellow-500 to-orange-500"
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

  const stats = [
    { number: "10K+", label: "Active Users" },
    { number: "50K+", label: "Applications Sent" },
    { number: "85%", label: "Success Rate" },
    { number: "24/7", label: "AI Support" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 to-transparent rounded-full -translate-x-1/4 -translate-y-1/4 w-[200%] h-[200%]"></div>
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6 py-24 sm:px-8 lg:px-12">
          <div className="text-center max-w-5xl mx-auto">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <Logo className="h-20 w-20 text-primary" />
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                <TrendingUp className="h-4 w-4" />
                Trusted by 10,000+ job seekers
              </span>
            </div>
            
            <h1 className="font-headline text-6xl md:text-8xl font-bold text-foreground mb-8 leading-tight">
              Application
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 block">
                Console
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
              The ultimate job application management platform that helps you organize, optimize, and accelerate your career journey with AI-powered insights.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button asChild size="lg" className="text-lg px-10 py-7 font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300">
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-10 py-7 border-2 hover:bg-primary/5 transition-all duration-300">
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

      {/* Stats Section */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-20">
            <h2 className="font-headline text-5xl md:text-6xl font-bold text-foreground mb-8">
              Everything You Need to
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 block">
                Succeed
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Our comprehensive platform provides all the tools you need to streamline your job search and land your dream position.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-background/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`p-3 bg-gradient-to-r ${feature.gradient} rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-headline text-5xl md:text-6xl font-bold text-foreground mb-8">
                Why Choose
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 block">
                  ApplyNow?
                </span>
              </h2>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                Join thousands of job seekers who have transformed their career prospects with our intelligent platform.
              </p>
              
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-4 group">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <span className="text-foreground text-lg group-hover:text-primary transition-colors duration-300">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-12">
                <Button asChild size="lg" className="text-lg px-10 py-7 font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link href="/signup">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl transform rotate-3"></div>
              <Card className="relative bg-background/90 backdrop-blur-sm border-primary/20 p-10 shadow-2xl">
                <div className="text-center">
                  <div className="mb-8">
                    <div className="relative inline-block">
                      <Logo className="h-16 w-16 text-primary mx-auto" />
                      <div className="absolute -top-1 -right-1">
                        <Shield className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                  </div>
                  <h3 className="font-headline text-3xl font-bold text-foreground mb-6">
                    Ready to Get Started?
                  </h3>
                  <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                    Join ApplyNow today and take control of your job search with our powerful, AI-driven platform.
                  </p>
                  <div className="space-y-4">
                    <Button asChild className="w-full font-bold text-lg py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                      <Link href="/signup">Create Free Account</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full text-lg py-6 border-2 hover:bg-primary/5">
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
      <section className="py-24 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-5xl md:text-6xl font-bold text-foreground mb-8">
              Ready to Land Your Dream Job?
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Join thousands of successful job seekers who have accelerated their career with ApplyNow.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button asChild size="lg" className="text-lg px-10 py-7 font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300">
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-10 py-7 border-2 hover:bg-primary/5 transition-all duration-300">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
