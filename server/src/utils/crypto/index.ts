import crypto from "crypto"
import dotenv from 'dotenv';
import fs from 'fs';

const envPath = '.env';

dotenv.config({ path: envPath }); 

const checkKeyPairPresence = () => {
    const publicKey = process.env.PUBLIC_KEY;
    const privateKey = process.env.PRIVATE_KEY;
    
    if ( publicKey && publicKey.length > 0 && privateKey && privateKey.length > 0 ) {
        return true;
    } else {
        return false;
    }
}

const generatePair = () => {
    // Placeholder method, aimed to provide in the future additional
    // customizations for the key pair generation
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
        // The standard secure default length for RSA keys is 2048 bits
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
            cipher: 'aes-256-cbc',
            passphrase: process.env.ENCRYPTION_PASSPHRASE,
        },
    });
    return { publicKey, privateKey };
}

const updateEnvFile = (publicKey: string, privateKey: string) => {
    const envFilePath = envPath;
    const envConfig = dotenv.parse(fs.readFileSync(envFilePath));

    envConfig.PUBLIC_KEY = publicKey;
    envConfig.PRIVATE_KEY = privateKey;

    const envContent = Object.entries(envConfig)
        .map(([key, value]) => `${key}="${value}"`)
        .join('\n');

    fs.writeFileSync(envFilePath, envContent);
};

const generateKeys = () => {
    if ( checkKeyPairPresence() ) {
        console.log("Key pair already exists");
        return;
    }
    const { publicKey, privateKey } = generatePair();
    updateEnvFile(publicKey, privateKey);
    console.log("Key pair generated successfully");
}

export const encryptString = (stringToEncrypt: string) => {
    const publicKey = process.env.PUBLIC_KEY;
  
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

// TODO: Consider adding more params like:
// custom padding and encoding output
export const decryptData = (encryptedData: Buffer) => {
    const privateKey = process.env.PRIVATE_KEY;

    if (privateKey === undefined) {
        throw new Error("No public key found in .env file");
    }

    try {
        const decryptedData = crypto.privateDecrypt(
            {
              key: privateKey,
              // In order to decrypt the data, we need to specify the
              // same hashing function and padding scheme that we used to
              // encrypt the data in the previous step
              padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
              oaepHash: "sha256",
            },
            encryptedData
          );
          
        // The decrypted data is of the Buffer type, which we can convert to a
        // string to reveal the original data
        return decryptedData.toString();
    } catch (error) {
        if (error.message.includes('error:0407109F:rsa routines:RSA_padding_check_PKCS1_type_2:pkcs decoding error')) {
            console.error("Decryption failed: Incorrect padding.");
        } else if (error.message.includes('error:04065072:rsa routines:RSA_EAY_PRIVATE_DECRYPT:padding check failed')) {
            console.error("Decryption failed: Incorrect private key or corrupted data.");
        } else if (error.message.includes('error:0407006E:rsa routines:RSA_padding_add_PKCS1_OAEP_mgf1:data too large for key size')) {
            console.error("Decryption failed: Data too large for key size.");
        } else {
            console.error("Decryption failed:", error);
        }
        return null;
    } 
}

export const decryptString = (stringToDecrypt: string) => {
    return decryptData(Buffer.from(stringToDecrypt, "base64"));
}

export default generateKeys;


