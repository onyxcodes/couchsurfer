import Class from "../Class";

const ATTRIBUTE_TYPES = ["string", "number", "integer"];
type DecimalTypeConfig = {
    max: number, min: number, precision: number, isArray: boolean
}
type IntegerTypeConfig = {
    max: number, min: number, isArray: boolean
}
type StringTypeConfig = {
    charLength: number, isArray: boolean
}
type AttributeType = {
    type: "decimal" | "integer" | "string",
    config: DecimalTypeConfig | IntegerTypeConfig | StringTypeConfig
}
class Attribute {
    name: string;
    model: any;
    class: Class;
    constructor(classObj: Class = null, name: string, type: string, config?: any ) {
        // [TODO] Should check if attribute with this name
        // already exist whithin its context
        this.name = name;
        this.model = {}
        this.setModel({
            name: this.name
        });
        this.setType(type, config)
        // if it's given a class
        if ( classObj ) {
            // attempt to add attribute
            this.class = classObj;
        }
    }

    getModel() {
        return this.model || {};
    }

    getClass() {
        if (this.class) return this.class
        else throw Error("Missing class configuration for this attribute");
    }

    static async build( attributeObj: Attribute ) {
        let classObj = attributeObj.getClass();
        let db = classObj.getSpace();
        if ( db ) {
            await classObj.addAttribute(attributeObj);
            return attributeObj;
        } else {
            throw new Error("Missing db configuration");
        }
    }

    setModel( model ) {
        let currentModel = this.getModel();
        model = Object.assign(currentModel, model);
        this.model = model;
    }
    
    setType( type, config ) {
        if ( this.checkTypeValidity(type) ) {
            let model: {
                valid: any,
                type: string
            
            } = {
                valid: this.getTypeConf(type, config),
                type: type
            };
            this.setModel(model);
        } else throw Error("Invalid attribute type: "+type)
        // return this?
    }

    // getType()

    getName() {
        return this.name;
    }

    checkTypeValidity(type) {
        let validity = false;
        if ( ATTRIBUTE_TYPES.includes(type) ) {
            validity = true;
        }
        return validity;
    }

    // TODO: change to imported const default configs for types
    // as of now it accepts only string
    // TODO: since config depends on attribute's type, 
    // find a way to check if given configs are correct
    // find a way to add default configs base on type
    getTypeConf( type: "decimal" | "integer" | "string", config ) {
        let typeObj: AttributeType | undefined;
        switch( type ) {
            // TODO: add missing cases and change values to imported const 
            case "decimal":
                config = Object.assign({ max: null, min: null, precision: null, isArray: false}, config);
            break;
            case "integer":
                config = Object.assign({ max: null, min: null, isArray: false}, config);
            break;
            case "string":
                config = Object.assign({ charLength: 50, isArray: false }, config );
            break;
            default:
                throw new Error("Unexpected type: "+type);
                // return "^[a-zA-Z0-9_\\s]".concat("{0,"+config.charLength+"}$");
        }
        typeObj = Object.assign({
            type: type,
            config: config
        }, typeObj);
        return typeObj
    }
}

export default Attribute;