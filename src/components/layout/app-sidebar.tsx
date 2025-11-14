'use client';

import { memo, useMemo } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/icons/logo';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Target,
  Settings,
  LogOut,
  ScanSearch,
  User,
  Shield,
  Crown,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-optimized-auth';
import { useSubscription } from '@/hooks/use-subscription';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/applications', icon: Briefcase, label: 'Applications' },
  { href: '/resumes', icon: FileText, label: 'Resumes' },
  { href: '/cover-letters', icon: Mail, label: 'Cover Letters' },
  { href: '/ats-checker', icon: ScanSearch, label: 'ATS Checker' },
  { href: '/targets', icon: Target, label: 'Targets' },
  { href: '/subscriptions', icon: Crown, label: 'Subscriptions' },
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export const AppSidebar = memo(function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { isAdmin } = useSubscription();

  if (!user) return null;

  // Check if user is admin - use email check as primary (for immediate access)
  // and profile check as secondary (for consistency)
  const isAdminUser = useMemo(
    () => user.email?.toLowerCase() === 'naveenvenkat58@gmail.com' || isAdmin,
    [user.email, isAdmin]
  );

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="size-8" />
          <h1 className="font-headline text-xl font-bold">Application Console</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          
          {/* Admin Dashboard Link - Only visible for admin email */}
          {isAdminUser && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/admin')}
                tooltip="Admin Dashboard"
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <Link href="/admin">
                  <Shield />
                  <span>Admin Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
            <AvatarFallback>{user.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate">{user.displayName}</span>
            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
          </div>
          <SidebarMenuButton variant="outline" size="sm" className="ml-auto group-data-[collapsible=icon]:hidden" onClick={signOut}>
            <LogOut />
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
});
