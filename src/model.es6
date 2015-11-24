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

    // Models can define a "create" hook which can modify the instance before
    // saving. This is useful for e.g. setting a "created at" timestamp. If a
    // "create" hook function has been defined for the model we invoke it now
    // before validating the instance.
    const hooks = this.constructor.schema.hooks || {};

    // If a hook is an array rather than a function we run all functions in
    // the array in turn.
    if ( Array.isArray(hooks.onCreate) ) {
      hooks.onCreate.forEach(( hook ) => void hook.call(this));
    } else if ( typeof hooks.onCreate === 'function' ) {
      hooks.onCreate.call(this);
    }

    // Attempt to validate the instance. We don't want to save invalid models.
    try {
      this.app.validateInstance(this);
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

    // Models can define an "update" hook which can modify the instance before
    // saving. This is useful for e.g. setting an "updated at" timestamp. If an
    // "update" hook function has been defined for the model we invoke it now
    // before validating the instance.
    const hooks = this.constructor.schema.hooks || {};

    // If a hook is an array rather than a function we run all functions in
    // the array in turn.
    if ( Array.isArray(hooks.onUpdate) ) {
      hooks.onUpdate.forEach(( hook ) => void hook.call(this));
    } else if ( typeof hooks.onUpdate === 'function' ) {
      hooks.onUpdate.call(this);
    }

    // Attempt to validate the instance. We don't want to save invalid models.
    try {
      this.app.validateInstance(this);
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

  // Get other model instances related to this one and attach them to it based
  // on the relationships configured in its schema.
  link( relations ) {

    const relationships = this.constructor.schema.relationships;

    if ( !Array.isArray(relations) ) {
      relations = [ relations ];
    }

    return Promise.all(relations.map(( rel ) =>
      this.app.db.get(relationships[ rel ].type, this[ rel ]))
    )
    .then(( relatives ) => {

      relatives.forEach(( relative, i ) => this[ relations[ i ] ] = relative);
      return this;
    });
  }

  // Prepare a model instance for serialisation to a JSON string. JSON can't
  // represent circular structures so we need to remove the reference to the
  // Kudu app.
  toJSON() {
    delete this.app;
    return this;
  }
}
