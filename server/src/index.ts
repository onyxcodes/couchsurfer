import express from 'express'
import { static as exStatic } from 'express';
import * as dotenv from "dotenv";
dotenv.config({ path: './.env' })
import { resolve } from 'path';
import logger, {logRequest} from "./utils/logger/server-logger"
import test from './utils/dbManager/test';

const app = express();
app.use(logRequest)
const port = process.env.APP_PORT || 5000;

const server = app.listen(port, () => logger.info(`Listening on port ${port}`));

app.use(exStatic('./dist'));
  
app.get('*', (req, res) => {
    const templatePath = resolve(__dirname, './dist', 'index.html');
    res.sendFile(templatePath);
});
test()