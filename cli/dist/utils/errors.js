import { logger } from './logger.js';
export var ErrorType;
(function (ErrorType) {
    ErrorType["OPERATIONAL"] = "OPERATIONAL";
    ErrorType["PROGRAMMER"] = "PROGRAMMER";
})(ErrorType || (ErrorType = {}));
export var ErrorCode;
(function (ErrorCode) {
    ErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    ErrorCode["BLOCKCHAIN_ERROR"] = "BLOCKCHAIN_ERROR";
    ErrorCode["IPFS_ERROR"] = "IPFS_ERROR";
    ErrorCode["CONFIG_ERROR"] = "CONFIG_ERROR";
    ErrorCode["FILE_SYSTEM_ERROR"] = "FILE_SYSTEM_ERROR";
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["AUTHENTICATION_ERROR"] = "AUTHENTICATION_ERROR";
    ErrorCode["PACKAGE_NOT_FOUND"] = "PACKAGE_NOT_FOUND";
    ErrorCode["INVALID_PACKAGE"] = "INVALID_PACKAGE";
    ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(ErrorCode || (ErrorCode = {}));
export class AppError extends Error {
    name;
    code;
    type;
    isOperational;
    statusCode;
    context;
    constructor(code, message, type = ErrorType.OPERATIONAL, statusCode, context) {
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
    constructor(message, context) {
        super(ErrorCode.NETWORK_ERROR, message, ErrorType.OPERATIONAL, 503, context);
    }
}
export class BlockchainError extends AppError {
    constructor(message, context) {
        super(ErrorCode.BLOCKCHAIN_ERROR, message, ErrorType.OPERATIONAL, 502, context);
    }
}
export class IPFSError extends AppError {
    constructor(message, context) {
        super(ErrorCode.IPFS_ERROR, message, ErrorType.OPERATIONAL, 503, context);
    }
}
export class ConfigError extends AppError {
    constructor(message, context) {
        super(ErrorCode.CONFIG_ERROR, message, ErrorType.OPERATIONAL, 400, context);
    }
}
export class FileSystemError extends AppError {
    constructor(message, context) {
        super(ErrorCode.FILE_SYSTEM_ERROR, message, ErrorType.OPERATIONAL, 500, context);
    }
}
export class ValidationError extends AppError {
    constructor(message, context) {
        super(ErrorCode.VALIDATION_ERROR, message, ErrorType.OPERATIONAL, 400, context);
    }
}
export class PackageNotFoundError extends AppError {
    constructor(packageName, context) {
        super(ErrorCode.PACKAGE_NOT_FOUND, `Package '${packageName}' not found`, ErrorType.OPERATIONAL, 404, { packageName, ...context });
    }
}
export class InvalidPackageError extends AppError {
    constructor(message, context) {
        super(ErrorCode.INVALID_PACKAGE, message, ErrorType.OPERATIONAL, 400, context);
    }
}
export class ErrorHandler {
    async handleError(error) {
        await this.logError(error);
        await this.fireMonitoringMetric(error);
        if (!this.isTrustedError(error)) {
            // For programmer errors, we might want to crash the process
            // But for CLI tools, we typically want to show error and exit gracefully
            process.exit(1);
        }
    }
    isTrustedError(error) {
        if (error instanceof AppError) {
            return error.isOperational;
        }
        return false;
    }
    async logError(error) {
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
            }
            else {
                logger.error('Unexpected Error', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                });
            }
        }
        catch (loggingError) {
            // Fallback to console if logger fails
            // eslint-disable-next-line no-console
            console.error('Logging error:', loggingError);
            // eslint-disable-next-line no-console
            console.error('Original error:', error);
        }
    }
    async fireMonitoringMetric(error) {
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
        }
        catch (monitoringError) {
            logger.warn('Failed to fire monitoring metric', { error: monitoringError });
        }
    }
}
export const errorHandler = new ErrorHandler();
// Global error handlers
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    errorHandler.handleError(error);
});
process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error('Unhandled Rejection', { error: error.message, stack: error.stack });
    errorHandler.handleError(error);
});
// Helper functions for creating common errors
export const createNetworkError = (message, context) => new NetworkError(message, context);
export const createBlockchainError = (message, context) => new BlockchainError(message, context);
export const createIPFSError = (message, context) => new IPFSError(message, context);
export const createConfigError = (message, context) => new ConfigError(message, context);
export const createFileSystemError = (message, context) => new FileSystemError(message, context);
export const createValidationError = (message, context) => new ValidationError(message, context);
export const createPackageNotFoundError = (packageName, context) => new PackageNotFoundError(packageName, context);
export const createInvalidPackageError = (message, context) => new InvalidPackageError(message, context);
