import express from 'express'
import { static as exStatic } from 'express';
import * as dotenv from "dotenv";
import cors from "cors";
dotenv.config({ path: './.env' })
import { resolve } from 'path';
import logger, {logRequest} from "./utils/logger/server-logger"
import test from './utils/dbManager/test';
import { decryptString, generateJwtKeys, generatePswKeys } from './utils/crypto';
import Surfer, {Document} from './utils/dbManager/Surfer';

const app = express();
app.use(logRequest)

const initInstance = async () => {
    surferInstance = new Surfer("db-test", {adapter: 'memory', plugins: [ 
    ]});
    surferInstance = await Surfer.build(surferInstance);
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
    console.log("login request received", req)
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and encrypted password are required' });
        }

        // Add your login logic here
        const userDoc = await surferInstance.findDocument({
            "type": "User",
            username: { $eq: username },
        }) as Document

        if (!userDoc) {
            return res.status(404).json({ error: 'User not found'});
        }

        const storedDecryptedPsw = decryptString(userDoc.password)

        const receivedDecryptedPsw = decryptString(password);
        if ( receivedDecryptedPsw === storedDecryptedPsw) {
            return res.status(200).json({ message: 'Login successful' });
        } else {
            return res.status(401).json({ error: 'Incorrect password' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred' });
    }
});

const port = process.env.SERVER_PORT || 5000;

const server = app.listen(port, () => logger.info(`Listening on port ${port}`));
let surferInstance: Surfer;

// Server initialization procedures
generatePswKeys()
generateJwtKeys()
// setTimeout(test, 1000)
setTimeout(initInstance, 1000)
// initInstance()