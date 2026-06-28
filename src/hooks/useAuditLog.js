import { useRef, useCallback } from 'react';

/**
 * Audit logging hook.
 *
 * In production, each log entry is POSTed to POST /api/audit.
 * During development, entries are queued in memory and logged to console.
 *
 * Each entry shape:
 * {
 *   ts:       ISO timestamp,
 *   user:     string,
 *   action:   string,   e.g. "VIEW_DEVICE" | "ACK_ALERT" | "CHAT_QUERY" | "EXPORT_REPORT"
 *   resource: string,   e.g. "PE-02" | "MPLS-T102" | "alert-a1"
 *   detail:   string,   freeform context
 * }
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? '';
const DEV = import.meta.env.DEV;

export function useAuditLog(user = 'Op-01') {
  const queue = useRef([]);

  const log = useCallback((action, resource = '', detail = '') => {
    const entry = {
      ts:       new Date().toISOString(),
      user,
      action,
      resource,
      detail,
    };

    queue.current.push(entry);

    if (DEV) {
      console.info('[AUDIT]', entry);
      return;
    }

    // Fire-and-forget to backend
    fetch(`${API_BASE}/api/audit`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(entry),
    }).catch(() => {
      // Keep in queue for retry — implement retry logic as needed
    });
  }, [user]);

  return { log, queue: queue.current };
}
