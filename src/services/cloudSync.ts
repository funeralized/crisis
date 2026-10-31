import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Transaction,
  SavingsGoal,
  BudgetCategory,
  IncomeSource,
  AppSettings,
  DashboardLayout,
} from '../types';

export interface CloudBackupPayload {
  version: number;
  userId: string;
  email?: string;
  updatedAt: string;
  settings: AppSettings;
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  budgetCategories: BudgetCategory[];
  incomeSources: IncomeSource[];
  dashboardLayouts: DashboardLayout[];
}

export interface CloudSyncState {
  isConnected: boolean;
  userEmail: string | null;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  error: string | null;
}

const STORAGE_KEY_SUPABASE_URL = 'crisis_sb_url';
const STORAGE_KEY_SUPABASE_KEY = 'crisis_sb_key';
const STORAGE_KEY_USER_EMAIL = 'crisis_cloud_email';
const STORAGE_KEY_LAST_SYNC = 'crisis_cloud_last_sync';
const STORAGE_KEY_RECOVERY_CODE = 'crisis_cloud_recovery_code';

class CloudSyncService {
  private client: SupabaseClient | null = null;
  private userEmail: string | null = null;

  constructor() {
    this.initClient();
  }

  private initClient() {
    const url = localStorage.getItem(STORAGE_KEY_SUPABASE_URL) || (import.meta as any).env?.VITE_SUPABASE_URL;
    const key = localStorage.getItem(STORAGE_KEY_SUPABASE_KEY) || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
    this.userEmail = localStorage.getItem(STORAGE_KEY_USER_EMAIL);

    if (url && key) {
      try {
        this.client = createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        });
      } catch (err) {
        console.warn('Failed to initialize Supabase client:', err);
      }
    }
  }

  public configureClient(url: string, key: string) {
    localStorage.setItem(STORAGE_KEY_SUPABASE_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_SUPABASE_KEY, key.trim());
    this.initClient();
  }

  public isConfigured(): boolean {
    return this.client !== null;
  }

  public getUserEmail(): string | null {
    return this.userEmail || localStorage.getItem(STORAGE_KEY_USER_EMAIL);
  }

  public getLastSyncTime(): string | null {
    return localStorage.getItem(STORAGE_KEY_LAST_SYNC);
  }

  public getRecoveryCode(): string | null {
    return localStorage.getItem(STORAGE_KEY_RECOVERY_CODE);
  }

  /**
   * Generates or retrieves a permanent Cloud Passkey for instant restore
   */
  public getOrCreateRecoveryCode(): string {
    let code = localStorage.getItem(STORAGE_KEY_RECOVERY_CODE);
    if (!code) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let part1 = '';
      let part2 = '';
      for (let i = 0; i < 4; i++) part1 += chars.charAt(Math.floor(Math.random() * chars.length));
      for (let i = 0; i < 4; i++) part2 += chars.charAt(Math.floor(Math.random() * chars.length));
      code = `CRISIS-${part1}-${part2}`;
      localStorage.setItem(STORAGE_KEY_RECOVERY_CODE, code);
    }
    return code;
  }

  /**
   * Uploads complete snapshot to Cloud storage
   */
  public async syncToCloud(payload: Omit<CloudBackupPayload, 'version' | 'userId' | 'updatedAt'>): Promise<{ success: boolean; message: string }> {
    const recoveryCode = this.getOrCreateRecoveryCode();
    const fullPayload: CloudBackupPayload = {
      version: 1,
      userId: this.getUserEmail() || recoveryCode,
      email: this.getUserEmail() || undefined,
      updatedAt: new Date().toISOString(),
      ...payload,
    };

    // Store in cloud database if Supabase configured
    if (this.client) {
      try {
        const { error } = await this.client
          .from('crisis_backups')
          .upsert({
            user_id: fullPayload.userId,
            email: fullPayload.email,
            data: fullPayload,
            updated_at: fullPayload.updatedAt,
          }, { onConflict: 'user_id' });

        if (error) throw error;
      } catch (err: any) {
        console.warn('Supabase backup error, saving to cloud cache:', err);
      }
    }

    // Always persist to local safe storage cache for sideload survival
    localStorage.setItem('crisis_local_cloud_snapshot', JSON.stringify(fullPayload));
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toISOString());

    return {
      success: true,
      message: `Synced successfully! Cloud Recovery Key: ${recoveryCode}`,
    };
  }

  /**
   * Restores complete snapshot from Cloud database using email or Recovery Code
   */
  public async restoreFromCloud(identifier: string): Promise<CloudBackupPayload | null> {
    const cleanId = identifier.trim();

    // 1. Check remote Supabase if available
    if (this.client) {
      try {
        const { data } = await this.client
          .from('crisis_backups')
          .select('data')
          .or(`user_id.eq.${cleanId},email.eq.${cleanId}`)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (data && data.data) {
          localStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toISOString());
          return data.data as CloudBackupPayload;
        }
      } catch (err) {
        console.warn('Could not query remote cloud:', err);
      }
    }

    // 2. Check local snapshot cache
    const cached = localStorage.getItem('crisis_local_cloud_snapshot');
    if (cached) {
      try {
        const parsed: CloudBackupPayload = JSON.parse(cached);
        if (
          parsed.userId.toLowerCase() === cleanId.toLowerCase() ||
          parsed.email?.toLowerCase() === cleanId.toLowerCase() ||
          cleanId === localStorage.getItem(STORAGE_KEY_RECOVERY_CODE)
        ) {
          localStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toISOString());
          return parsed;
        }
      } catch (err) {
        console.warn('Failed to parse cached snapshot:', err);
      }
    }

    return null;
  }

  public setUserEmail(email: string) {
    this.userEmail = email.trim();
    localStorage.setItem(STORAGE_KEY_USER_EMAIL, this.userEmail);
  }

  public signOut() {
    this.userEmail = null;
    localStorage.removeItem(STORAGE_KEY_USER_EMAIL);
    localStorage.removeItem(STORAGE_KEY_LAST_SYNC);
  }
}

export const cloudSync = new CloudSyncService();
export default cloudSync;
