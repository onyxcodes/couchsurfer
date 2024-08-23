import express from 'express'
import { static as exStatic } from 'express';
import * as dotenv from "dotenv";
import cors from "cors";
dotenv.config({ path: './.env' })
import { resolve } from 'path';
import getLogger, {logRequest} from "./utils/logger"
import test from './utils/dbManager/test';
import { decryptString, generateJwtKeys, generatePswKeys } from './utils/crypto';
import Surfer from './utils/dbManager/Surfer';
import { login } from './utils/auth';
// import memoryAdapter from "pouchdb-adapter-memory"

const logger = getLogger().child({module: "express"})

const app = express();
app.use(logRequest)

const initInstance = async () => {
    const surfer = await Surfer.create("db-test", {
        // defaults to leveldb
        // adapter: 'memory', 
        plugins: [
        // https://www.npmjs.com/package/pouchdb-adapter-memory
        // memoryAdapter
        ]
    });
    globalThis.surfer = surfer;
}

// Enable CORS for all routes
app.use(cors({
    origin: 'http://localhost:8080', // Replace with the origin you want to allow
    methods: ['GET', 'POST'], // Specify the methods you want to allow
    // allowedHeaders: ['Content-Type', 'Authorization'] // Specify the headers you want to allow
}));

// Use built-in middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(exStatic('./dist'));
  
app.get('*', (req, res) => {
    const templatePath = resolve(__dirname, './dist', 'index.html');
    res.sendFile(templatePath);
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const { responseCode, body } = await login(username, password);
        return res.status(responseCode).json(body);
    } catch (error) {
        console.error("Error during login", error);
        return res.status(500).json({ success: false, error: 'An error occurred' });
    }
});

const port = process.env.SERVER_PORT || 5000;

const server = app.listen(port, () => logger.info(`Listening on port ${port}`));

// Server initialization procedures
generatePswKeys()
generateJwtKeys()
// setTimeout(test, 1000)
setTimeout(initInstance, 1000)
// initInstance()