'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/icons/logo';

export default function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo className="h-12 w-12" />
          </div>
          <CardTitle className="font-headline text-2xl">Welcome to CareerPilot</CardTitle>
          <CardDescription>Your copilot for navigating the job market.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full" 
            onClick={signInWithGoogle}
            disabled={loading}
          >
             <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-69.4 69.4c-24.6-23.4-58.6-38.1-98.5-38.1-84.9 0-153.9 68.9-153.9 153.9s68.9 153.9 153.9 153.9c92.7 0 139.3-63.5 144.9-98.2H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path>
             </svg>
            {loading ? 'Loading...' : 'Sign in with Google'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
