import Attribute from "./Attribute";
import Class from "./Class";
import Domain from "./Domain";
import Surfer from "./Surfer";

const testDataModel = async () => {
    console.log("Starting")
    // Surfer.clear("testDb")
    // return;
    let surferInstance = new Surfer("db-test", {adapter: 'memory', plugins: [
        
    ]});
    surferInstance = await Surfer.build(surferInstance);
    var TestClass = new Class(surferInstance, "TestClass", "class", "A test");
    // Create attribute and adds it to above class
    var TestAttribute = new Attribute(TestClass, "TestAttribute", "string", { charLength: 100 });
    
    console.log("testDataModel -  built surfer instance")
    TestClass = await Class.build(TestClass);
    console.log("testDataModel -  commited class creation")
    // add attribute to TestClass
    console.log("testDataModel -  adding attribute to class")
    await TestClass.addAttribute(TestAttribute);
    console.log("testDataModel -  added attribute to class")
    // Should cause error since attribute with the same name was already added 
    // let TestAttributeWithClass;
    // try {
    //   TestAttributeWithClass = new Attribute("TestAttribute", "string", { charLength: 100 }, TestClass);
    // } catch (e) {
    //   console.log("Error", e);
    // }
    // Should auto add attribute to above class
    console.log("testDataModel -  adding attribute to class")
    let TestAnotherAttrWithClass = new Attribute(TestClass, "TestAnotherAttrWithClass", "string", { charLength: 100, isArray: true });
    TestAnotherAttrWithClass = await Attribute.build(TestAnotherAttrWithClass);
    console.log("result", {result: TestClass.getModel()})
    let aDocument = await surferInstance.createDoc(null, TestClass, {TestAttribute: "TestValue", TestAnotherAttrWithClass: ["TestValue1", "TestValue2"]});
    console.log("aDocument was created", aDocument)
    let allDocs = await TestClass.getCards(null, null, 0, undefined);
    console.log("allDocs", allDocs)

    let MyDomain = new Domain(surferInstance, "MyDomain", "My Domain", ["TestClass"], ["TestClass"], "one-to-one");
}

export default testDataModel;