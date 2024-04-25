import Attribute, { AttributeModel, AttributeType } from '../Attribute'
import Surfer, { Document } from '../Surfer';
// import DbManager from '..';

const CLASS_TYPE = "class";
const SUPERCLASS_TYPE = "superclass";
const CLASS_TYPES = [CLASS_TYPE, SUPERCLASS_TYPE];

export type ClassModel = Document & {
    type: "class",
    name: string,
    description: string,
    parentClass?: string,
    schema?: AttributeModel[]
    
}

class Class {
    space?: Surfer | null;
    name: string;
    type: 'class';
    title: string;
    attributes: Attribute[];
    id: string | null;
    parentClass: Class | null;
    model: ClassModel;

    constructor(
        space: Surfer | null = null,
        name: string,
        type: 'class' = CLASS_TYPE,
        title = name,
        parentClass: Class | null = null
    ) {
        this.name = name,
            this.title = title,
            this.type = type,
            this.attributes = [],
            this.space = null,
            this.id = null,
            this.parentClass = parentClass;
        if ( space ) {
            this.space = space;
        }

        if (parentClass) this.inheritAttributes(parentClass);
    }

    inheritAttributes( parentClass: Class ) {
        let parentAttributes = parentClass.getAttributes();
        for ( let attribute of parentAttributes ) {
            this.addAttribute(attribute);
        }
    }

    static async build( classObj: Class ) {
        let space = classObj.getSpace();
        if ( space ) {
            // if (parentClassName) this.setParentClass(parentClassName);
            let id = await space.addClass(classObj);
            classObj.setId(id);
            return classObj;
        } else {
            throw new Error("Missing db configuration");
        }

    }

    setId( id: string ) {
        if ( id ) this.id = id;
        else throw Error("Missing id");
    } 

    getName() {
        return this.name;
    }

    getSpace() {
        return this.space;
    }

    getTitle() {
        return this.title;
    }

    getType() {
        return this.type;
    }

    getId() {
        return this.id;
    }

    getModel() {
        let model: {
            name?: string;
            description?: string;
            schema?: {}[];
            type?: string,
        } = {};

        model["name"] = this.getName();
        model["description"] = this.getTitle();
        model["schema"] = [];
        // model["type"] = this.getType();
        // iterate over attributes and append their model
        for ( let attribute of this.getAttributes() ) {
            let attributeModel = attribute.getModel();
            model["schema"].push( attributeModel );
        }
        return model;
    }

    setModel( model: ClassModel ) {
        let currentModel = this.getModel();
        model = Object.assign(currentModel, model);
        this.name = model.name;
        this.title = model.description;
        this.model = model;
        // this.type = model.type;
        // this.attributes = model.schema;
        for (let attribute of model.schema) {
            this.addAttribute(attribute.name, attribute.type);
        }
        
    }

    // TODO: should be no longer needed
    // setType( type: 'class' | 'superclass' ) {
    //     this.type = type;
    //     // return this?
    // }

    // TODO
    // async getSuperClassIfExists( superClassName ) {
    //     let db = this.getDb();
    //     let schema = await db.getClassModel(SUPERCLASS_TYPE, superClassName);
    //     return null; // TODO: change into superclass object
    // }

    // async setParentClass( superClassName ) {
    //     let parentClass = await this.getSuperClassIfExists(superClassName);
    //     if ( parentClass ) {
    //         // ereditate all attributes
    //         // parentClass.getAttributes()
    //         this.parentClass = parentClass;
    //     }
    // }


    getAttributes( ...names: string[] ) {
        let attributes = [ ];
        for ( let attribute of this.attributes ) {
            if ( names.length > 0 ) {
                // filter with given names
                for ( let name of names ) {
                    // match?
                    if ( name != null && attribute.getName() == name ) {
                        return [ attribute ];
                    } 
                }
            } else attributes.push(attribute); // no filter, add all
        }
        return attributes
    }

    hasAllAttributes( ...names: string[] ) {
        let result = false;
        let attributes = this.getAttributes(...names);
        for ( let attribute of attributes ) {
            result = names.includes(attribute.getName())
            if ( !result ) break;
        }
        return result;
    }

    hasAnyAttributes( ...names: string[] ) {
        let result = false;
        let attributes = this.getAttributes(...names);
        for ( let attribute of attributes ) {
            result = names.includes(attribute.getName())
            if ( result ) break;
        }
        return result;
    }

    // interface of hasAnyAttributes
    hasAttribute( name: string ) {
        return this.hasAnyAttributes( name )
    }

    /**
     * 
     * @param {Attribute} attribute 
     */
    async addAttribute(nameOrAttribute: string | Attribute, type?: AttributeType["type"]) {
        try {
            let attribute;
            if (typeof nameOrAttribute === 'string' && type) {
                attribute = new Attribute(this, nameOrAttribute, type);
            } else if (typeof nameOrAttribute === 'object') {
                attribute = nameOrAttribute;
            } else {
                throw new Error('Invalid arguments');
            }

            let name = attribute.getName();
            if (!this.hasAttribute(name)) {
                this.attributes.push(attribute);
                // update class on db
                if (this.space && this.id) {
                    await this.space.updateClass(this);
                    // TODO: Check if this class has subclasses
                    // if ( this.class ) 
                }
                return this; // return class object
            } else throw Error("Attribute with name " + name + " already exists within this Class")
        } catch (e) {
            throw Error('' + e);
        }
    }
}

export default Class;