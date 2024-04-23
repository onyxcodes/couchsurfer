import Class from "./Class";
import Attribute from "./Attribute";
import Surfer from "./Surfer";

const testDataModel = async () => {
    console.log("Starting")
    let surferInstance = new Surfer("testDb", {adapter: 'memory', plugins: [
        
    ]});
    surferInstance = await Surfer.build(surferInstance);
    var TestClass = new Class(surferInstance, "TestClass", "class");
    // Create attribute and adds it to above class
    var TestAttribute = new Attribute(TestClass, "TestAttribute", "string", { charLength: 100 });
    
    surferInstance = await Surfer.build(surferInstance);
    TestClass = await Class.build(TestClass);
    debugger;
    // add attribute to TestClass
    await TestClass.addAttribute(TestAttribute);
    // Should cause error since attribute with the same name was already added 
    // let TestAttributeWithClass;
    // try {
    //   TestAttributeWithClass = new Attribute("TestAttribute", "string", { charLength: 100 }, TestClass);
    // } catch (e) {
    //   console.log("Error", e);
    // }
    // Should auto add attribute to above class
    let TestAnotherAttrWithClass = new Attribute(TestClass, "TestAnotherAttrWithClass", "string", { charLength: 100, isArray: true });
    TestAnotherAttrWithClass = await Attribute.build(TestAnotherAttrWithClass);
    console.log("result", {result: TestClass.getModel()})
}

// const testFind = async () => {
//     let testDbMg = new DbManager("testDb");
//     testDbMg = await DbManager.build(testDbMg);
//     let filteredClasses = await testDbMg.getClasses(["TestClass"]);
//     debugger;

// }

const test = async() => {
    await testDataModel();
    // testFind();
}

export default test;

