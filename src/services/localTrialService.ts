/**
 * Local-only trial: 3-day trial stored in localStorage.
 * No Firebase, no server cron — expiration is checked on each app load/refresh.
 *
 * If localStorage is cleared: no record → user is locked (NO_SUBSCRIPTION) until they
 * upgrade again. Trial is only started when they create a new shop (ShopSettings).
 */

import type { Subscription, BillingPlan } from '@/types';

const TRIAL_DAYS = 3;
const STORAGE_PREFIX = 'tailor_trial_';

function storageKey(shopId: string): string {
  return `${STORAGE_PREFIX}${shopId}`;
}

export type LocalTrialStatus = 'TRIAL' | 'TRIAL_EXPIRED' | 'ACTIVE' | 'NO_SUBSCRIPTION';

export interface LocalTrialRecord {
  trialEndsAt: number;
  status: LocalTrialStatus;
  currentPeriodEnd?: number;
  /** When upgraded locally */
  planId?: string;
}

const DEFAULT_TRIAL_PLAN: BillingPlan = {
  id: 'local-trial',
  name: 'Free Trial',
  type: 'FREE',
  price: 0,
  currency: 'GHS',
  billingCycle: 'MONTHLY',
  features: ['3-day full access'],
  limits: { customers: 100, orders: 500, teamMembers: 3, storage: 100 },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/** Start a 3-day trial for a shop (call when new shop is created). */
export function initLocalTrial(shopId: string): void {
  const trialEndsAt = Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const record: LocalTrialRecord = {
    trialEndsAt,
    status: 'TRIAL',
  };
  try {
    localStorage.setItem(storageKey(shopId), JSON.stringify(record));
  } catch (e) {
    console.warn('localTrialService: localStorage set failed', e);
  }
}

/** Read raw trial record from localStorage. */
export function getLocalTrial(shopId: string): LocalTrialRecord | null {
  try {
    const raw = localStorage.getItem(storageKey(shopId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalTrialRecord;
    return parsed;
  } catch {
    return null;
  }
}

/** Compute current status from stored record (expiration = now > trialEndsAt). */
function resolveStatus(record: LocalTrialRecord): LocalTrialStatus {
  const now = Date.now();
  if (record.status === 'ACTIVE' && record.currentPeriodEnd != null) {
    if (now > record.currentPeriodEnd) return 'TRIAL_EXPIRED'; // treat as expired
    return 'ACTIVE';
  }
  if (record.status === 'TRIAL' && now > record.trialEndsAt) {
    return 'TRIAL_EXPIRED';
  }
  return record.status;
}

/** Get subscription-like object for UI (TrialCountdown, getTrialStatus). */
export function getLocalTrialSubscription(shopId: string): Subscription | null {
  const record = getLocalTrial(shopId);
  if (!record) return null;

  const status = resolveStatus(record);
  const endMs = record.currentPeriodEnd ?? record.trialEndsAt;

  const sub: Subscription = {
    id: 'local',
    shopId,
    planId: record.planId ?? DEFAULT_TRIAL_PLAN.id,
    plan: DEFAULT_TRIAL_PLAN,
    status: status === 'TRIAL_EXPIRED' ? 'CANCELLED' : status === 'ACTIVE' ? 'ACTIVE' : 'TRIAL',
    currentPeriodStart: new Date(record.trialEndsAt - TRIAL_DAYS * 24 * 60 * 60 * 1000),
    currentPeriodEnd: new Date(endMs),
    billingCycle: 'MONTHLY',
    trialEndsAt: new Date(record.trialEndsAt),
    createdAt: new Date(record.trialEndsAt - TRIAL_DAYS * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  };
  return sub;
}

/** Check trial/subscription status (replaces Firebase checkSubscriptionStatus). */
export function checkLocalTrialStatus(shopId: string): {
  isActive: boolean;
  isLocked: boolean;
  status: string;
  daysUntilExpiry?: number;
} {
  const record = getLocalTrial(shopId);
  if (!record) {
    return { isActive: false, isLocked: true, status: 'NO_SUBSCRIPTION' };
  }

  const status = resolveStatus(record);
  const endMs = record.currentPeriodEnd ?? record.trialEndsAt;
  const now = Date.now();
  const daysUntilExpiry = Math.ceil((endMs - now) / (1000 * 60 * 60 * 24));

  if (status === 'TRIAL_EXPIRED' || status === 'NO_SUBSCRIPTION') {
    return {
      isActive: false,
      isLocked: true,
      status: status === 'TRIAL_EXPIRED' ? 'TRIAL_EXPIRED' : 'NO_SUBSCRIPTION',
    };
  }
  if (status === 'ACTIVE') {
    if (now > endMs) {
      return { isActive: false, isLocked: true, status: 'EXPIRED' };
    }
    return {
      isActive: true,
      isLocked: false,
      status: 'ACTIVE',
      daysUntilExpiry: Math.max(0, daysUntilExpiry),
    };
  }
  // TRIAL
  if (now > record.trialEndsAt) {
    return { isActive: false, isLocked: true, status: 'TRIAL_EXPIRED' };
  }
  return {
    isActive: true,
    isLocked: false,
    status: 'TRIAL',
    daysUntilExpiry: Math.max(0, daysUntilExpiry),
  };
}

/** Mark subscription as active (e.g. after payment). Call when user upgrades. */
export function activateLocalSubscription(
  shopId: string,
  periodEndMs: number,
  planId?: string
): void {
  const existing = getLocalTrial(shopId);
  const record: LocalTrialRecord = {
    trialEndsAt: existing?.trialEndsAt ?? Date.now(),
    status: 'ACTIVE',
    currentPeriodEnd: periodEndMs,
    planId,
  };
  try {
    localStorage.setItem(storageKey(shopId), JSON.stringify(record));
  } catch (e) {
    console.warn('localTrialService: localStorage set failed', e);
  }
}
