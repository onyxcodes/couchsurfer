import { decryptString, hashStringEpoch } from "../crypto";
import Surfer, {Document} from '../dbManager/Surfer';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

const envPath = '.env';

dotenv.config({ path: envPath });

export const generateToken = (payload: {
    username: string;
    id: string;
    email: string;
}) => {
    const secretKey = process.env.JWT_PRIVATE_KEY;

    if (!secretKey || secretKey === '') {
        throw new Error('JWT secret key not found');
    }

    // TODO: Consider making the expiration time configurable
    const options = {
      expiresIn: '1h', // Token expiration time
    };
  
    const token = jwt.sign(payload, secretKey, options);
    return token;
};

export const login = async (username: string, password: string) => {
    if (!username || !password) {
        return { responseCode: 400, body: { error: 'Username and password are required' } };
    }

    // Add your login logic here
    const userDoc = await globalThis.surferInstance.findDocument({
        "type": "User",
        username: { $eq: username },
    }) as Document

    if (!userDoc) {
        return { responseCode: 404, body: { error: 'User not found'} }
    }

    const storedDecryptedPsw = decryptString(userDoc.password)

    const receivedDecryptedPsw = decryptString(password);
    if ( receivedDecryptedPsw === storedDecryptedPsw) {
        // Create session document
        const UserSessionClass = await (globalThis.surferInstance as Surfer).getClass("UserSession");
        // const sessionCard = await UserSessionClass.addCard({
        //     username: userDoc.username,
        //     sessionId: hashStringEpoch(userDoc.username), //PK
        //     sessionStart: new Date().toISOString(),
        // });
        // Generate JWT token
        const token = generateToken({
            username: userDoc.username,
            id: userDoc.id,
            email: userDoc.email,
        }) // return the token and expiration time (1h)
        return { responseCode: 200, body: { success: true, message: 'Login successful', token, expiresIn: 3600 }};
    } else {
        return { responseCode: 401, body: { error: 'Incorrect password' }};
    }
}