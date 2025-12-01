type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private formatLog(level: LogLevel, message: string, context?: LogContext): string {
    const log = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };
    return JSON.stringify(log);
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatLog('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatLog('warn', message, context));
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatLog('error', message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.formatLog('debug', message, context));
    }
  }
}

export const logger = new Logger();
