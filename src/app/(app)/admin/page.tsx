import { Suspense, lazy } from 'react';
import { AdminAuth } from '@/components/admin/admin-auth';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load admin dashboard to reduce initial bundle size
const AdminDashboard = lazy(() => import('@/components/admin/admin-dashboard').then(m => ({ default: m.AdminDashboard })));

export default function AdminPage() {
  return (
    <AdminAuth>
      <Suspense fallback={
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      }>
        <AdminDashboard />
      </Suspense>
    </AdminAuth>
  );
}
