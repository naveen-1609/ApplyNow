'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-optimized-auth';
import { OWNER_EMAIL, isOwnerEmail } from '@/lib/config/app-user';
import { Database, Mail, Shield, Sparkles, UserRound } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { listAdminPermissions, saveAdminPermission, type PermissionRecord } from '@/lib/services/permissions-client';
import type { PermissionLevel } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function AdminDashboard() {
  const { user } = useAuth();
  const isOwner = isOwnerEmail(user?.email);
  const { toast } = useToast();
  const [records, setRecords] = useState<PermissionRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<PermissionLevel>('records_only');
  const [accessEnabled, setAccessEnabled] = useState(true);

  const quickFacts = useMemo(
    () => [
      {
        title: 'Account Model',
        description: 'Owner-led workspace with invited user access.',
        icon: UserRound,
        value: `${records.filter((record) => record.access_enabled).length} approved`,
      },
      {
        title: 'Authorized Email',
        description: 'Permanent owner and admin account.',
        icon: Mail,
        value: OWNER_EMAIL,
      },
      {
        title: 'Feature Access',
        description: 'AI-enabled users get full tools, records-only users stay non-AI.',
        icon: Sparkles,
        value: isOwner ? 'Enabled' : 'Restricted',
      },
      {
        title: 'Permissions',
        description: 'Approval is controlled by email before sign-up.',
        icon: Database,
        value: '2 levels',
      },
    ],
    [isOwner, records]
  );

  const loadRecords = async () => {
    setLoadingRecords(true);
    try {
      const response = await listAdminPermissions();
      setRecords(response.records);
    } catch (error) {
      console.error('Failed to load permissions', error);
      toast({
        variant: 'destructive',
        title: 'Permissions failed to load',
        description: 'Could not load the approved user list.',
      });
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    void loadRecords();
  }, []);

  const handleSavePermission = async () => {
    if (!email.trim()) {
      toast({
        variant: 'destructive',
        title: 'Email required',
        description: 'Enter an email address to approve access.',
      });
      return;
    }

    setSaving(true);
    try {
      await saveAdminPermission({
        email,
        permissions,
        access_enabled: accessEnabled,
      });
      toast({
        title: 'Permission saved',
        description: `${email} can now ${accessEnabled ? 'access the workspace' : 'no longer sign in'}.`,
      });
      setEmail('');
      setPermissions('records_only');
      setAccessEnabled(true);
      await loadRecords();
    } catch (error) {
      console.error('Failed to save permission', error);
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: 'Could not update this permission record.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Workspace Admin</h1>
          <p className="text-muted-foreground">Single-user controls for your personal ApplyNow installation.</p>
        </div>
        <Badge variant="outline" className="gap-2 px-3 py-1">
          <Shield className="h-4 w-4" />
          {user?.email || OWNER_EMAIL}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickFacts.map((fact) => (
          <Card key={fact.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{fact.title}</CardTitle>
              <fact.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold break-all">{fact.value}</div>
              <p className="text-sm text-muted-foreground">{fact.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Status</CardTitle>
              <CardDescription>Owner access stays with you while invited users inherit the permission level you assign.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p><strong className="text-foreground">Admin:</strong> {OWNER_EMAIL}</p>
              <p><strong className="text-foreground">AI Features:</strong> Available to owner and users with `ai_features` permission.</p>
              <p><strong className="text-foreground">Records Only:</strong> Users can sign in and use tracking tools, but AI tools remain blocked.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approve User by Email</CardTitle>
              <CardDescription>Add or update an email so that person can sign up and inherit the selected permission level.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="permission-email">User Email</Label>
                <Input
                  id="permission-email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Permission Level</Label>
                <Select value={permissions} onValueChange={(value) => setPermissions(value as PermissionLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="records_only">Only Records</SelectItem>
                    <SelectItem value="ai_features">Enable AI Features</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Allow sign-in</p>
                  <p className="text-xs text-muted-foreground">Turn this off to revoke future access without deleting data.</p>
                </div>
                <Switch checked={accessEnabled} onCheckedChange={setAccessEnabled} />
              </div>
            </CardContent>
            <CardContent>
              <Button onClick={handleSavePermission} disabled={saving}>
                {saving ? 'Saving...' : 'Save Permission'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approved Users</CardTitle>
              <CardDescription>Current invite and access state for each email address.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingRecords ? (
                <p className="text-sm text-muted-foreground">Loading permissions...</p>
              ) : records.length === 0 ? (
                <p className="text-sm text-muted-foreground">No permission records yet.</p>
              ) : (
                records.map((record) => (
                  <div key={record.email} className="flex flex-col gap-2 rounded-2xl border border-border/70 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{record.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.isAdmin ? 'Admin owner' : record.permissions === 'ai_features' ? 'AI features enabled' : 'Records only'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{record.permissions}</Badge>
                      <Badge variant={record.access_enabled ? 'default' : 'secondary'}>
                        {record.access_enabled ? 'Allowed' : 'Blocked'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
