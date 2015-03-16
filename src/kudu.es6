import 'core-js/shim';

import Router from './router';
import Model from './models';

export default class Kudu {

  static get Router() {
    return Router;
  }

  static get Model() {
    return Model;
  }

  constructor( app, config = {} ) {

    // Keep a reference to the server (usually an Express app)
    this.app = app;

    // Set up database adapter
    if ( typeof config.databaseAdapter === 'function' ) {
      let Adapter = config.databaseAdapter;
      this.db = new Adapter(this, config.database);
    }

    // Set up router
    this.router = new Kudu.Router(this, config.router);

    // Set up app-wide caches
    this.modelsBySingularName = {};
    this.modelsByPluralName = {};
  }

  // Create a new instance of Kudu.Model which can be used as a constructor for
  // instances of a custom model. Stores the constructor in an app-wide model
  // cache. Takes the model name (singular and optional plural string), an
  // optional parent model and a schema object.
  createModel( singular, plural, schema, parent ) {

    // Plural name is optional. If present it should be a string. If missing it
    // will default to the singular name with 's' appended.
    if ( typeof plural === 'object' ) {
      parent = schema;
      schema = plural;
      plural = singular + 's';
    }

    let Constructor;

    // If the model inherits from another we get the parent constructor and
    // pass it through to Kudu.Model. The Kudu.Model constructor is overloaded
    // hence the separate invocations.
    if ( typeof parent === 'string' ) {
      parent = this.getModel(parent);
      Constructor = new Kudu.Model(parent, schema);
    } else {
      Constructor = new Kudu.Model(schema);
    }

    // Expose the singular and plural names on the constructor.
    singular = singular.toLowerCase();
    plural = plural.toLowerCase();
    [ Constructor.singular, Constructor.plural ] = [ singular, plural ];

    // Add the constructor to the app-wide model caches.
    this.modelsBySingularName[ singular ] = Constructor;
    this.modelsByPluralName[ plural ] = Constructor;

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
