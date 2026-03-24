import type { Schedule, Target } from '@/lib/types';
import { fetchJson } from '@/lib/network/http-client';

type UserSettings = {
  email?: string | null;
  schedule?: Schedule;
  target?: Target | { daily_target: number };
};

export async function getUserSettingsClient(userId: string): Promise<UserSettings> {
  const data = await fetchJson<{ settings?: UserSettings }>(`/api/settings?userId=${encodeURIComponent(userId)}`, {
    cache: 'no-store',
  });
  return data.settings ?? {};
}

export async function updateUserSettingsClient(
  userId: string,
  settings: { schedule?: Partial<Schedule>; target?: { daily_target: number } }
): Promise<void> {
  await fetchJson('/api/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      settings,
    }),
  });
}
