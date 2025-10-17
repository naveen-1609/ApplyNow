/**
 * Cached Service Functions
 * Service functions that use global cache to reduce API calls
 */

import { globalCache, GlobalCache } from '@/lib/cache/global-cache';
import { getApplications as getApplicationsService } from './applications';
import { getResumes as getResumesService } from './resumes';
import { getUserSettings as getUserSettingsService } from './users';
import { getTodayTarget } from './targets';
import { getSchedule } from './schedules';
import type { JobApplication, Resume, User, Target, Schedule } from '@/lib/types';

/**
 * Get applications with caching
 */
export async function getCachedApplications(userId: string): Promise<JobApplication[]> {
  return globalCache.get(
    GlobalCache.KEYS.applications(userId),
    () => getApplicationsService(userId),
    globalCache['TTL'].APPLICATIONS
  );
}

/**
 * Get resumes with caching
 */
export async function getCachedResumes(userId: string): Promise<Resume[]> {
  return globalCache.get(
    GlobalCache.KEYS.resumes(userId),
    () => getResumesService(userId),
    globalCache['TTL'].RESUMES
  );
}

/**
 * Get user settings with caching
 */
export async function getCachedUserSettings(userId: string): Promise<User | null> {
  return globalCache.get(
    GlobalCache.KEYS.userSettings(userId),
    () => getUserSettingsService(userId),
    globalCache['TTL'].USER_SETTINGS
  );
}

/**
 * Get today's target with caching
 */
export async function getCachedTodayTarget(userId: string): Promise<Target | null> {
  return globalCache.get(
    GlobalCache.KEYS.todayTarget(userId),
    () => getTodayTarget(userId),
    globalCache['TTL'].TARGETS
  );
}

/**
 * Get schedule with caching
 */
export async function getCachedSchedule(userId: string): Promise<Schedule | null> {
  return globalCache.get(
    GlobalCache.KEYS.schedules(userId),
    () => getSchedule(userId),
    globalCache['TTL'].SCHEDULES
  );
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
  globalCache.invalidateUser(userId);
}

/**
 * Update applications cache
 */
export function updateApplicationsCache(userId: string, applications: JobApplication[]): void {
  globalCache.set(GlobalCache.KEYS.applications(userId), applications, globalCache['TTL'].APPLICATIONS);
}

/**
 * Update resumes cache
 */
export function updateResumesCache(userId: string, resumes: Resume[]): void {
  globalCache.set(GlobalCache.KEYS.resumes(userId), resumes, globalCache['TTL'].RESUMES);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return globalCache.getStats();
}
