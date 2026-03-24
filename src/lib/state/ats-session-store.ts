import type { AtsAnalysisOutput } from '@/ai/flows/ats-checker-flow';

export type AtsChatMessage = {
  role: 'user' | 'model';
  content: string;
};

export type AtsStoredSession = {
  jobDescription: string;
  selectedResumeId?: string;
  result: AtsAnalysisOutput | null;
  chatHistory: AtsChatMessage[];
  ownerUid?: string;
  updatedAt?: number;
};

export const ATS_STORAGE_KEY = 'applynow:ats-checker:v1';

declare global {
  interface Window {
    __APPLYNOW_ATS_SESSION__?: AtsStoredSession;
  }
}

let atsSessionMemory: AtsStoredSession | null = null;

export function getDefaultAtsSession(): AtsStoredSession {
  return {
    jobDescription: '',
    selectedResumeId: undefined,
    result: null,
    chatHistory: [],
    ownerUid: undefined,
    updatedAt: undefined,
  };
}

export function hydrateAtsSession(): AtsStoredSession {
  if (typeof window !== 'undefined' && window.__APPLYNOW_ATS_SESSION__) {
    atsSessionMemory = window.__APPLYNOW_ATS_SESSION__;
    return window.__APPLYNOW_ATS_SESSION__;
  }

  if (atsSessionMemory) {
    return atsSessionMemory;
  }

  if (typeof window === 'undefined') {
    return getDefaultAtsSession();
  }

  try {
    const raw = window.localStorage.getItem(ATS_STORAGE_KEY);
    if (!raw) {
      return getDefaultAtsSession();
    }

    const parsed = JSON.parse(raw) as Partial<AtsStoredSession>;
    const restored: AtsStoredSession = {
      jobDescription: typeof parsed.jobDescription === 'string' ? parsed.jobDescription : '',
      selectedResumeId: typeof parsed.selectedResumeId === 'string' ? parsed.selectedResumeId : undefined,
      result: parsed.result ?? null,
      chatHistory: Array.isArray(parsed.chatHistory) ? parsed.chatHistory : [],
      ownerUid: typeof parsed.ownerUid === 'string' ? parsed.ownerUid : undefined,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : undefined,
    };

    atsSessionMemory = restored;
    window.__APPLYNOW_ATS_SESSION__ = restored;
    return restored;
  } catch (error) {
    console.warn('Failed to hydrate ATS session', error);
    return getDefaultAtsSession();
  }
}

export function persistAtsSession(session: AtsStoredSession) {
  const nextSession = {
    ...session,
    updatedAt: Date.now(),
  };
  atsSessionMemory = nextSession;

  if (typeof window === 'undefined') {
    return;
  }

  window.__APPLYNOW_ATS_SESSION__ = nextSession;

  try {
    window.localStorage.setItem(ATS_STORAGE_KEY, JSON.stringify(nextSession));
  } catch (error) {
    console.warn('Failed to persist ATS session', error);
  }
}

export function clearAtsSession() {
  atsSessionMemory = getDefaultAtsSession();

  if (typeof window === 'undefined') {
    return;
  }

  window.__APPLYNOW_ATS_SESSION__ = atsSessionMemory;
  window.localStorage.removeItem(ATS_STORAGE_KEY);
}
