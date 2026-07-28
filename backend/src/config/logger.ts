import winston, { verbose } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
})

const logger = winston.createLogger({
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        verbose: 4,
        debug: 5
    },
    level: "http",

    format: combine(
        timestamp({
            format: "DD_MM_YYYY HH:mm:ss",
        }),
        logFormat
    ),
    transports: [
        new winston.transports.Console({
            format: combine(
                colorize(),
                timestamp({
                    format: "DD_MM_YYYY HH:mm:ss"
                }),
                logFormat
            ),
        }),
        new DailyRotateFile({
            filename: "logs/combined-%DATE%.log",
            datePattern: "DD_MM_YYYY",
            maxFiles: "14d",
        }),
        new DailyRotateFile({
            filename: "logs/error-%DATE%.log",
            level: "error",
            datePattern: "DD_MM_YYYY",
            maxFiles: "30d",
        }),
    ],
     exceptionHandlers: [
        new DailyRotateFile({
            filename: "logs/exception-%DATE%.logs",
            datePattern: "DD_MM_YYYY",
        }),
     ],
     rejectionHandlers: [
        new DailyRotateFile({
            filename: "logs/rejections-%DATE%.logs",
            datePattern: "DD_MM_YYYY"
        }),
     ],
});

export default logger;