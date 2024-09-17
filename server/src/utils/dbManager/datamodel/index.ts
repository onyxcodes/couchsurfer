// This method is meant to be run by nodejs to calculate 
// the number of patches in the patch folder
import fs from 'node:fs';
import dotenv from 'dotenv';
import { updateEnvFile } from '../../../utils/crypto';
import path from 'node:path';
const envPath = '.env';
dotenv.config({ path: envPath }); 

export const countPatches = () => {
    try {
        const folderPath = path.resolve(__dirname, 'patch')
        console.log("countPatches - checking directory", folderPath)
        return fs.readdirSync(folderPath).length;
    } catch(e) {
        console.log("countPatches - problem while reading patch folder", e)
    }
}

export const setPatchCount = () => {
    const count = countPatches();
    updateEnvFile({"PATCH_COUNT": `${count}`});
    console.log("PATCH_COUNT environment updated successfully. Reloading .env file...");
    dotenv.config({ override: true })
}

export default setPatchCount;
