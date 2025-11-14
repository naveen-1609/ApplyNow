import { db } from '@/lib/firebase';
import {
  collection,
  query,
  getDocs,
  where,
  orderBy,
  limit,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { JobApplication, Resume } from '@/lib/types';

// Global cache for better performance
const dataCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Optimized data fetcher with caching
export class OptimizedDataService {
  private static instance: OptimizedDataService;
  
  static getInstance(): OptimizedDataService {
    if (!OptimizedDataService.instance) {
      OptimizedDataService.instance = new OptimizedDataService();
    }
    return OptimizedDataService.instance;
  }

  // Get cached data or fetch fresh
  async getCachedData<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    ttl: number = CACHE_TTL
  ): Promise<T> {
    const cached = dataCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`Cache hit for ${cacheKey}`);
      return cached.data;
    }

    console.log(`Cache miss for ${cacheKey}, fetching fresh data`);
    const data = await fetchFn();
    
    dataCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    });

    return data;
  }

  // Clear cache for a specific key
  clearCache(cacheKey: string): void {
    dataCache.delete(cacheKey);
  }

  // Clear all cache
  clearAllCache(): void {
    dataCache.clear();
  }

  // Get applications with optimized query
  async getApplications(userId: string): Promise<JobApplication[]> {
    console.log(`🔍 OptimizedDataService: Fetching applications for user ${userId}`);
    const startTime = Date.now();
    
    const result = await this.getCachedData(
      `applications_${userId}`,
      async () => {
        if (!db) {
          console.warn('❌ OptimizedDataService: Firestore not initialized');
          return [];
        }
        
        console.log('📊 OptimizedDataService: Executing Firestore query for applications');
        const applicationsCol = collection(db, 'job_applications');
        const q = query(
          applicationsCol,
          where('user_id', '==', userId),
          orderBy('last_updated', 'desc'),
          limit(100) // Limit to prevent large queries
        );
        
        const snapshot = await getDocs(q);
        const applications = snapshot.docs.map(this.fromFirestoreApplication);
        console.log(`✅ OptimizedDataService: Fetched ${applications.length} applications`);
        return applications;
      }
    );
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ OptimizedDataService: Applications fetch completed in ${duration}ms`);
    return result;
  }

  // Get resumes with optimized query
  async getResumes(userId: string): Promise<Resume[]> {
    console.log(`🔍 OptimizedDataService: Fetching resumes for user ${userId}`);
    const startTime = Date.now();
    
    const result = await this.getCachedData(
      `resumes_${userId}`,
      async () => {
        if (!db) {
          console.warn('❌ OptimizedDataService: Firestore not initialized');
          return [];
        }
        
        console.log('📊 OptimizedDataService: Executing Firestore query for resumes');
        const resumesCol = collection(db, 'resumes');
        const q = query(
          resumesCol,
          where('user_id', '==', userId),
          orderBy('created_at', 'desc'),
          limit(50) // Limit to prevent large queries
        );
        
        const snapshot = await getDocs(q);
        const resumes = snapshot.docs.map(this.fromFirestoreResume);
        console.log(`✅ OptimizedDataService: Fetched ${resumes.length} resumes`);
        
        // Debug: Log editable_text status for each resume
        resumes.forEach(resume => {
          console.log(`📋 Resume "${resume.resume_name}": editable_text length = ${resume.editable_text?.length || 0}, has text = ${!!resume.editable_text && resume.editable_text.length > 0}`);
        });
        
        return resumes;
      }
    );
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ OptimizedDataService: Resumes fetch completed in ${duration}ms`);
    return result;
  }

  // Convert Firestore document to JobApplication
  private fromFirestoreApplication = (doc: QueryDocumentSnapshot<DocumentData>): JobApplication => {
    const data = doc.data();
    return {
      job_id: doc.id,
      user_id: data.user_id,
      company_name: data.company_name,
      job_title: data.job_title,
      job_link: data.job_link,
      job_description: data.job_description,
      resume_id: data.resume_id,
      status: data.status,
      applied_date: data.applied_date?.toDate() || new Date(),
      last_updated: data.last_updated?.toDate() || new Date(),
    };
  };

  // Convert Firestore document to Resume
  private fromFirestoreResume = (doc: QueryDocumentSnapshot<DocumentData>): Resume => {
    const data = doc.data();
    const editableText = data.editable_text || '';
    console.log(`📄 Resume ${doc.id} (${data.resume_name}): editable_text length = ${editableText.length}`);
    return {
      resume_id: doc.id,
      user_id: data.user_id,
      resume_name: data.resume_name,
      file_url: data.file_url,
      storage_path: data.storage_path,
      editable_text: editableText, // Ensure it's always a string, default to empty
      extraction_warning: data.extraction_warning || null,
      created_at: data.created_at?.toDate() || new Date(),
    };
  };
}

// Export singleton instance
export const optimizedDataService = OptimizedDataService.getInstance();
