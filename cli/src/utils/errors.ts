import { logger } from './logger';

export enum ErrorType {
  OPERATIONAL = 'OPERATIONAL',
  PROGRAMMER = 'PROGRAMMER',
}

export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  BLOCKCHAIN_ERROR = 'BLOCKCHAIN_ERROR',
  IPFS_ERROR = 'IPFS_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  PACKAGE_NOT_FOUND = 'PACKAGE_NOT_FOUND',
  INVALID_PACKAGE = 'INVALID_PACKAGE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class AppError extends Error {
  public readonly name: string;
  public readonly code: ErrorCode;
  public readonly type: ErrorType;
  public readonly isOperational: boolean;
  public readonly statusCode: number | undefined;
  public readonly context: Record<string, unknown> | undefined;

  constructor(
    code: ErrorCode,
    message: string,
    type: ErrorType = ErrorType.OPERATIONAL,
    statusCode?: number,
    context?: Record<string, unknown>
  ) {
    super(message);

    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.code = code;
    this.type = type;
    this.isOperational = type === ErrorType.OPERATIONAL;
    this.statusCode = statusCode;
    this.context = context;

    // Capture stack trace if available
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class NetworkError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(ErrorCode.NETWORK_ERROR, message, ErrorType.OPERATIONAL, 503, context);
  }
}

export class BlockchainError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(ErrorCode.BLOCKCHAIN_ERROR, message, ErrorType.OPERATIONAL, 502, context);
  }
}

export class IPFSError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(ErrorCode.IPFS_ERROR, message, ErrorType.OPERATIONAL, 503, context);
  }
}

export class ConfigError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(ErrorCode.CONFIG_ERROR, message, ErrorType.OPERATIONAL, 400, context);
  }
}

export class FileSystemError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(ErrorCode.FILE_SYSTEM_ERROR, message, ErrorType.OPERATIONAL, 500, context);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(ErrorCode.VALIDATION_ERROR, message, ErrorType.OPERATIONAL, 400, context);
  }
}

export class PackageNotFoundError extends AppError {
  constructor(packageName: string, context?: Record<string, unknown>) {
    super(
      ErrorCode.PACKAGE_NOT_FOUND,
      `Package '${packageName}' not found`,
      ErrorType.OPERATIONAL,
      404,
      { packageName, ...context }
    );
  }
}

export class InvalidPackageError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(ErrorCode.INVALID_PACKAGE, message, ErrorType.OPERATIONAL, 400, context);
  }
}

export class ErrorHandler {
  public async handleError(error: Error): Promise<void> {
    await this.logError(error);
    await this.fireMonitoringMetric(error);
    
    if (!this.isTrustedError(error)) {
      // For programmer errors, we might want to crash the process
      // But for CLI tools, we typically want to show error and exit gracefully
      process.exit(1);
    }
  }

  public isTrustedError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }

  private async logError(error: Error): Promise<void> {
    try {
      if (error instanceof AppError) {
        logger.error('Application Error', {
          name: error.name,
          code: error.code,
          type: error.type,
          message: error.message,
          statusCode: error.statusCode,
          context: error.context,
          stack: error.stack,
        });
      } else {
        logger.error('Unexpected Error', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
    } catch (loggingError) {
      // Fallback to console if logger fails
      // eslint-disable-next-line no-console
      console.error('Logging error:', loggingError);
      // eslint-disable-next-line no-console
      console.error('Original error:', error);
    }
  }

  private async fireMonitoringMetric(error: Error): Promise<void> {
    try {
      // Here you would integrate with monitoring services like:
      // - Sentry
      // - DataDog
      // - New Relic
      // - Custom metrics endpoint
      
      // For now, we'll just log the metric
      logger.info('Error metric fired', {
        errorType: error instanceof AppError ? error.code : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
      });
    } catch (monitoringError) {
      logger.warn('Failed to fire monitoring metric', { error: monitoringError });
    }
  }
}

export const errorHandler = new ErrorHandler();

// Global error handlers
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  errorHandler.handleError(error);
});

process.on('unhandledRejection', (reason: unknown) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logger.error('Unhandled Rejection', { error: error.message, stack: error.stack });
  errorHandler.handleError(error);
});

// Helper functions for creating common errors
export const createNetworkError = (message: string, context?: Record<string, unknown>) =>
  new NetworkError(message, context);

export const createBlockchainError = (message: string, context?: Record<string, unknown>) =>
  new BlockchainError(message, context);

export const createIPFSError = (message: string, context?: Record<string, unknown>) =>
  new IPFSError(message, context);

export const createConfigError = (message: string, context?: Record<string, unknown>) =>
  new ConfigError(message, context);

export const createFileSystemError = (message: string, context?: Record<string, unknown>) =>
  new FileSystemError(message, context);

export const createValidationError = (message: string, context?: Record<string, unknown>) =>
  new ValidationError(message, context);

export const createPackageNotFoundError = (packageName: string, context?: Record<string, unknown>) =>
  new PackageNotFoundError(packageName, context);

export const createInvalidPackageError = (message: string, context?: Record<string, unknown>) =>
  new InvalidPackageError(message, context); 