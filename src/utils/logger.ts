// Production-ready logger utility
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isProduction: boolean;

  constructor() {
    this.isProduction = import.meta.env.PROD;
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  private log(level: LogLevel, message: string, data?: any) {
    const entry = this.createLogEntry(level, message, data);
    
    if (this.isProduction) {
      // In production, only log errors and warnings
      if (level === 'error' || level === 'warn') {
        console[level](`[${entry.timestamp}] ${entry.message}`, data || '');
      }
    } else {
      // In development, log everything
      console[level](`[${entry.timestamp}] ${entry.message}`, data || '');
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }
}

export const logger = new Logger();
