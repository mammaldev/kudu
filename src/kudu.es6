import deserialize from 'kudu-deserializer-jsonapi';
import serialize from 'kudu-serializer-jsonapi';
import MemoryAdapter from './adapter';
import BaseModel from './model';
import Router from './router';

export default class Kudu {

  constructor( app, config = {} ) {

    // Keep a reference ot the server (usually an Express app).
    this.app = app;

    // Set up the data access adapter. The adapter config must have a 'type'
    // property that refers to a constructor function. If no adapter was
    // specified we default to built-in in-memory storage.
    if ( config.adapter && typeof config.adapter.type !== 'function' ) {
      throw new Error('Adapter config must include a "type" constructor.');
    } else if ( !config.adapter ) {
      config.adapter = {
        type: MemoryAdapter,
      };
    }

    // Instantiate the adapter, passing through any options specified for it
    // and expose the instance on the Kudu app.
    this.db = new config.adapter.type(config.adapter.config);

    // Create the model store. All models created for this app will be
    // referenced from this object. Since models have both a singular and
    // plural name we have two stores, each keyed by one form.
    this.models = new Map();
    this.modelsByPluralName = new Map();

    // Create a Router instance for this app, passing through any configuration
    // provided for it.
    this.router = new Router(this, config.router);

    // Any extra data provided in the config object is just attached straight
    // to the instance. This extra data can be anything that's useful to an app
    // across e.g. route handlers and controllers. By attaching it to the Kudu
    // instance application code doesn't have to worry about passing it around.
    this.services = config.services || {};

    // Create a serializer and deserializer for this app. The defaults expect
    // to handle data in a format that complies with the JSON API spec.
    this.deserialize = deserialize.bind(null, this);
    this.serialize = serialize;
  }

  // Create a new model. The result will be a constructor function that can
  // produce model instances and interact with stored instances via static
  // methods.
  //
  // Arguments:
  //
  //   singular    {String}    The name of the model in singular form.
  //
  //   [plural]    {String}    The name of the model in plural form. Defaults
  //                           to the singular name with an appended 's'.
  //
  //   schema      {Object}    The fields available to instances of this model
  //                           plus the constraints applied to those fields, as
  //                           well as any relationships to other models.
  //
  createModel( singular, plural, schema ) {

    // Plural name is optional. If it isn't provided the second argument should
    // be the schema object.
    if ( typeof plural === 'object' ) {
      schema = plural;
      plural = `${ singular }s`;
    }

    if ( typeof schema !== 'object' ) {
      throw new Error('No schema provided.');
    }

    let kudu = this;

    class Model extends BaseModel {

      static singular = singular
      static plural = plural
      static schema = schema

      // Find an instance of this model by unique identifier.
      static get( id ) {

        // If we don't have an identifer we can't find a model instance.
        if ( id === undefined ) {
          return Promise.reject(new Error('Expected a model identifier'));
        }

        return kudu.db.get(singular, id);
      }

      // Extend the schema of this model with that of another. The subclass
      // takes precedence if the same property is defined on both schemas.
      static inherits( ctor ) {

        if ( ctor === undefined ) {
          throw new Error('Expected a model constructor to inherit from.');
        }

        Model.schema.properties = Object.assign(
          ctor.schema.properties,
          Model.schema.properties
        );

        // Subclass model constructors also inherit hook functions. In cases
        // where both sub and super constructor provide a function for the same
        // event they are run consecutively, starting with those defined by the
        // super constructor.
        if ( ctor.schema.hooks ) {

          // If the subclass constructor doesn't have any hooks defined we can
          // just use the superclass hooks as-is. Otherwise we have to merge
          // the two sets.
          const hooks = Model.schema.hooks;

          if ( !hooks ) {
            Model.schema.hooks = ctor.schema.hooks;
          } else {

            Object.keys(ctor.schema.hooks).forEach(( hook ) => {

              // Ensure both the sub/super constructor hooks are arrays. This
              // makes it easier to combine them with simple concatenation.
              let subHooks = ctor.schema.hooks[ hook ];
              if ( !Array.isArray(subHooks) ) {
                subHooks = [ subHooks ];
              }

              if ( !Array.isArray(hooks[ hook ]) ) {
                hooks[ hook ] = [ hooks[ hook ] ];
              }

              hooks[ hook ] = hooks[ hook ].concat(subHooks);
            });
          }
        }
      }

      constructor( data ) {
        super(kudu, data);
      }
    }

    // Add the new model to the model cache.
    this.models.set(singular, Model);
    this.modelsByPluralName.set(plural, Model);

    return Model;
  }

  // Get a model constructor previously created with Kudu#createModel.
  //
  // Arguments:
  //
  //   singular    {String}    The name of the model in singular form.
  //
  getModel( singular ) {
    return this.models.get(singular);
  }

  // Set up generic API route handlers on the Express app registered with the
  // Kudu instance. Proxy for Router#createGenericRoutes
  createGenericRoutes() {
    this.router.createGenericRoutes();
  }
}
