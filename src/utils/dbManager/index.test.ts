import Class from "./Class";
import Attribute from "./Attribute";
import Surfer from "./Surfer";
import Domain from "./Domain";

const mockClassInst = {
    getCards: jest.fn().mockImplementation(() => {
        
    }),
    addAttribute: jest.fn().mockImplementation(() => {
    })
}

const mockSurferInst = {
    createDoc: jest.fn().mockImplementation(() => {
        
    })
}


// Mock the Surfer class
jest.mock('./Surfer', () => {
    const MockSurfer: jest.Mock<any, any, any> & {
        [key: string]: any,
    } = jest.fn().mockImplementation((...args) => {
        console.log('MockClass constructor called with args:', args);
        return {
            createDoc: jest.fn().mockResolvedValue({}),
            build: jest.fn().mockResolvedValue({}),
            // Mock other Surfer methods as needed
        };

    });
    MockSurfer.build = jest.fn().mockImplementation((arg) => Surfer);
    return {__esModule: true, default: MockSurfer};
});

// Mock the Class class
jest.mock('./Class', () => {
  let MockClass: jest.Mock<any, any, any> & {
    [key: string]: any,
} = jest.fn().mockImplementation(() => {
    return {
      addAttribute: jest.fn().mockResolvedValue({}),
      getCards: mockClassInst.getCards,
      // Mock Class methods as needed
    };
  });
    MockClass.build = () => MockClass;
    return {__esModule: true, default: MockClass};
});

// Mock the Attribute class
jest.mock('./Attribute', () => {
  let MockAttribute: jest.Mock<any, any, any> & {
    [key: string]: any,
} = jest.fn().mockImplementation(() => {
    return {
      build: jest.fn().mockResolvedValue({}),
      // Mock Attribute methods as needed
    };
  });
    MockAttribute.build = jest.fn().mockImplementation((arg) => Surfer);
    return {__esModule: true, default: MockAttribute};
});

test('Basic data model interactions', async () => {
    console.log("Starting")

    expect(3).toBe(3);

    let surferInstance = new Surfer("testDb", {adapter: 'memory', plugins: []});

    surferInstance = await Surfer.build(surferInstance);
    
    var TestClass = new Class(surferInstance, "TestClass", "class");
    var TestAttribute = new Attribute(TestClass, "TestAttribute", "string", { charLength: 100 });

    
    // Add assertions to check that the mocked methods were called with the correct arguments
    expect(Surfer).toHaveBeenCalledWith("testDb", {adapter: 'memory', plugins: []});
    // expect(surferInstance).toBeInstanceOf(Surfer);
    expect(Class).toHaveBeenCalledWith(surferInstance, "TestClass", "class");
    expect(Attribute).toHaveBeenCalledWith(TestClass, "TestAttribute", "string", { charLength: 100 });

    TestClass = await Class.build(TestClass);
    // expect(TestClass).toBeInstanceOf(Class);
    expect(Class.build).toHaveBeenCalledWith(TestClass);

    await TestClass.addAttribute(TestAttribute);
    expect(mockClassInst.addAttribute).toHaveBeenCalledWith(TestAttribute);

    let TestAnotherAttrWithClass = new Attribute(TestClass, "TestAnotherAttrWithClass", "string", { charLength: 100, isArray: true });
    TestAnotherAttrWithClass = await Attribute.build(TestAnotherAttrWithClass);
    // expect(TestAnotherAttrWithClass).toBeInstanceOf(Attribute);
    expect(Attribute.build).toHaveBeenCalledWith(TestAnotherAttrWithClass);

    let aDocument = await surferInstance.createDoc(null, TestClass, {TestAttribute: "TestValue", TestAnotherAttrWithClass: ["TestValue1", "TestValue2"]});
    expect(surferInstance.createDoc).toHaveBeenCalledWith(null, "TestClass", {TestAttribute: "TestValue", TestAnotherAttrWithClass: ["TestValue1", "TestValue2"]});

    let allDocs = await TestClass.getCards(null, null, 0, undefined);
    expect(TestClass.getCards).toHaveBeenCalledWith(null, null, 0, undefined);
});


// const testFind = async () => {
//     let testDbMg = new DbManager("testDb");
//     testDbMg = await DbManager.build(testDbMg);
//     let filteredClasses = await testDbMg.getClasses(["TestClass"]);
//     debugger;

// }

// export default testDataModel;

