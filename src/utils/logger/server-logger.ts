// import expressPino from "express-pino-logger";
import expressWinston from "express-winston"
import winston from "winston";
import { createLogger, transports, format } from "winston";
import PouchDBTransport from "./transport";
// import pino from "pino"

export const logRequest = expressWinston.logger({
  transports: [
    new winston.transports.Console()
  ],
    level: "info",
});

const serverLogger = createLogger({
    transports: [ new PouchDBTransport({dbName: "couch-log"}), new winston.transports.File({
      filename: 'combined.log',
      level: 'info'
    }),
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'errors.log',
      level: 'error'
    })]
})

export default serverLogger;