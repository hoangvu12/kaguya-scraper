import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

const { errors, combine, printf, timestamp } = format;

const formatLog = printf(({ level, message, timestamp, stack }) => {
  const log = `${timestamp} ${level}: ${message}`;

  return stack ? `${log}\n${stack}` : log;
});

const transport = new transports.DailyRotateFile({
  filename: 'logs/%DATE%.log',
  datePattern: 'YYYY-MM-DD',
});

const logger = createLogger({
  format: combine(errors({ stack: true }), timestamp(), formatLog),
  transports: [transport, new transports.Console()],
});

export default logger;
