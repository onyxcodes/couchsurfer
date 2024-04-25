import NodePouchDB from "pouchdb-node";
import Find from 'pouchdb-find'
import serverLogger from "../../../utils/logger/server-logger";
import Class, { ClassModel } from "../Class";
import { AttributeModel, AttributeTypeDecimal, AttributeTypeInteger, AttributeTypeString } from "../Attribute";
import { config } from "winston";
const logger = serverLogger.child({module: "pouchdb"})

const BASE_SCHEMA: AttributeModel[] = [
    { name: "name", type: "string", config: { maxLength: 100 } },
    { name: "type", type: "string", config: { maxLength: 100 } },
    { name: "createTimestamp", type: "integer", config: { min: 0 } },
    { name: "updateTimestamp", type: "integer", config: { min: 0 } },
    { name: "description", type: "string", config: { maxLength: 1000 } }
]
const CLASS_SCHEMA: (AttributeModel | {name: "schema", type: "attribute", config: {}})[] = [
    { name: "schema", type: "attribute", config: { maxLength: 1000, isArray: true }},
    { name: "parentClass", type: "string", config: { maxLength: 100 , isArray: false } },
    ...BASE_SCHEMA
]
export type Document = PouchDB.Core.ExistingDocument<{}> & {
    type: string,
    createTimestamp: number,
    updateTimestamp?: number | null,
    [key: string]: any
}

type SurferOptions = {
    plugins: PouchDB.Plugin[]
} & PouchDB.Configuration.DatabaseConfiguration 

class Surfer {
    public db: PouchDB.Database<{}> = undefined;
    lastDocId: number

    constructor(conn: string,  options?: SurferOptions) {
        // load default plugins
        NodePouchDB.plugin(Find)
        if (options.plugins) {
            for (let plugin of options.plugins) {
                NodePouchDB.plugin(plugin)
            }
        }
        this.db = new NodePouchDB(conn)
    }

    
    async getLastDocId() {
        let lastDocId = 0;
        try {
            let doc: { value: number, [key:string]: string | number} = await this.db.get("lastDocId");
            lastDocId = doc.value;
        } catch (e) {
            logger.error("checkdb - something went wrong", {"error": e});
        }
        return lastDocId;
    }


    async initdb () {
        try {
            let lastDocId: number = await this.getLastDocId();
            lastDocId = Number(lastDocId);
            // logger.info("initdb - res", res)
            if (!lastDocId) {
                // logger.info("initdb - initializing db")
                let response = await this.db.put({
                    _id: "lastDocId",
                    value: ++lastDocId
                });
                if (response.ok) this.lastDocId = lastDocId;
                else throw new Error("Got problem while putting doc"+ response);
            } else {
                logger.info("initdb - db already initialized, consider purge")
            }
            this.lastDocId = lastDocId;
            return this;
        } catch (e) {
            throw new Error("initdb -  something went wrong"+e);
        }
    }
    static async build( that: Surfer ) {
        let result = await that.initdb();
        // dbManagerObj = await dbManagerObj.incrementLastDocId();
        return result;
    }

    // TODO: Consider filtering returned properties
    async getDocument(docId) {
        let doc: PouchDB.Core.ExistingDocument<{}> | undefined = undefined;
        try {
            doc = await this.db.get(docId);
        } catch (e) {
            throw new Error(e);
        }
        return doc;
    }
    async getDocRevision(docId) {
        let _rev: string | null = null;
        try {
            let doc = await this.getDocument(docId);
            _rev = doc._rev;
        } catch (e) {
            logger.info("getDocRevision - error", e)
            throw new Error(e);
        }
        return _rev;
    }

    async findDocument( selector: any, fields = undefined, skip = undefined, limit = undefined ) {
        let indexFields = Object.keys(selector);
        let result: {
            docs: (PouchDB.Core.ExistingDocument<{}>)[] | undefined[],
            [key: string]: any
        } = {
            docs: []
        }
        try {
            let indexResult = await this.db.createIndex({
                index: { fields: indexFields }
            });
    
            let foundResult = await this.db.find({
                selector: selector,
                fields: fields,
                skip: skip,
                limit: limit
            });
    
            logger.info("findDocument - found", foundResult);
            result = { docs: foundResult.docs, selector, skip, limit };
            return result;
        } catch (e) {
            logger.info("findDocument - error",e);
            return {docs: [], error: e.toString(),selector, skip, limit};
        }
    }

