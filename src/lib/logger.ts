type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  unidadeId?: string;
  route?: string;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  timestamp: string;
  userAgent?: string;
  url?: string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createEntry(level: LogLevel, message: string, context: LogContext = {}): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with styling
    const styles = {
      debug: 'color: #6b7280',
      info: 'color: #3b82f6',
      warn: 'color: #f59e0b; font-weight: bold',
      error: 'color: #ef4444; font-weight: bold',
    };

    const contextStr = Object.keys(entry.context).length > 0 
      ? `\n  Context: ${JSON.stringify(entry.context, null, 2)}`
      : '';

    console.log(
      `%c[${entry.level.toUpperCase()}] ${entry.timestamp}\n  ${entry.message}${contextStr}`,
      styles[entry.level]
    );
  }

  debug(message: string, context?: LogContext): void {
    this.addLog(this.createEntry('debug', message, context));
  }

  info(message: string, context?: LogContext): void {
    this.addLog(this.createEntry('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    this.addLog(this.createEntry('warn', message, context));
  }

  error(message: string, context?: LogContext): void {
    this.addLog(this.createEntry('error', message, context));
  }

  // Log error with stack trace
  logError(error: Error, context?: LogContext): void {
    this.error(error.message, {
      ...context,
      stack: error.stack,
      name: error.name,
    });
  }

  // Get recent logs for debugging
  getRecentLogs(count = 20): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Clear all logs
  clearLogs(): void {
    this.logs = [];
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = Logger.getInstance();
export type { LogLevel, LogContext, LogEntry };
