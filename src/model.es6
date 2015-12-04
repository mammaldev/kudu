import BaseModel from 'kudu-model';

export default class KuduBaseModel extends BaseModel {

  constructor( app, data ) {
    super(app, data);
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

    const promises = relations.map(( relation ) => {

      // A dot in the relation indicates that the client wants to retrieve
      // deeply nested resources. We need to link the parts of the relation path
      // in order so that the relevant object is in place when a deeply nested
      // resource is linked.
      const parts = relation.split('.');
      let promise = Promise.resolve();

      parts.forEach(( part, i ) => {

        promise = promise.then(( data ) => {

          let obj = this;

          // If the previous promise resolved with data we have a resource that
          // needs to be linked. We determine the target object based on the
          // current position of a pointer aiming at an index of the relation
          // path parts array.
          if ( data ) {

            for ( let j = 1; j < parts.length; j++ ) {

              if ( j >= i ) {
                break;
              }

              // Update the target object by following the next part of the
              // relation path. When the path part index pointer reaches the
              // current part of the path the target object will not be updated
              // as the previous break will execute.
              obj = obj[ parts[ j ] ];
            }

            // Link the resource into the target object.
            // TODO: Handle the case where the target object is an array.
            const key = parts[ i - 1 ];

            if ( data.rows && data.rows.length ) {

              const Model = this.app.getModel(data.rows[ 0 ].type);
              obj[ key ] = data.rows.map(( item ) => new Model(item));
            } else if ( !data.rows ) {

              const Model = this.app.getModel(data.type);
              obj[ key ] = new Model(data);
            } else {

              return Promise.resolve();
            }

            obj = obj[ key ];
          }

          // Get the value of the target property. If there is more than one
          // part to the relation path the target property can be on "this"
          // instance of one of the already-linked relatives.
          const key = parts[ i ];
          let value = Array.isArray(obj) ? obj : obj[ key ];

          if ( i && Array.isArray(value) ) {
            value = value.map(( item ) => item[ part ]);
          }

          // If the value of the target property is already a model instance it
          // does not need to be linked.
          if ( value instanceof BaseModel ) {
            return Promise.resolve(value);
          }

          // If linkage is necessary we need to get the relevant relationship
          // object which tells us which type we need to find instances of.
          const relationship = Array.isArray(obj) ?
            obj[ 0 ].constructor.schema.relationships[ key ] :
            obj.constructor.schema.relationships[ key ];

          // An "inverse" relationship means the related instance stores the
          // link. For example an "article" model may have a one-to-many
          // relationship with a "comment" model. If the "comment" model stores
          // the link in a "post" property and the "post" model does not
          // maintain a list of "comments" the "post" model should define an
          // inverse relationship to "comment" and the "comment" model should
          // define a normal (non-inverse) relationship to "post".
          if ( relationship.inverse ) {
            return this.app.db.getRelated(
              this.constructor.singular, this.id, relationship
            );
          }

          // Handle relationships of the form "parent --(many)--> child
          // --(many)--> grandchild". In this situation we should have an array
          // (representing children) of arrays (representing grandchildren) of
          // identifiers to fetch. We can't flatten the arrays (which could
          // result in fewer calls to the adapter) because we need to match the
          // results (arrays of grandchildren) to each child.
          if ( Array.isArray(value) && Array.isArray(value[ 0 ]) ) {

            return Promise.all(value.map(( value ) =>
              this.app.db.get(relationship.type, value)
            ));
          }

          // Handle relationships of the form "parent --(one)--> child".
          return this.app.db.get(relationship.type, value);
        });
      });

      return promise;
    });

    return Promise.all(promises)
    .then(( relatives ) => {

      // Relatives should be an array of related instances with one element for
      // each relation path passed to the method. Each element can either be a
      // single related instance of an array.
      relatives.forEach(( relative, i ) => {

        if ( !relative ) {
          return;
        }

        const parts = relations[ i ].split('.');
        const key = parts[ parts.length - 1 ];
        let obj = this;

        // Find the target object. This is the object into which the current
        // relative will be linked. Most commonly this will be this instance (
        // when the relation path does not specify any nested relationships).
        for ( let j = 0; j < parts.length - 1; j++ ) {
          obj = obj[ parts[ j ] ];
        }

        // Get the relationship definition from the target object constructor
        // and then get the constructor of the related type from the Kudu app.
        const relationship = Array.isArray(obj) ?
          obj[ 0 ].constructor.schema.relationships[ key ] :
          obj.constructor.schema.relationships[ key ];

        const Model = this.app.getModel(relationship.type);

        // If the target is an array we need to link the related resource into
        // each element of it.
        if ( Array.isArray(obj) ) {

          // If the related resource is also an array we need to match each
          // element to the corresponding target object.
          if ( Array.isArray(relative) ) {

            obj.forEach(( item, i ) => {

              const matchingRelative = relative[ i ];

              item[ key ] = matchingRelative.rows ?
                matchingRelative.rows.map(( item ) => new Model(item)) :
                new Model(matchingRelative);
            });
          } else {

            obj.forEach(( item, i ) => {
              item[ key ] = new Model(relative.rows[ i ]);
            });
          }
        } else {

          // If the target is an object we need to link the related resource
          // into it.
          obj[ key ] = relative.rows ?
            relative.rows.map(( item ) => new Model(item)) :
            new Model(relative);
        }
      });

      return this;
    });
  }
}
