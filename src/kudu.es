import { Model } from './models';

class Kudu {

  constructor( app ) {

    // Keep a reference to the server (usually an Express app)
    this.app = app;

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

  getModel( name ) {
    return this.modelsBySingularName[ name.toLowerCase() ];
  }

  getModelByPluralName( name ) {
    return this.modelsByPluralName[ name.toLowerCase() ];
  }
}

Kudu.Model = Model;

export { Kudu };
