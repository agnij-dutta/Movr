"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvalidPackageError = exports.createPackageNotFoundError = exports.createValidationError = exports.createFileSystemError = exports.createConfigError = exports.createIPFSError = exports.createBlockchainError = exports.createNetworkError = exports.errorHandler = exports.ErrorHandler = exports.InvalidPackageError = exports.PackageNotFoundError = exports.ValidationError = exports.FileSystemError = exports.ConfigError = exports.IPFSError = exports.BlockchainError = exports.NetworkError = exports.AppError = exports.ErrorCode = exports.ErrorType = void 0;
const logger_1 = require("./logger");
var ErrorType;
(function (ErrorType) {
    ErrorType["OPERATIONAL"] = "OPERATIONAL";
    ErrorType["PROGRAMMER"] = "PROGRAMMER";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
var ErrorCode;
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
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
class AppError extends Error {
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
exports.AppError = AppError;
class NetworkError extends AppError {
    constructor(message, context) {
        super(ErrorCode.NETWORK_ERROR, message, ErrorType.OPERATIONAL, 503, context);
    }
}
exports.NetworkError = NetworkError;
class BlockchainError extends AppError {
    constructor(message, context) {
        super(ErrorCode.BLOCKCHAIN_ERROR, message, ErrorType.OPERATIONAL, 502, context);
    }
}
exports.BlockchainError = BlockchainError;
class IPFSError extends AppError {
    constructor(message, context) {
        super(ErrorCode.IPFS_ERROR, message, ErrorType.OPERATIONAL, 503, context);
    }
}
exports.IPFSError = IPFSError;
class ConfigError extends AppError {
    constructor(message, context) {
        super(ErrorCode.CONFIG_ERROR, message, ErrorType.OPERATIONAL, 400, context);
    }
}
exports.ConfigError = ConfigError;
class FileSystemError extends AppError {
    constructor(message, context) {
        super(ErrorCode.FILE_SYSTEM_ERROR, message, ErrorType.OPERATIONAL, 500, context);
    }
}
exports.FileSystemError = FileSystemError;
class ValidationError extends AppError {
    constructor(message, context) {
        super(ErrorCode.VALIDATION_ERROR, message, ErrorType.OPERATIONAL, 400, context);
    }
}
exports.ValidationError = ValidationError;
class PackageNotFoundError extends AppError {
    constructor(packageName, context) {
        super(ErrorCode.PACKAGE_NOT_FOUND, `Package '${packageName}' not found`, ErrorType.OPERATIONAL, 404, { packageName, ...context });
    }
}
exports.PackageNotFoundError = PackageNotFoundError;
class InvalidPackageError extends AppError {
    constructor(message, context) {
        super(ErrorCode.INVALID_PACKAGE, message, ErrorType.OPERATIONAL, 400, context);
    }
}
exports.InvalidPackageError = InvalidPackageError;
class ErrorHandler {
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
                logger_1.logger.error('Application Error', {
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
                logger_1.logger.error('Unexpected Error', {
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
            logger_1.logger.info('Error metric fired', {
                errorType: error instanceof AppError ? error.code : 'UNKNOWN_ERROR',
                timestamp: new Date().toISOString(),
            });
        }
        catch (monitoringError) {
            logger_1.logger.warn('Failed to fire monitoring metric', { error: monitoringError });
        }
    }
}
exports.ErrorHandler = ErrorHandler;
exports.errorHandler = new ErrorHandler();
// Global error handlers
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    exports.errorHandler.handleError(error);
});
process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger_1.logger.error('Unhandled Rejection', { error: error.message, stack: error.stack });
    exports.errorHandler.handleError(error);
});
// Helper functions for creating common errors
const createNetworkError = (message, context) => new NetworkError(message, context);
exports.createNetworkError = createNetworkError;
const createBlockchainError = (message, context) => new BlockchainError(message, context);
exports.createBlockchainError = createBlockchainError;
const createIPFSError = (message, context) => new IPFSError(message, context);
exports.createIPFSError = createIPFSError;
const createConfigError = (message, context) => new ConfigError(message, context);
exports.createConfigError = createConfigError;
const createFileSystemError = (message, context) => new FileSystemError(message, context);
exports.createFileSystemError = createFileSystemError;
const createValidationError = (message, context) => new ValidationError(message, context);
exports.createValidationError = createValidationError;
const createPackageNotFoundError = (packageName, context) => new PackageNotFoundError(packageName, context);
exports.createPackageNotFoundError = createPackageNotFoundError;
const createInvalidPackageError = (message, context) => new InvalidPackageError(message, context);
exports.createInvalidPackageError = createInvalidPackageError;