    // TODO: Do not confuse Class with Class models
    async getClassModel( className: string ) {
        let selector = {
            type: { $eq: "class" },
            name: { $eq: className }
        };

        let response = await this.findDocument(selector);
        let result: ClassModel = response.docs[0] as ClassModel
        logger.info("getClassModel - result", result)
        return result;
    }

    async getAllClassModels() {
        let selector = {
            type: { $eq: "class" },
        };
        // TODO: parentClass may be interesting
        let fields = ['_id', 'name', 'description'];

        let response = await this.findDocument(selector, fields);
        let result: ClassModel[] = response.docs as ClassModel[];
        return result;
    }

    async getClassModels( classNames ) {
        let allClasses = await this.getAllClassModels();
        let result = allClasses.filter( classObj => classNames.includes(classObj.name) );
        return result;
    }

    async incrementLastDocId() {
        let docId = "lastDocId",
            _rev = await this.getDocRevision(docId);
        await this.db.put({
            _id: "lastDocId",
            _rev: _rev,
            value: ++this.lastDocId
        });
        return this.lastDocId;
    }

    static async clear (conn: string) {
        return new Promise ( (resolve, reject) => {
            try {
                let db = new NodePouchDB(conn)
                db.destroy(null, () => {
                    logger.info("clear - Destroyed db");
                    resolve(true);
                });
            } catch (e) {
                logger.error("clear - Error while destroying db"+e)
                reject(false)
            }
        })
    }

    async addClass( classObj: Class ) {
        // Check for existance
        // let exists = awaut getClass()
        let classModel = classObj.getModel();
        let existing = await this.getClassModel(classModel.name);
        if ( existing == null ) {
            let result = await this.createDoc(classObj.getName(), classObj.getType(), classObj.getModel());
            logger.info("addClass - result", result)
            return result;
        } else {
            return existing._id;
        } 
    }

    async updateClass(classObj: Class) {
        let maxRetries = 5;
        for(let i = 0; i < maxRetries; i++) {
            try {
                let result = await this.createDoc(classObj.getId(), classObj.getType(), classObj.getModel());
                return result;
            } catch (error) {
                if (error.name === 'conflict') {
                    // Fetch the latest document and update the model
                    let latestDoc = await this.getDocument(classObj.getId()) as ClassModel;
                    classObj.setModel(latestDoc);
                } else {
                    // If it's not a conflict error, rethrow it
                    throw error;
                }
            }
        }
        throw new Error('Failed to update document after ' + maxRetries + ' attempts');
    }

    // You have an object and array of AttributeModels,
    // therefore each element of the array has an attribute name,
    // a type and a configuration
    // Based on the configuration apply various checks on the given object's
    // value at the corresponding attribute name
    validateObject(obj: any, attributeModels: AttributeModel[]): boolean {
        let isValid = true;
        attributeModels.forEach(model => {
            const value = obj[model.name];
    
            // Check if the property exists
            if (value === undefined && model.config.mandatory) {
                logger.info(`Property ${model.name} does not exist on the object.`);
                isValid = false;
                return;
            }

            if ( !model.config.mandatory && value === undefined ) {
                return;
            }
        
            switch(model.type) {
                case 'string':
                    if (typeof value !== model.type) {
                        logger.info(`Property ${model.name} is not of type ${model.type}.`);
                        isValid = false;
                        return;
                    }
                    if (model.config as AttributeTypeString["config"]) {
                        if  (model.config.maxLength && value.length > model.config.maxLength) {
                            logger.info(`Property ${model.name} is longer than ${model.config.maxLength} characters.`);
                            isValid = false;
                            return;
                        }
                    } 
                break;
                case 'decimal':
                    if (model.config as AttributeTypeDecimal["config"] ) {
                        if (model.config.min && value < model.config.min) {
                            logger.info(`Property ${model.name} is less than ${model.config.min}.`);
                            isValid = false;
                            return;
                        }
                        if (model.config.max && value > model.config.max) {
                            logger.info(`Property ${model.name} is greater than ${model.config.max}.`);
                            isValid = false;
                            return;
                        }
                    }

                break;
                case 'integer':
                    if (model.config as AttributeTypeInteger["config"] ) {
                        if (model.config.min && value < model.config.min) {
                            logger.info(`Property ${model.name} is less than ${model.config.min}.`);
                            isValid = false;
                            return;
                        }
                        if (model.config.max && value > model.config.max) {
                            logger.info(`Property ${model.name} is greater than ${model.config.max}.`);
                            isValid = false;
                            return;
                        }
                    }

                break;
                default:
                    logger.info("Probably an attribute? Huh", model)
            }
        })
        return isValid;
    }

