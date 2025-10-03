import { PageHeader } from '@/components/shared/page-header';
import { NotificationsForm } from '@/components/settings/notifications-form';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your application settings and preferences."
      />
      <div className="max-w-2xl">
        <NotificationsForm />
      </div>
    </div>
  );
}
