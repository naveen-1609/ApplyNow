'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-optimized-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { subscriptionService } from '@/lib/subscription/subscription-service';
import { Shield, Lock } from 'lucide-react';

interface AdminAuthProps {
  children: React.ReactNode;
}

export function AdminAuth({ children }: AdminAuthProps) {
  const { user, loading: authLoading } = useAuth();
  const { userProfile, loading: profileLoading, isAdmin } = useSubscription();
  const router = useRouter();
  const { toast } = useToast();
  const [adminPassword, setAdminPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    console.log('AdminAuth - Auth state:', { 
      user: user?.email, 
      authLoading, 
      profileLoading, 
      isAdmin,
      userProfile: !!userProfile 
    });

    if (!authLoading && !profileLoading) {
      if (!user) {
        console.log('AdminAuth - No user, redirecting to login');
        router.push('/login');
        return;
      }
      
      // Check if user is the hardcoded admin
      if (user.email === 'naveenvenkat58@gmail.com') {
        console.log('AdminAuth - Admin user detected, showing password form');
        setShowPasswordForm(true);
      } else {
        console.log('AdminAuth - Non-admin user, denying access');
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges.',
          variant: 'destructive'
        });
        router.push('/dashboard');
      }
    }
  }, [user, userProfile, isAdmin, authLoading, profileLoading, router, toast]);

  const handleAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (adminPassword !== '123123123') {
      toast({
        title: 'Invalid Password',
        description: 'The admin password is incorrect.',
        variant: 'destructive'
      });
      return;
    }

    setPasswordLoading(true);
    try {
      // For now, just grant access without updating the database
      // This will be enhanced once the basic system is working
      setShowPasswordForm(false);
      toast({
        title: 'Access Granted',
        description: 'Welcome to the admin dashboard.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to grant admin access.',
        variant: 'destructive'
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (showPasswordForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              Enter the admin password to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminPassword} className="space-y-4">
              <div>
                <Label htmlFor="admin-password">Admin Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-password"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  'Access Dashboard'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user && user.email !== 'naveenvenkat58@gmail.com') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
