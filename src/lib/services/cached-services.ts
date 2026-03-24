/**
 * Cached Service Functions
 * Service functions that use global cache to reduce API calls
 */

import { globalCache } from '@/lib/cache/global-cache';
import { getApplications } from './applications';
import { getResumes } from './resumes';
import { getUserSettingsClient } from './user-settings-client';
import { getTodayTarget } from './targets';
import { getSchedule } from './schedules';
import type { JobApplication, Resume, Target, Schedule } from '@/lib/types';

/**
 * Get applications with caching
 */
export async function getCachedApplications(userId: string): Promise<JobApplication[]> {
  return globalCache.get(`applications-${userId}`, () => getApplications(userId), globalCache.TTL.APPLICATIONS);
}

/**
 * Get resumes with caching
 */
export async function getCachedResumes(userId: string): Promise<Resume[]> {
  return globalCache.get(`resumes-${userId}`, () => getResumes(userId), globalCache.TTL.RESUMES);
}

/**
 * Get user settings with caching
 */
export async function getCachedUserSettings(userId: string): Promise<Record<string, unknown> | null> {
  return globalCache.get(`user-settings-${userId}`, () => getUserSettingsClient(userId), globalCache.TTL.USER_SETTINGS);
}

/**
 * Get today's target with caching
 */
export async function getCachedTodayTarget(userId: string): Promise<Target | null> {
  return globalCache.get(`today-target-${userId}`, () => getTodayTarget(userId), globalCache.TTL.TARGETS);
}

/**
 * Get schedule with caching
 */
export async function getCachedSchedule(userId: string): Promise<Schedule | null> {
  return globalCache.get(`schedule-${userId}`, () => getSchedule(userId), globalCache.TTL.SCHEDULES);
}

/**
 * Get all user data in parallel with caching
 */
export async function getCachedUserData(userId: string) {
  const [applications, resumes, userSettings, todayTarget, schedule] = await Promise.all([
    getCachedApplications(userId),
    getCachedResumes(userId),
    getCachedUserSettings(userId),
    getCachedTodayTarget(userId),
    getCachedSchedule(userId),
  ]);

  return {
    applications,
    resumes,
    userSettings,
    todayTarget,
    schedule,
  };
}

/**
 * Invalidate user cache
 */
export function invalidateUserCache(userId: string): void {
  globalCache.invalidate(`applications-${userId}`);
  globalCache.invalidate(`resumes-${userId}`);
  globalCache.invalidate(`user-settings-${userId}`);
  globalCache.invalidate(`today-target-${userId}`);
  globalCache.invalidate(`schedule-${userId}`);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return globalCache.getStats();
}
