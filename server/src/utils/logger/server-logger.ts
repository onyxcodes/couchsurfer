// import expressPino from "express-pino-logger";
import * as expressWinston from "express-winston"
import * as winston from "winston";
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
    transports: [ new PouchDBTransport({dbName: "log"}), new winston.transports.File({
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