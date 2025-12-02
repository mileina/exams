const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const morgan = require('morgan');

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const serviceName = 'gateway';
const logDir = path.join(__dirname, 'logs');
fs.mkdirSync(logDir, { recursive: true });

const baseFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

const logger = createLogger({
  level: LOG_LEVEL,
  defaultMeta: { service: serviceName },
  format: baseFormat,
  transports: [
    new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new transports.File({ filename: path.join(logDir, 'app.log') })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple())
    })
  );
}

const auditLogger = createLogger({
  level: 'info',
  defaultMeta: { service: serviceName },
  format: baseFormat,
  transports: [new transports.File({ filename: path.join(logDir, 'audit.log') })]
});

const httpLogger = morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
});

module.exports = {
  logger,
  auditLogger,
  httpLogger
};