    async validateObjectByType (obj: any, type: string) {
        let schema: AttributeModel[] = [];
        switch (type) {
            case "class":
                schema = CLASS_SCHEMA as AttributeModel[];
                break;
            default:
                try {
                    const classDoc = await this.db.get(type) as ClassModel;
                    schema = classDoc.schema;
                } catch (e) {
                    // if 404 validation failed because of missing class
                    logger.info("validateObjectByType - failed because of error",e)
                    return false;
                }
                // schema = BASE_SCHEMA;
        }
        return this.validateObject(obj, schema);
    }

    prepareDoc (_id: string, type: string, params: object) {
        logger.info("prepaerDoc - given args", {_id: _id, type: type, params: params});
        let doc: Document = {
            _id: _id,
            _rev: undefined,
            type: type,
            createTimestamp: new Date().getTime(),
        };
        doc = Object.assign(doc, params);
        logger.info("prepareDoc - first eleboration", doc)
        // TODO: consider managin defaults in another way, pouchdb plugin for triggers
        // var defaults = { type: type, timestamp: new Date().toISOString() };
        // if ( _id != null ) defaults = Object.assign(defaults, { _id: _id});
        // doc = Object.assign(doc, defaults);
        logger.info("prepareDoc - after elaborations", {"doc": doc}, );
        return doc;
    }

    async createDoc(docId: string, type: string, params) {
        logger.info("createDoc - args", {docId, type, params});
        let db = this.db,
            doc: Document,
            isNewDoc = false;
        try {
            if  (await !this.validateObjectByType(params, type)) {
                throw new Error("createDoc - Invalid object")
            }
            if ( docId ) {
                doc = await this.getDocument(docId) as Document;
                if ( doc._rev == null ) throw new Error("Doc with given id `"+docId+"` was not found")
                // means that the given docId was not found
                // therefore throw error
            } else {
               
                doc = this.prepareDoc(docId, type, params);
                //generate controlled docId
                isNewDoc = true;
                docId = ""+(this.lastDocId+1);
                logger.info("createDoc - generated docId", docId)
            }
            doc = Object.assign(doc,{...params,_id: docId, updateTimestamp: new Date().getTime()});
            logger.info("createDoc - doc after elaboration", doc)
            let response = await db.put(doc);
            logger.info("createDoc - Response after put",{"response": response});
            if (response.ok && isNewDoc) {
                this.incrementLastDocId();
                // let uploadedDoc = await db.get(response.id);
                // logger.info({"doc": uploadedDoc}, "createDoc - Uploaded doc")
                docId = response.id;
            }
            else if (response.ok) {
                docId = response.id;
            }
            else {
                throw new Error("createDoc - error:"+response.ok)
            }
        } catch (e) {
            if (e.name === 'conflict') {
                logger.info("createDoc - conflict! Ignoring..")
                // try {
                //     let error_response = await db.get(docId).then((_doc) => {   
                //         doc = Object.assign(_doc, doc);
                //         doc.updateTimestamp = new Date().getTime();
                //         doc._rev = _doc._rev;
                //         return db.put(doc);
                //     })
                //     logger.info("createDoc - Response after conflict put",{"response": error_response});
                // } catch (e) {
                //     logger.info("another error",e)
                // }
                
                // conflict!
              } else {
                logger.info("createDoc - Problem while putting doc", {
                    "error": e,
                    "document": doc
                })
            }
            return docId;
        }
    }
}

export default Surfer