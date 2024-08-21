import { encryptString } from "../crypto";
import Attribute from "./Attribute";
import Class from "./Class";
import Domain from "./Domain";
import Surfer from "./Surfer";

const testDataModel = async () => {
    console.log("Starting")
    // Surfer.clear("db-test")
    // return;
    let surferInstance = new Surfer("db-test", {adapter: 'memory', plugins: [
        
    ]});
    surferInstance = await Surfer.build(surferInstance);
    var TestClass = new Class(surferInstance, "TestClass", "class", "A test");
    // Create attribute and adds it to above class
    var TestAttribute = new Attribute(TestClass, "TestAttribute", "string", { maxLength: 100 });
    
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
    //   TestAttributeWithClass = new Attribute("TestAttribute", "string", { maxLength: 100 }, TestClass);
    // } catch (e) {
    //   console.log("Error", e);
    // }
    // Should auto add attribute to above class
    console.log("testDataModel -  adding attribute to class")
    let TestAnotherAttrWithClass = new Attribute(TestClass, "TestAnotherAttrWithClass", "string", { maxLength: 100, isArray: true });
    TestAnotherAttrWithClass = await Attribute.build(TestAnotherAttrWithClass);
    console.log("result", {result: TestClass.getModel()})
    let aDocument = await surferInstance.createDoc(null, TestClass, {TestAttribute: "TestValue", TestAnotherAttrWithClass: ["TestValue1", "TestValue2"]});
    console.log("aDocument was created", aDocument)
    let testclassDocs = await TestClass.getCards(null, null, 0, undefined);
    // console.log("allDocs of class TestClass", allDocs)
    // let allDocs = await 

    var UserClass = new Class(surferInstance, "User", "class", "A user class for secure login");
    UserClass = await Class.build(UserClass);

    // Create attributes and add them to the User class
    var UsernameAttribute = new Attribute(UserClass, "username", "string", { maxLength: 50, mandatory: true });
    var PasswordAttribute = new Attribute(UserClass, "password", "string", { maxLength: 200, mandatory: true, encrypted: true });
    var EmailAttribute = new Attribute(UserClass, "email", "string", { maxLength: 100, mandatory: false });
    var FirstNameAttribute = new Attribute(UserClass, "firstName", "string", { maxLength: 100, mandatory: false });
    var LastNameAttribute = new Attribute(UserClass, "lastName", "string", { maxLength: 100, mandatory: false });

    UsernameAttribute = await Attribute.build(LastNameAttribute);
    PasswordAttribute = await Attribute.build(LastNameAttribute);
    EmailAttribute = await Attribute.build(LastNameAttribute);
    FirstNameAttribute = await Attribute.build(LastNameAttribute);
    LastNameAttribute = await Attribute.build(LastNameAttribute);

    // console.log("UserClass -  built User class!")
    // UserClass = await Class.build(UserClass);
    
    console.log({"User": JSON.stringify(UserClass.getModel(), null, 2)})

    const encryptedPassword = encryptString("admin");
    let userDocument = await surferInstance.createDoc(null, UserClass, {username: "admin", password: encryptedPassword, email: "admin@email.com", firstName: "FirstName", lastName: "LastName"});

    console.log("userDocument was created", userDocument)
    let userDocs = await UserClass.getCards(null, null, 0, undefined);

    console.log("userDocs", userDocs)
    // let MyDomain = new Domain(surferInstance, "MyDomain", "My Domain", ["TestClass"], ["TestClass"], "one-to-one");
}

export default testDataModel;


// FAILS
// var UserClass = new Class(surferInstance, "User", "class", "A user class for secure login");

// // Create attributes and add them to the User class
// var UsernameAttribute = new Attribute(UserClass, "username", "string", { maxLength: 50, mandatory: true });
// var PasswordAttribute = new Attribute(UserClass, "password", "string", { maxLength: 100, mandatory: true, encrypted: true });
// var EmailAttribute = new Attribute(UserClass, "email", "string", { maxLength: 100, mandatory: false });
// var FirstNameAttribute = new Attribute(UserClass, "firstName", "string", { maxLength: 100, mandatory: false });
// var LastNameAttribute = new Attribute(UserClass, "lastName", "string", { maxLength: 100, mandatory: false });

// await UserClass.addAttribute(UsernameAttribute);
// await UserClass.addAttribute(PasswordAttribute);
// await UserClass.addAttribute(EmailAttribute);
// await UserClass.addAttribute(FirstNameAttribute);
// LastNameAttribute = await Attribute.build(LastNameAttribute);

// console.log("UserClass -  built User class!")
// UserClass = await Class.build(UserClass);

// console.log({"User": JSON.stringify(UserClass.getModel(), null, 2)})