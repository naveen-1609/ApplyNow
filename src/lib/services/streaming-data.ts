import { db } from '@/lib/firebase';
import { collection, query, getDocs, where, orderBy, limit, startAfter, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import type { JobApplication } from '@/lib/types';

// Streaming data service for progressive loading
export class StreamingDataService {
  private static instance: StreamingDataService;
  private cache = new Map<string, { data: any[]; lastDoc: QueryDocumentSnapshot | null; hasMore: boolean; timestamp: number }>();
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
  private readonly PAGE_SIZE = 20;

  static getInstance(): StreamingDataService {
    if (!StreamingDataService.instance) {
      StreamingDataService.instance = new StreamingDataService();
    }
    return StreamingDataService.instance;
  }

  // Stream applications with pagination
  async *streamApplications(userId: string, pageSize: number = this.PAGE_SIZE): AsyncGenerator<JobApplication[], void, unknown> {
    const cacheKey = `applications_stream_${userId}`;
    let lastDoc: QueryDocumentSnapshot | null = null;
    let hasMore = true;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      lastDoc = cached.lastDoc;
      hasMore = cached.hasMore;
      
      if (cached.data.length > 0) {
        yield cached.data;
      }
    }

    while (hasMore) {
      try {
        if (!db) throw new Error('Firestore is not initialized');
        const applicationsCol = collection(db, 'job_applications');
        let q = query(
          applicationsCol,
          where('user_id', '==', userId),
          orderBy('last_updated', 'desc'),
          limit(pageSize)
        );

        if (lastDoc) {
          q = query(
            applicationsCol,
            where('user_id', '==', userId),
            orderBy('last_updated', 'desc'),
            startAfter(lastDoc),
            limit(pageSize)
          );
        }

        const snapshot = await getDocs(q);
        const applications = snapshot.docs.map(this.fromFirestore);
        
        if (applications.length === 0) {
          hasMore = false;
          break;
        }

        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        hasMore = snapshot.docs.length === pageSize;

        // Update cache
        this.cache.set(cacheKey, {
          data: applications,
          lastDoc,
          hasMore,
          timestamp: Date.now()
        });

        yield applications;

        // Small delay to prevent overwhelming the UI
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error streaming applications:', error);
        break;
      }
    }
  }

  // Get initial batch of applications
  async getInitialApplications(userId: string, pageSize: number = this.PAGE_SIZE): Promise<{
    applications: JobApplication[];
    hasMore: boolean;
    lastDoc: QueryDocumentSnapshot | null;
  }> {
    const cacheKey = `applications_initial_${userId}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return {
        applications: cached.data,
        hasMore: cached.hasMore,
        lastDoc: cached.lastDoc
      };
    }

    try {
      if (!db) throw new Error('Firestore is not initialized');
      const applicationsCol = collection(db, 'job_applications');
      const q = query(
        applicationsCol,
        where('user_id', '==', userId),
        orderBy('last_updated', 'desc'),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const applications = snapshot.docs.map(this.fromFirestore);
      const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      const hasMore = snapshot.docs.length === pageSize;

      // Cache the result
      this.cache.set(cacheKey, {
        data: applications,
        lastDoc,
        hasMore,
        timestamp: Date.now()
      });

      return { applications, hasMore, lastDoc };
    } catch (error) {
      console.error('Error getting initial applications:', error);
      return { applications: [], hasMore: false, lastDoc: null };
    }
  }

  // Load more applications (pagination)
  async loadMoreApplications(
    userId: string, 
    lastDoc: QueryDocumentSnapshot, 
    pageSize: number = this.PAGE_SIZE
  ): Promise<{
    applications: JobApplication[];
    hasMore: boolean;
    lastDoc: QueryDocumentSnapshot | null;
  }> {
    try {
      if (!db) throw new Error('Firestore is not initialized');
      const applicationsCol = collection(db, 'job_applications');
      const q = query(
        applicationsCol,
        where('user_id', '==', userId),
        orderBy('last_updated', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const applications = snapshot.docs.map(this.fromFirestore);
      const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      const hasMore = snapshot.docs.length === pageSize;

      return { applications, hasMore, lastDoc: newLastDoc };
    } catch (error) {
      console.error('Error loading more applications:', error);
      return { applications: [], hasMore: false, lastDoc: null };
    }
  }

  // Invalidate cache for a user
  invalidateCache(userId: string): void {
    const keys = Array.from(this.cache.keys()).filter(key => key.includes(userId));
    keys.forEach(key => this.cache.delete(key));
  }

  // Convert Firestore document to JobApplication
  private fromFirestore = (doc: QueryDocumentSnapshot<DocumentData>): JobApplication => {
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
      applied_date: data.applied_date.toDate(),
      last_updated: data.last_updated.toDate(),
    };
  };
}

// Export singleton instance
export const streamingDataService = StreamingDataService.getInstance();
