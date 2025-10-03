'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithEmail, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmail(email, password);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
       <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/50 to-transparent rounded-full -translate-x-1/4 -translate-y-1/4 w-[200%] h-[200%]"></div>
      </div>
      <Card className="w-full max-w-sm z-10 bg-background/80 backdrop-blur-sm border-primary/20">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl text-primary">Welcome Back</CardTitle>
          <CardDescription>Sign in to your CareerPilot account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button className="w-full font-bold" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button 
            variant="outline"
            className="w-full font-bold" 
            onClick={signInWithGoogle}
            disabled={loading}
          >
             <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-69.4 69.4c-24.6-23.4-58.6-38.1-98.5-38.1-84.9 0-153.9 68.9-153.9 153.9s68.9 153.9 153.9 153.9c92.7 0 139.3-63.5 144.9-98.2H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path>
             </svg>
            Sign in with Google
          </Button>
        </CardContent>
        <CardFooter className="text-sm justify-center">
          <p>
            Don't have an account?{' '}
            <Link href="/signup" className="font-bold text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
