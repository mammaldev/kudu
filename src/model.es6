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

    // If we reached this point the the model is valid.
    return Promise.resolve();
  }
}
