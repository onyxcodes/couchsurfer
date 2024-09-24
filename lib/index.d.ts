import express from 'express';
import getLogger from "./utils/logger";
import Surfer from './utils/dbManager/Surfer';
import Class from './utils/dbManager/Class';
import Attribute from './utils/dbManager/Attribute';
declare class CouchSurfer {
    private app;
    private dbName;
    private readyState;
    private surfer;
    private initInstance;
    resetDb(): Promise<void>;
    reset(): Promise<void>;
    private setupAdminUser;
    constructor(config?: {
        dbName: string;
    });
    getApp(): express.Express;
}
export { Surfer, Class, Attribute, getLogger };
export { CouchSurfer };
