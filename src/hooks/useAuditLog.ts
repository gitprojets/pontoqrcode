import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AuditAction = 
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'ROLE_CHANGED'
  | 'UNIDADE_CREATED'
  | 'UNIDADE_UPDATED'
  | 'UNIDADE_DELETED'
  | 'DISPOSITIVO_CREATED'
  | 'DISPOSITIVO_UPDATED'
  | 'DISPOSITIVO_DELETED'
  | 'ESCALA_CREATED'
  | 'ESCALA_UPDATED'
  | 'ESCALA_DELETED'
  | 'JUSTIFICATIVA_CREATED'
  | 'JUSTIFICATIVA_APPROVED'
  | 'JUSTIFICATIVA_REJECTED'
  | 'REGISTRO_CREATED'
  | 'REGISTRO_UPDATED'
  | 'EVENTO_CREATED'
  | 'EVENTO_UPDATED'
  | 'EVENTO_DELETED'
  | 'TICKET_CREATED'
  | 'TICKET_RESPONDED'
  | 'SETTINGS_CHANGED'
  | 'EXPORT_DATA';

interface AuditLogParams {
  action: AuditAction;
  tableName?: string;
  recordId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}

export function useAuditLog() {
  const logAction = useCallback(async ({
    action,
    tableName,
    recordId,
    oldData,
    newData
  }: AuditLogParams) => {
    try {
      const { error } = await supabase.rpc('log_audit_event', {
        _action: action,
        _table_name: tableName || null,
        _record_id: recordId || null,
        _old_data: oldData ? JSON.stringify(oldData) : null,
        _new_data: newData ? JSON.stringify(newData) : null
      });

      if (error) {
        console.error('Audit log error:', error);
      }
    } catch (err) {
      console.error('Failed to log audit event:', err);
    }
  }, []);

  return { logAction };
}
