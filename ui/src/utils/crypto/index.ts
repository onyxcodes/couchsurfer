import crypto from "crypto";
import dotenv from "dotenv";

const envPath = '.env';

dotenv.config({ path: envPath }); 

export const encryptString = (stringToEncrypt: string) => {
    const publicKey = process.env.PUBLIC_KEY;

    if (publicKey === undefined) {
        throw new Error("No public key found in .env file");
    }

    const encryptedData = crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        // We convert the data string to a buffer using `Buffer.from`
        Buffer.from(stringToEncrypt)
    );

    return encryptedData.toString("base64");
}