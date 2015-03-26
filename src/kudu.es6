import 'core-js/shim';

import Router from './router';
import Modeller from './modeller';

export default class Kudu {

  constructor( app, config = {} ) {

    // Keep a reference to the server (usually an Express app)
    this.app = app;

    // Set up database adapter
    if ( typeof config.databaseAdapter === 'function' ) {
      let Adapter = config.databaseAdapter;
      this.db = new Adapter(this, config.database);
    }

    // Set up modeller
    this.model = new Modeller();

    // Set up router
    this.router = new Router(this, config.router);
  }
}
