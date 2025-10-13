import { db } from '@/lib/firebase';
import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  where,
  orderBy,
  limit,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Query,
} from 'firebase/firestore';

// Connection pooling and query optimization
class FirestoreOptimizer {
  private queryCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for queries
  private readonly MAX_CACHE_SIZE = 50;

  // Optimized query with caching
  async executeQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    useCache: boolean = true
  ): Promise<T> {
    // Check cache first
    if (useCache && this.queryCache.has(queryKey)) {
      const cached = this.queryCache.get(queryKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
    }

    // Execute query
    const result = await queryFn();

    // Cache result
    if (useCache) {
      this.cacheResult(queryKey, result);
    }

    return result;
  }

  private cacheResult(key: string, data: any) {
    // Implement LRU cache eviction
    if (this.queryCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.queryCache.keys().next().value;
      if (firstKey) this.queryCache.delete(firstKey);
    }

    this.queryCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Clear cache for specific user
  clearUserCache(userId: string) {
    for (const key of this.queryCache.keys()) {
      if (key.includes(userId)) {
        this.queryCache.delete(key);
      }
    }
  }

  // Clear all cache
  clearAllCache() {
    this.queryCache.clear();
  }
}

export const firestoreOptimizer = new FirestoreOptimizer();

// Optimized applications service
export const getApplicationsOptimized = async (userId: string): Promise<any[]> => {
  const queryKey = `applications_${userId}`;
  
  return firestoreOptimizer.executeQuery(queryKey, async () => {
    if (!db) throw new Error("Firestore is not initialized.");
    
    const applicationsCol = collection(db, 'job_applications');
    const q = query(
      applicationsCol,
      where('user_id', '==', userId),
      orderBy('last_updated', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      job_id: doc.id,
      user_id: doc.data().user_id,
      company_name: doc.data().company_name,
      job_title: doc.data().job_title,
      job_link: doc.data().job_link,
      job_description: doc.data().job_description,
      resume_id: doc.data().resume_id,
      status: doc.data().status,
      applied_date: doc.data().applied_date.toDate(),
      last_updated: doc.data().last_updated.toDate(),
    }));
  });
};

// Optimized resumes service
export const getResumesOptimized = async (userId: string): Promise<any[]> => {
  const queryKey = `resumes_${userId}`;
  
  return firestoreOptimizer.executeQuery(queryKey, async () => {
    if (!db) return [];
    
    const resumesCol = collection(db, 'resumes');
    const q = query(
      resumesCol,
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      resume_id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at.toDate(),
    }));
  });
};

// Batch operations for better performance
export const batchUpdateApplications = async (
  userId: string,
  updates: Array<{ id: string; data: any }>
): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized.");
  
  // Clear cache before batch update
  firestoreOptimizer.clearUserCache(userId);
  
  // Execute batch updates
  const promises = updates.map(({ id, data }) => {
    if (!db) throw new Error('Firestore is not initialized');
    const docRef = doc(db, 'job_applications', id);
    return updateDoc(docRef, {
      ...data,
      last_updated: Timestamp.now(),
    });
  });
  
  await Promise.all(promises);
};
