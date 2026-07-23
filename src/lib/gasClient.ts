/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProductionEntry, ActivityLog, FactoryFloor, KPIMetric, LedgerRecord } from '../types';
import { UserRecord } from '../components/UserManagementView';

/**
 * Service client for communicating with the Google Apps Script REST API.
 * Safely falls back to LocalStorage mock database when GAS Web App URL is not configured.
 */
export class GasClient {
  /**
   * Fetches the central database configuration from the full-stack server
   * and synchronizes it with local device storage.
   */
  static async fetchServerConfig(): Promise<{ gasWebAppUrl: string; databaseMode: 'mock' | 'gas' }> {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.config) {
          const { gasWebAppUrl, databaseMode } = json.config;
          const localUrl = localStorage.getItem('setting_gasWebAppUrl') || '';
          
          if (gasWebAppUrl && gasWebAppUrl.trim()) {
            this.setWebAppUrl(gasWebAppUrl.trim());
            this.setDatabaseMode(databaseMode || 'gas');
          } else if (localUrl.trim()) {
            // Push existing local configuration to central server so other devices get connected
            await this.saveServerConfig(localUrl, (localStorage.getItem('setting_databaseMode') as 'mock' | 'gas') || 'gas');
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch server configuration, using local storage fallback:", err);
    }

    return {
      gasWebAppUrl: this.getWebAppUrl(),
      databaseMode: this.getDatabaseMode(),
    };
  }

