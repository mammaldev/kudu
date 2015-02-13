import 'core-js/shim';

import { Router } from './router';
import { Model } from './models';

class Kudu {

  constructor( app, config = {} ) {

    // Keep a reference to the server (usually an Express app)
    this.app = app;

    // Set up database adapter
    if ( typeof config.databaseAdapter === 'function' ) {
      this.db = new config.databaseAdapter(this, config.database);
    }

    // Set up router
    this.router = new Kudu.Router(this);

    // Set up app-wide caches
    this.modelsBySingularName = {};
    this.modelsByPluralName = {};
  }

  // Create a new instance of Kudu.Model which can be used as a constructor for
  // instances of a custom model. Stores the constructor in an app-wide model
  // cache. Takes the model name (singular and optional plural string) and a
  // schema object.
  createModel( singular, plural, schema ) {

    // Plural name is optional. If present it should be a string. If missing it
    // will default to the singular name with 's' appended.
    if ( typeof plural === 'object' ) {
      schema = plural;
      plural = singular + 's';
    }

    let Constructor = new Kudu.Model(schema);
    this.modelsBySingularName[ singular.toLowerCase() ] = Constructor;
    this.modelsByPluralName[ plural.toLowerCase() ] = Constructor;

    return Constructor;
  }

  // Retrieve a model constructor from the app-wide cache of models. Takes the
  // name (case-insensitive string) of a model.
  getModel( name ) {
    return this.modelsBySingularName[ name.toLowerCase() ];
  }

  // Retrieve a model constructor from the app-wide cache of models. Takes the
  // pluralised name (case-insensitive string) of a model.
  getModelByPluralName( name ) {
    return this.modelsByPluralName[ name.toLowerCase() ];
  }
}

Kudu.Router = Router;
Kudu.Model = Model;
Kudu.DB = {};

export { Kudu };
