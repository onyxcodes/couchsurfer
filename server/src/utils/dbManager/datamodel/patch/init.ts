// The idea is to make this patch object be processed
// storing the version of the patch and the documents contained in it


// The first version contains the essential datamodel required for the framework to work
// This has not been hardcoded in the framework, but is a patch that can be applied to the database
const patch = {
  version: "1.0.0",
  docs: [
    {
      "_id": "User",
      "name": "User",
      "description": "A user class for secure login",
      "type": "class",
      "schema": [
        {
          "name": "username",
          "type": "string",
          "config": {
            "maxLength": 50,
            "isArray": false
          }
        },
        {
          "name": "password",
          "type": "string",
          "config": {
            "maxLength": 50,
            "isArray": false
          }
        },
        {
          "name": "email",
          "type": "string",
          "config": {
            "maxLength": 50,
            "isArray": false
          }
        },
        {
          "name": "firstName",
          "type": "string",
          "config": {
            "maxLength": 50,
            "isArray": false
          }
        },
        {
          "name": "lastName",
          "type": "string",
          "config": {
            "maxLength": 50,
            "isArray": false
          }
        }
      ],
      // "_rev": "1-f09d93de1ed4266eb40dca6ceb5a44de"
    },
    {
      "_id": "UserSession",
      "name": "UserSession",
      "description": "Tracks user sessions",
      "type": "class",
      "schema": [
        {
          "name": "username",
          "type": "string",
          "config": {
            "maxLength": 50,
            "isArray": false,
            "primaryKey": true,
            "mandatory": true
          }
        },
        {
          "name": "sessionId",
          "type": "string",
          "config": {
            "maxLength": 200,
            "isArray": false,
            "mandatory": true
          }
        },
        {
          "name": "sessionStart",
          "type": "string",
          "config": {
            "maxLength": 100,
            "isArray": false,
            "mandatory": true
          }
        },
        {
          "name": "sessionStatus",
          "type": "string",
          "config": {
            "maxLength": 100,
            "isArray": false,
            "mandatory": true
          }
        },
        {
          "name": "sessionEnd",
          "type": "string",
          "config": {
            "maxLength": 100,
            "isArray": false,
            "mandatory": false
          }
        }
      ]
    }
  ]
}

export default patch;