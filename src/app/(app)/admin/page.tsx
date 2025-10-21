import { AdminAuth } from '@/components/admin/admin-auth';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

export default function AdminPage() {
  return (
    <AdminAuth>
      <AdminDashboard />
    </AdminAuth>
  );
}
