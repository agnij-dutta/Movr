"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerStream = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = require("path");
const fs_1 = require("fs");
// Ensure logs directory exists
const logsDir = (0, path_1.join)(process.cwd(), 'logs');
if (!(0, fs_1.existsSync)(logsDir)) {
    (0, fs_1.mkdirSync)(logsDir, { recursive: true });
}
// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
winston_1.default.addColors(colors);
// Define format for console output
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => `${info['timestamp']} ${info.level}: ${info.message}`));
// Define format for file output
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
// Create transports
const transports = [
    // Console transport
    new winston_1.default.transports.Console({
        format: consoleFormat,
        level: 'warn', // Only show warnings and errors in CLI
    }),
    // Error log file
    new winston_1.default.transports.File({
        filename: (0, path_1.join)(logsDir, 'error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
    // Combined log file
    new winston_1.default.transports.File({
        filename: (0, path_1.join)(logsDir, 'combined.log'),
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
];
// Create logger instance
exports.logger = winston_1.default.createLogger({
    level: 'warn', // Only show warnings and errors in CLI
    levels,
    format: fileFormat,
    transports,
    exitOnError: false,
});
// Add stream for HTTP logging middleware if needed
exports.loggerStream = {
    write: (message) => {
        exports.logger.http(message.substring(0, message.lastIndexOf('\n')));
    },
};
