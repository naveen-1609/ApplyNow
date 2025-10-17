/**
 * Cached Service Functions
 * Service functions that use global cache to reduce API calls
 */

import { globalCache } from '@/lib/cache/global-cache';
import { getApplications } from './applications';
import { getResumes } from './resumes';
import { getUserSettings } from './users';
import { getTodayTarget } from './targets';
import { getSchedule } from './schedules';
import type { JobApplication, Resume, User, Target, Schedule } from '@/lib/types';

const CACHE_TTL_APPLICATIONS = 2 * 60 * 1000; // 2 minutes
const CACHE_TTL_RESUMES = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_USER_SETTINGS = 1 * 60 * 1000; // 1 minute
const CACHE_TTL_TODAY_TARGET = 1 * 60 * 1000; // 1 minute
const CACHE_TTL_SCHEDULES = 5 * 60 * 1000; // 5 minutes

/**
 * Get applications with caching
 */
export async function getCachedApplications(userId: string): Promise<JobApplication[]> {
  return globalCache.get(`applications-${userId}`, () => getApplications(userId), CACHE_TTL_APPLICATIONS);
}

/**
 * Get resumes with caching
 */
export async function getCachedResumes(userId: string): Promise<Resume[]> {
  return globalCache.get(`resumes-${userId}`, () => getResumes(userId), CACHE_TTL_RESUMES);
}

/**
 * Get user settings with caching
 */
export async function getCachedUserSettings(userId: string): Promise<User | null> {
  return globalCache.get(`user-settings-${userId}`, () => getUserSettings(userId), CACHE_TTL_USER_SETTINGS);
}

/**
 * Get today's target with caching
 */
export async function getCachedTodayTarget(userId: string): Promise<Target | null> {
  return globalCache.get(`today-target-${userId}`, () => getTodayTarget(userId), CACHE_TTL_TODAY_TARGET);
}

/**
 * Get schedule with caching
 */
export async function getCachedSchedule(userId: string): Promise<Schedule | null> {
  return globalCache.get(`schedule-${userId}`, () => getSchedule(userId), CACHE_TTL_SCHEDULES);
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
