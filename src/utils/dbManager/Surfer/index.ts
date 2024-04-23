import NodePouchDB from "pouchdb-node";
import Find from 'pouchdb-find'
import serverLogger from "../../../utils/logger/server-logger";
import { ClassModel } from "../Class";
const logger = serverLogger.child({module: "pouchdb"})

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
            // console.log("initdb - res", res)
            if (!lastDocId) {
                // console.log("initdb - initializing db")
                let response = await this.db.put({
                    _id: "lastDocId",
                    value: ++lastDocId
                });
                if (response.ok) this.lastDocId = lastDocId;
                else throw new Error("Got problem while putting doc"+ response);
            } else {
                console.log("initdb - db already initialized, consider purge")
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
    async getDocRevision(docId) {
        let rev; 
        try {
            let doc = await this.db.get(docId);
            rev = doc?._rev;
        } catch (e) {
            throw new Error(e);
        }
        return rev;
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
    
            console.log("findDocument - found", foundResult);
            result = { docs: foundResult.docs, selector, skip, limit };
            return result;
        } catch (e) {
            console.log("findDocument - error",e);
            return {docs: [], error: e.toString(),selector, skip, limit};
        }
    }

    // TODO: Do not confuse Class with Class models
    async getClassModel( className ) {
        let selector = {
            type: { $eq: "class" },
            name: { $eq: className }
        };

        let response = await this.findDocument(selector);
        let result: ClassModel = response.docs[0] as ClassModel
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

    async clear () {
        try {
            let res = await this.db.destroy(null, () => console.log("clear - Destroyed db"));
        } catch (e) {
            logger.error("clear - Error while destroying db"+e)
        }
    }

    async addClass( classObj ) {
        // Check for existance
        // let exists = awaut getClass()
        let classModel = classObj.getModel();
        let existing = await this.getClassModel(classModel.name);
        if ( existing == null ) {
            let result = await this.createDoc(null, classObj.getType(), classObj.getModel());
            console.log("addClass - result", result)
            return result;
        } else {
            return existing[0]._id;
        } 
    }

    async updateClass( classObj ) {
        let result = await this.createDoc(classObj.getId(), classObj.getType(), classObj.getModel());
        return result;
    }

    prepareDoc (_id: string, type: string, params: object) {
        console.log("prepaerDoc - given args", {_id: _id, type: type, params: params});
        let doc: PouchDB.Core.ExistingDocument<{}>;
        doc = Object.assign(doc, params);
        console.log("prepareDoc - first eleboration", doc)
        // TODO: consider managin defaults in another way, pouchdb plugin for triggers
        var defaults = { type: type, timestamp: new Date().toISOString() };
        if ( _id != null ) defaults = Object.assign(defaults, { _id: _id});
        doc = Object.assign(doc, defaults);
        console.log("prepareDoc - after elaborations", {"doc": doc}, );
        return doc;
    }

    async createDoc(docId: string, type: string, params) {
        console.log("createDoc - args", {docId, type, params});
        let db = this.db,
            doc: PouchDB.Core.ExistingDocument<{}>,
            isNewDoc = false;
        try {
            doc = this.prepareDoc(docId, type, params);
            if ( docId ) {
                doc._rev = await this.getDocRevision(docId);
                if ( doc._rev == null ) throw new Error("Doc with given id `"+docId+"` was not found")
                // means that the given docId was not found
                // therefore throw error
            } else {
                //generate controlled docId
                isNewDoc = true;
                docId = ""+(this.lastDocId+1);
                console.log("createDoc - generated docId", docId)
            }
            doc = Object.assign({_id: docId}, doc);
            let response = await db.put(doc);
            console.log("createDoc - Response after put",{"response": response});
            if (response.ok && isNewDoc) {
                this.incrementLastDocId();
                // let uploadedDoc = await db.get(response.id);
                // console.log({"doc": uploadedDoc}, "createDoc - Uploaded doc")
                return response.id;
            }
            else if (response.ok) return response.id;
            else throw new Error("createDoc - error:"+response.id)
        } catch (e) {
            logger.error("createDoc - Problem while putting doc", {
                "error": e,
                "document": doc
            })
            // throw new Error(e); // TODO understand if needed
        }
    }
}

export default Surfer