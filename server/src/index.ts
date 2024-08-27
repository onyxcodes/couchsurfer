import express from 'express'
import { static as exStatic } from 'express';
import * as dotenv from "dotenv";
import cors from "cors";
dotenv.config({ path: './.env' })
import getLogger, {logRequest} from "./utils/logger"
import test from './utils/dbManager/test';
import { generateJwtKeys, generatePswKeys } from './utils/crypto';
import Surfer from './utils/dbManager/Surfer';
import { login } from './utils/auth';
// import memoryAdapter from "pouchdb-adapter-memory"
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import Class from 'utils/dbManager/Class';
const logger = getLogger().child({module: "express"})

const app = express();

/** EXPRESS MIDDLEWARES */
app.use(logRequest)
// Enable CORS for all routes
if (process.env.NODE_ENV === 'development') {
    app.use(cors({
        origin: 'http://localhost:8080', // Replace with the origin you want to allow
        methods: ['GET', 'POST'], // Specify the methods you want to allow
        credentials: true,
        // allowedHeaders: ['Content-Type', 'Authorization'] // Specify the headers you want to allow
    }));
}
// Use built-in middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api/private', (req, res, next) => {
    const token = req.cookies.jwtToken
    if (!token) {
        logger.error("No token provided")
        return res.status(403).json({
            success: false,
            message: 'No token provided',
        });
    }
    const secretKey = process.env.JWT_PUBLIC_KEY;
    if (!secretKey || secretKey === '') {
        logger.error("No secret key found")
        return res.status(500).json({
            success: false,
            message: 'No secret key found',
        });
    }
    jwt.verify(token, secretKey, async (err, payload) => {
        if (err) {
            logger.error("Invalid token", err)
            return res.status(403).json({
                success: false,
                message: 'Invalid token',
            });
        } else {
            // Check whether the session is still valid
            const { sessionId } = payload;
            const sessionCards = await (globalThis.UserSessionClass as Class)
            .getCards({
                sessionId: { $eq: sessionId },
                sessionStatus: { $eq: "active" }
            }, null, 0, 1);
            if (sessionCards.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Session expired',
                });
            }
            // TODO: Consider passing the session card to the next middleware
            next();
        }
    });
})
// app.use(exStatic('./dist'));

// Method to initialize the Surfer instance
// and preload some class for immediate use
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
    const UserSessionClass = await surfer.getClass("UserSession");
    globalThis.UserSessionClass = UserSessionClass;
}

// TODO: Serve the static files from the build folder
// of the UI application
// app.get('*', (req, res) => {
//     const templatePath = resolve(__dirname, './dist', 'index.html');
//     res.sendFile(templatePath);
// });

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const { responseCode, body, token } = await login(username, password);
        // Append also the token to the response
        let cookieOptions = {}
        if (process.env.NODE_ENV === 'development') {
            cookieOptions = { sameSite: 'None', secure: true, maxAge: 1000 * 60 * 15 };
            logger.warn("Development mode: setting cookie options to SameSite=None; Secure=true for JWT token");
        } else cookieOptions = { sameSite: 'Strict', httpOnly: true, maxAge: 1000 * 60 * 15 };

        res.cookie('jwtToken', token, cookieOptions);
        return res.status(responseCode).json(body);
    } catch (error) {
        console.error("Error during login", error);
        return res.status(500).json({ success: false, error: 'An error occurred' });
    }
});

app.get('/api/private/reset', async (req, res) => {
    try {
        await (globalThis.surfer as Surfer).reset();
        return res.status(200).json({ success: true, message: 'Internal database reset' });
    } catch (e) {
        return res.status(500).json({ success: false, error: 'An error occurred' });
    }
});

app.get('/api/private/clear:conn', async (req, res) => {
    try {
        const conn = req.params.conn;
        if (!conn) {
            throw new Error("Connection name not provided");
        }
        await Surfer.clear(conn);
        return res.status(200).json({ success: true, message: 'Internal database cleared' });
    } catch (e) {
        logger.error("Error during database clear", e);
        return res.status(500).json({ success: false, error: 'An error occurred' });
    }
});

app.get('/api/private/test', (req, res) => {
    return res.status(200).json({ message: 'Hello from the server! This is a private route' });
});

const port = process.env.SERVER_PORT || 5000;

const server = app.listen(port, () => logger.info(`Listening on port ${port}`));

// Server initialization procedures
generatePswKeys()
generateJwtKeys()
setTimeout(test, 1000)
// setTimeout(initInstance, 1000)
// initInstance()