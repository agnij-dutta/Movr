export declare enum ErrorType {
    OPERATIONAL = "OPERATIONAL",
    PROGRAMMER = "PROGRAMMER"
}
export declare enum ErrorCode {
    NETWORK_ERROR = "NETWORK_ERROR",
    BLOCKCHAIN_ERROR = "BLOCKCHAIN_ERROR",
    IPFS_ERROR = "IPFS_ERROR",
    CONFIG_ERROR = "CONFIG_ERROR",
    FILE_SYSTEM_ERROR = "FILE_SYSTEM_ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
    PACKAGE_NOT_FOUND = "PACKAGE_NOT_FOUND",
    INVALID_PACKAGE = "INVALID_PACKAGE",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export declare class AppError extends Error {
    readonly name: string;
    readonly code: ErrorCode;
    readonly type: ErrorType;
    readonly isOperational: boolean;
    readonly statusCode: number | undefined;
    readonly context: Record<string, unknown> | undefined;
    constructor(code: ErrorCode, message: string, type?: ErrorType, statusCode?: number, context?: Record<string, unknown>);
}
export declare class NetworkError extends AppError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class BlockchainError extends AppError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class IPFSError extends AppError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class ConfigError extends AppError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class FileSystemError extends AppError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class ValidationError extends AppError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class PackageNotFoundError extends AppError {
    constructor(packageName: string, context?: Record<string, unknown>);
}
export declare class InvalidPackageError extends AppError {
    constructor(message: string, context?: Record<string, unknown>);
}
export declare class ErrorHandler {
    handleError(error: Error): Promise<void>;
    isTrustedError(error: Error): boolean;
    private logError;
    private fireMonitoringMetric;
}
export declare const errorHandler: ErrorHandler;
export declare const createNetworkError: (message: string, context?: Record<string, unknown>) => NetworkError;
export declare const createBlockchainError: (message: string, context?: Record<string, unknown>) => BlockchainError;
export declare const createIPFSError: (message: string, context?: Record<string, unknown>) => IPFSError;
export declare const createConfigError: (message: string, context?: Record<string, unknown>) => ConfigError;
export declare const createFileSystemError: (message: string, context?: Record<string, unknown>) => FileSystemError;
export declare const createValidationError: (message: string, context?: Record<string, unknown>) => ValidationError;
export declare const createPackageNotFoundError: (packageName: string, context?: Record<string, unknown>) => PackageNotFoundError;
export declare const createInvalidPackageError: (message: string, context?: Record<string, unknown>) => InvalidPackageError;
