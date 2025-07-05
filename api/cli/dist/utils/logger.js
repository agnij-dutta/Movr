import winston from 'winston';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
// Ensure logs directory exists
const logsDir = join(process.cwd(), 'logs');
if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
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
winston.addColors(colors);
// Define format for console output
const consoleFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston.format.colorize({ all: true }), winston.format.printf((info) => `${info['timestamp']} ${info.level}: ${info.message}`));
// Define format for file output
const fileFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston.format.errors({ stack: true }), winston.format.json());
// Create transports
const transports = [
    // Console transport
    new winston.transports.Console({
        format: consoleFormat,
        level: process.env['NODE_ENV'] === 'production' ? 'warn' : 'debug',
    }),
    // Error log file
    new winston.transports.File({
        filename: join(logsDir, 'error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
        filename: join(logsDir, 'combined.log'),
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
];
// Create logger instance
export const logger = winston.createLogger({
    level: process.env['NODE_ENV'] === 'production' ? 'warn' : 'debug',
    levels,
    format: fileFormat,
    transports,
    exitOnError: false,
});
// Add stream for HTTP logging middleware if needed
export const loggerStream = {
    write: (message) => {
        logger.http(message.substring(0, message.lastIndexOf('\n')));
    },
};
