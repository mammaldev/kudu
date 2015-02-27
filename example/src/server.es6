import Kudu from 'kudu';
import CouchAdapter from 'kudu-db-couch';

import express from 'express';
import { json } from 'body-parser';

import path from 'path';
import fs from 'fs';

let expressApp = express();
expressApp.use(json());

let app = new Kudu(expressApp, {
  databaseAdapter: CouchAdapter,
  database: {
    url: process.env.DB_URL,
    views: {
      descendants: {
        design: 'general',
        view: 'descendant_type-ancestor_type-ancestor_id'
      }
    }
  }
});

// Register models
require('./models/base')(app);
require('./models/user')(app);

// Custom routes
const ROUTES_DIR = path.join(__dirname, 'routes');
for ( let file of fs.readdirSync(ROUTES_DIR) ) {
  require(path.join(ROUTES_DIR, file))(app);
}

// Enable the generic API
app.router.enableGenericRouteHandlers();

let server = expressApp.listen(process.env.PORT, () => {

  let { address, port } = server.address();
  console.log(`Example app listening at http://${address}:${port}`);
});