  /**
   * Persists database settings centrally on the server so all devices stay connected automatically.
   */
  static async saveServerConfig(url: string, mode: 'mock' | 'gas'): Promise<void> {
    const trimmedUrl = url.trim();
    this.setWebAppUrl(trimmedUrl);
    this.setDatabaseMode(mode);

    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gasWebAppUrl: trimmedUrl, databaseMode: mode }),
      });
    } catch (err) {
      console.error("Failed to save central server config:", err);
    }
  }

  static DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbzfsNc4kKa3jcyeC646qmVWhaCyvJKWMlGwvcRRJeDLqaTS61bIIteWEYvVb_Gk_Q/exec';

  /**
   * Retrieves the current database mode ('mock' or 'gas')
   */
  static getDatabaseMode(): 'mock' | 'gas' {
    if (typeof window === 'undefined') return 'gas';
    return (localStorage.getItem('setting_databaseMode') as 'mock' | 'gas') || 'gas';
  }

  /**
   * Sets the database mode
   */
  static setDatabaseMode(mode: 'mock' | 'gas') {
    localStorage.setItem('setting_databaseMode', mode);
  }

  /**
   * Retrieves the configured Google Apps Script Web App URL
   */
  static getWebAppUrl(): string {
    if (typeof window === 'undefined') return this.DEFAULT_URL;
    return localStorage.getItem('setting_gasWebAppUrl') || this.DEFAULT_URL;
  }

  /**
   * Sets the Google Apps Script Web App URL
   */
  static setWebAppUrl(url: string) {
    localStorage.setItem('setting_gasWebAppUrl', url.trim());
  }

  /**
   * Fetches the central database store from the full-stack server
   */
  static async fetchServerDb(): Promise<any> {
    try {
      const res = await fetch('/api/db');
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.db) {
          return json.db;
        }
      }
    } catch (err) {
      console.warn("Could not fetch server DB:", err);
    }
    return null;
  }

  /**
   * Updates the central database store on the full-stack server
   */
  static async saveServerDb(partial: any): Promise<void> {
    try {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial)
      });
    } catch (err) {
      console.error("Could not save server DB:", err);
    }
  }

  /**
   * Performs an API request to the Google Apps Script endpoint via the server proxy.
   * If proxy is unavailable (e.g., on static Vercel hosting), falls back to direct fetch.
   */
  private static async request<T>(action: string, method: 'GET' | 'POST', bodyData?: any): Promise<{ success: boolean; message?: string; data?: T }> {
    const webAppUrl = this.getWebAppUrl() || this.DEFAULT_URL;
    const currentUserStr = typeof window !== 'undefined' ? localStorage.getItem('active_knitting_user') : null;
    let uid = 'ANONYMOUS';
    let token = '';
    if (currentUserStr) {
      try {
        const parsed = JSON.parse(currentUserStr);
        uid = parsed.uid || 'ANONYMOUS';
        token = parsed.token || '';
      } catch(e) {}
    }

    // Try server proxy first
    try {
      if (method === 'GET') {
        const queryParams = new URLSearchParams();
        queryParams.append('action', action);
        queryParams.append('url', webAppUrl);
        if (bodyData) {
          Object.entries(bodyData).forEach(([k, v]) => {
            if (v !== undefined && v !== null) {
              queryParams.append(k, String(v));
            }
          });
        }

        const response = await fetch(`/api/gas-proxy?${queryParams.toString()}`);
        if (response.ok) {
          const json = await response.json();
          if (json && (json.success !== undefined || json.data !== undefined)) {
            return json;
          }
        }
      } else {
        const response = await fetch('/api/gas-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: action,
            uid: uid,
            token: token,
            data: bodyData,
            url: webAppUrl
          })
        });

        if (response.ok) {
          const json = await response.json();
          if (json && (json.success !== undefined || json.data !== undefined)) {
            return json;
          }
        }
      }
    } catch (proxyError) {
      console.warn("Proxy call failed, attempting direct fetch fallback to Apps Script:", proxyError);
    }

    // Direct Browser Fetch Fallback (for Vercel or pure client environments)
    try {
      if (method === 'GET') {
        const separator = webAppUrl.includes('?') ? '&' : '?';
        let directUrl = `${webAppUrl}${separator}action=${encodeURIComponent(action)}`;
        if (bodyData) {
          const params = new URLSearchParams();
          Object.entries(bodyData).forEach(([k, v]) => {
            if (v !== undefined && v !== null) params.append(k, String(v));
          });
          const str = params.toString();
          if (str) directUrl += `&${str}`;
        }

        const response = await fetch(directUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } else {
        const response = await fetch(webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: action,
            uid: uid,
            token: token,
            data: bodyData
          })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      }
    } catch (directError: any) {
      console.error("Direct fetch to Google Apps Script failed:", directError);
      throw new Error(`Failed to connect to Google Apps Script: ${directError.message || 'Network error'}`);
    }
  }

  // ==========================================================
  // AUTHENTICATION
  // ==========================================================
  static async login(uid: string, password: string): Promise<UserRecord> {
    if (this.getDatabaseMode() === 'mock') {
      throw new Error("Using Local Storage Mode. Direct API not routed.");
    }

    const res = await this.request<any>('login', 'POST', { uid, password });
    if (!res.success || !res.data) {
      throw new Error(res.message || "Credential verification failed.");
    }

    // Parse the allowedTabs csv string back to array if GAS returned it as string
    const user = res.data;
    if (user.allowedTabs && typeof user.allowedTabs === 'string') {
      user.allowedTabs = user.allowedTabs.split(',').map((t: string) => t.trim());
    }
    if (user.assignedUnit && typeof user.assignedUnit === 'string') {
      user.assignedUnits = user.assignedUnit.split(',').map((u: string) => u.trim());
    }

    return user as UserRecord;
  }

  // ==========================================================
  // DASHBOARD DATA
  // ==========================================================
  static async fetchDashboard(filters: { unit?: string; date?: string; startDate?: string; endDate?: string }): Promise<{ summary: any; floors: FactoryFloor[] }> {
    if (this.getDatabaseMode() === 'mock') {
      throw new Error("Using Local Storage Mode.");
    }

    const res = await this.request<any>('dashboard/factory', 'GET', filters);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to retrieve factory KPIs.");
    }

    return res.data;
  }

  // ==========================================================
  // PRODUCTION CRUD
  // ==========================================================
  static async fetchProductionList(filters?: any): Promise<ProductionEntry[]> {
    if (this.getDatabaseMode() === 'mock') {
      throw new Error("Using Local Storage Mode.");
    }

    const res = await this.request<ProductionEntry[]>('production/list', 'GET', filters);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to load production list.");
    }

    return res.data;
  }

  static async addProductionEntry(entry: Partial<ProductionEntry>): Promise<string> {
    if (this.getDatabaseMode() === 'mock') {
      throw new Error("Using Local Storage Mode.");
    }

    const res = await this.request<{ id: string }>('production/add', 'POST', entry);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to save production entry.");
    }

    return res.data.id;
  }

  static async updateProductionEntry(entry: ProductionEntry): Promise<boolean> {
    if (this.getDatabaseMode() === 'mock') {
      throw new Error("Using Local Storage Mode.");
    }

    const res = await this.request<any>('production/update', 'POST', entry);
    if (!res.success) {
      throw new Error(res.message || "Failed to update production entry.");
    }

    return true;
  }

  static async deleteProductionEntry(id: string): Promise<boolean> {
    if (this.getDatabaseMode() === 'mock') {
      throw new Error("Using Local Storage Mode.");
    }

    // Pass ID to delete
    const res = await this.request<any>('production/delete', 'POST', { id });
    if (!res.success) {
      throw new Error(res.message || "Failed to delete production entry.");
    }

    return true;
  }

  // ==========================================================
  // PRODUCTION LEDGER CRUD
  // ==========================================================
  static async fetchLedgerList(): Promise<LedgerRecord[]> {
    if (this.getDatabaseMode() === 'mock') {
      throw new Error("Using Local Storage Mode.");
    }

    const res = await this.request<LedgerRecord[]>('ledger/list', 'GET');
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to load ledger records.");
    }

    return res.data;
  }

  static async addLedgerEntry(record: LedgerRecord): Promise<string> {
    if (this.getDatabaseMode() === 'mock') {
      throw new Error("Using Local Storage Mode.");
    }

    const res = await this.request<{ id: string }>('ledger/add', 'POST', record);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to save ledger record.");
    }

    return res.data.id;
  }

  static async updateLedgerEntry(record: LedgerRecord): Promise<boolean> {
    if (this.getDatabaseMode() === 'mock') {
      throw new Error("Using Local Storage Mode.");
    }

    const res = await this.request<any>('ledger/update', 'POST', record);
    if (!res.success) {
      throw new Error(res.message || "Failed to update ledger record.");
    }

    return true;
  }

  static async deleteLedgerEntry(id: string): Promise<boolean> {
    if (this.getDatabaseMode() === 'mock') {
      throw new Error("Using Local Storage Mode.");
    }

    const res = await this.request<any>('ledger/delete', 'POST', { id });
    if (!res.success) {
      throw new Error(res.message || "Failed to delete ledger record.");
    }

    return true;
  }

  // ==========================================================
  // USER DIRECTORY CRUD
  // ==========================================================
  static async fetchUsers(): Promise<UserRecord[]> {
    if (this.getDatabaseMode() === 'mock') {
      throw new Error("Using Local Storage Mode.");
    }

    const res = await this.request<any[]>('users', 'GET');
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to fetch user directory.");
    }

    // Format fields from string to arrays if needed
    return res.data.map(u => {
      if (u.allowedTabs && typeof u.allowedTabs === 'string') {
        u.allowedTabs = u.allowedTabs.split(',').map((t: string) => t.trim());
      }
      if (u.assignedUnit && typeof u.assignedUnit === 'string') {
        u.assignedUnits = u.assignedUnit.split(',').map((t: string) => t.trim());
      } else if (!u.assignedUnits) {
        u.assignedUnits = [];
      }
      return u as UserRecord;
    });
  }

  static async addUser(user: Partial<UserRecord> & { password?: string }): Promise<boolean> {
    if (this.getDatabaseMode() === 'mock') {
      throw new Error("Using Local Storage Mode.");
    }

    const res = await this.request<any>('users/add', 'POST', user);
    if (!res.success) {
      throw new Error(res.message || "Failed to register user account.");
    }

    return true;
  }

  static async updateUser(user: Partial<UserRecord> & { password?: string }): Promise<boolean> {
    if (this.getDatabaseMode() === 'mock') {
      throw new Error("Using Local Storage Mode.");
    }

    const res = await this.request<any>('users/update', 'POST', user);
    if (!res.success) {
      throw new Error(res.message || "Failed to update user profile.");
    }

    return true;
  }

  static async deleteUser(targetUid: string): Promise<boolean> {
    if (this.getDatabaseMode() === 'mock') {
      throw new Error("Using Local Storage Mode.");
    }

    const res = await this.request<any>('users/delete', 'POST', { targetUid });
    if (!res.success) {
      throw new Error(res.message || "Failed to delete user account.");
    }

    return true;
  }

  // ==========================================================
  // SYSTEM CONFIGURATION & ACTIVITY LOGS
  // ==========================================================
  static async fetchSettings(): Promise<any> {
    if (this.getDatabaseMode() === 'mock') {
      throw new Error("Using Local Storage Mode.");
    }

    const res = await this.request<any>('settings', 'GET');
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to load settings.");
    }

    return res.data;
  }

  static async updateSettings(settings: Record<string, string>): Promise<boolean> {
    if (this.getDatabaseMode() === 'mock') {
      throw new Error("Using Local Storage Mode.");
    }

    const res = await this.request<any>('settings/update', 'POST', settings);
    if (!res.success) {
      throw new Error(res.message || "Failed to save settings to Google Sheets.");
    }

    return true;
  }

  static async fetchActivityLogs(limit: number = 30): Promise<ActivityLog[]> {
    if (this.getDatabaseMode() === 'mock') {
      throw new Error("Using Local Storage Mode.");
    }

    const res = await this.request<any[]>('activity', 'GET', { limit });
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to retrieve activity log.");
    }

    return res.data.map(l => ({
      id: l.id,
      timestamp: l.timestamp,
      floorId: l.floorId,
      type: l.type as any,
      message: `[${l.uid}] ${l.message}`,
      status: l.status as any
    }));
  }
}
