import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger } from '../logger';

describe('Logger', () => {
  beforeEach(() => {
    logger.clearLogs();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('logging methods', () => {
    it('should log debug messages', () => {
      logger.debug('Debug message', { component: 'Test' });
      
      const logs = logger.getRecentLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('debug');
      expect(logs[0].message).toBe('Debug message');
      expect(logs[0].context.component).toBe('Test');
    });

    it('should log info messages', () => {
      logger.info('Info message');
      
      const logs = logger.getRecentLogs();
      expect(logs[0].level).toBe('info');
    });

    it('should log warn messages', () => {
      logger.warn('Warning message');
      
      const logs = logger.getRecentLogs();
      expect(logs[0].level).toBe('warn');
    });

    it('should log error messages', () => {
      logger.error('Error message', { action: 'test_action' });
      
      const logs = logger.getRecentLogs();
      expect(logs[0].level).toBe('error');
      expect(logs[0].context.action).toBe('test_action');
    });
  });

  describe('error logging', () => {
    it('should log error with stack trace', () => {
      const error = new Error('Test error');
      logger.logError(error, { component: 'TestComponent' });
      
      const logs = logger.getRecentLogs();
      expect(logs[0].message).toBe('Test error');
      expect(logs[0].context.stack).toBeDefined();
      expect(logs[0].context.name).toBe('Error');
      expect(logs[0].context.component).toBe('TestComponent');
    });
  });

  describe('log management', () => {
    it('should get recent logs with limit', () => {
      for (let i = 0; i < 10; i++) {
        logger.info(`Message ${i}`);
      }
      
      const logs = logger.getRecentLogs(5);
      expect(logs).toHaveLength(5);
      expect(logs[0].message).toBe('Message 5');
      expect(logs[4].message).toBe('Message 9');
    });

    it('should clear all logs', () => {
      logger.info('Message 1');
      logger.info('Message 2');
      
      logger.clearLogs();
      
      expect(logger.getRecentLogs()).toHaveLength(0);
    });

    it('should export logs as JSON', () => {
      logger.info('Test message', { key: 'value' });
      
      const exported = logger.exportLogs();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0].message).toBe('Test message');
    });
  });

  describe('log entry structure', () => {
    it('should include timestamp', () => {
      logger.info('Message');
      
      const logs = logger.getRecentLogs();
      expect(logs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should include URL when available', () => {
      logger.info('Message');
      
      const logs = logger.getRecentLogs();
      expect(logs[0].url).toBeDefined();
    });
  });

  describe('log limit', () => {
    it('should maintain max log limit', () => {
      // Log more than the max limit (100)
      for (let i = 0; i < 120; i++) {
        logger.info(`Message ${i}`);
      }
      
      const logs = logger.getRecentLogs(200);
      expect(logs.length).toBeLessThanOrEqual(100);
    });
  });
});
