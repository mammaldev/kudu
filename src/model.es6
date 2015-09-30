import validate from './validate';

export default class BaseModel {

  constructor( app, data = {} ) {

    // Expose a reference to the Kudu app. This is important because instances
    // have methods ('save' for example) that perform data access.
    this.app = app;

    // If an initial data object is provided to a model constructor the
    // properties of that object are mapped onto the resulting instance.
    Object.keys(data).forEach(( key ) => this[ key ] = data[ key ]);
  }

  // Persist the model instance via the adapter configured for use with the
  // Kudu app.
  save() {

    // Attempt to validate the instance. We don't want to save invalid models.
    try {
      validate(this);
    } catch ( err ) {
      return Promise.reject(err);
    }

    // If the instance does not have a "type" property we add one to it with
    // the singular model name as the value. This is used by the adapter to
    // determine where to persist the instance.
    if ( this.type === undefined ) {
      this.type = this.constructor.singular;
    }

    // If we reached this point the the model is valid. We pass it off to the
    // adapter to persist. The adapter method must return a promise that will
    // resolve to an object representing this model instance.
    return this.app.db.create(this)
    .then(( result ) => {

      // Merge the object returned from the adapter with this model instance to
      // bring in any new properties added by the adapter (such as a generated
      // identifier).
      Object.keys(result).forEach(( key ) => this[ key ] = result[ key ]);

      return this;
    });
  }

  // Update the model instance via the adapter configured for use with the Kudu
  // app.
  update() {

    // Attempt to validate the instance. We don't want to save invalid models.
    try {
      validate(this);
    } catch ( err ) {
      return Promise.reject(err);
    }

    // If we reached this point the the model is valid. We pass it off to the
    // adapter to persist. The adapter method must return a promise that will
    // resolve to an object representing this model instance.
    return this.app.db.update(this)
    .then(( result ) => {

      // Merge the object returned from the adapter with this model instance to
      // bring in any new or updated properties added by the adapter (such as
      // an "updated at" property).
      Object.keys(result).forEach(( key ) => this[ key ] = result[ key ]);

      return this;
    });
  }

  // Delete the model instance via the adapater configured for use with the
  // Kudu app.
  delete() {

    return this.app.db.delete(this)
    .then(( result ) => {

      return this;
    });
  }
}
