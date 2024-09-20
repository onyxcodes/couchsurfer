const {couchsurfer} = require("../lib/index.js");

const app = couchsurfer();

const port = process.env.SERVER_PORT || 5000;

const server = app.listen(port, () => console.log(`Listening on port ${port}`));