export default class MemoryAdapter {

  constructor() {

    // In-memory store for Kudu model instances, keyed by model type. The value
    // of each key will be another map, keyed by unique identifier.
    this.store = new Map();

    // Unique identifiers are based on an incrementing counter.
    this.counter = 0;
  }

  // Persist a Kudu model instance to an in-memory store.
  //
  // Arguments:
  //   instance    {Object}    The model instance to save.
  //
  create( instance ) {

    // If we don't have an instance then there's nothing to persist.
    if ( typeof instance !== 'object' ) {
      return Promise.reject(new Error('Expected a model instance to create.'));
    }

    // If the instance does not have a "type" property we don't know where to
    // persist it.
    if ( instance.type === undefined ) {
      return Promise.reject(new Error('Expected a "type" property.'));
    }

    // Generate a unique identifier for the model instance if it doesn't have
    // one already.
    if ( instance.id === undefined ) {
      instance.id = ++this.counter;
    }

    // Get or create the in-memory store for the given model type.
    let modelStore = this.store.get(instance.type);

    if ( !modelStore ) {
      modelStore = new Map();
      this.store.set(instance.type, modelStore);
    }

    // Save the model instance to the relevant type store and return the
    // updated instance.
    modelStore.set(instance.id, instance);
    return Promise.resolve(instance);
  }

  // Get a specific Kudu model instance by unique identifier, or an array of
  // Kudu model instances by unique identifiers.
  //
  // Arguments:
  //   type    {String}           The type of the model to be retrieved.
  //   id      {Array|String}     The unique identifer of a model instance to
  //                              be retrieved.
  //
  get( type, id ) {

    // If we don't have a type or an identifer we can't find a model instance.
    if ( typeof type !== 'string' || !type ) {
      return Promise.reject(new Error('Expected a model type.'));
    }

    if ( id === undefined ) {
      return Promise.reject(new Error('Expected a model identifier.'));
    }

    // If a store for the requested model type doesn't exist then the specific
    // instance can't exist either so we return nothing.
    const isArray = Array.isArray(id);
    let modelStore = this.store.get(type);

    if ( !(modelStore instanceof Map) ) {
      return Promise.resolve(isArray ? { rows: [] } : undefined);
    }

    // Get the requested instance from the model store. If it exists we return
    // it but if not we just return nothing.
    return Promise.resolve(isArray ?
      { rows: id.map(( id ) => modelStore.get(id)) } :
      modelStore.get(id)
    );
  }

  // Get a list of Kudu model instances by type.
  //
  // Arguments:
  //   type    {String}    The type of the models to be retrieved.
  //
  getAll( type ) {

    // If we don't have a type we can't find any model instances.
    if ( typeof type !== 'string' || !type ) {
      return Promise.reject(new Error('Expected a model type.'));
    }

    // If a store for the requested model type doesn't exist we return an empty
    // array.
    let modelStore = this.store.get(type);

    if ( !(modelStore instanceof Map) ) {
      return Promise.resolve({
        rows: [],
      });
    }

    // Build an array containing all instances of the model. Creating an array
    // from a map results in an array in which each element is another array
    // representing a key-value pair from the map. We only care about the
    // values.
    return Promise.resolve({
      rows: Array.from(modelStore).map(( i ) => i[ 1 ]),
    });
  }

  // Get a list of Kudu model instances by type and relation.
  //
  // Arguments:
  //   ancestorType    {String}    The type of the parent model.
  //   ancestorId      {String}    The unique identifier of a model.
  //   relationship    {Object}    A Kudu relationship object representing the
  //                               relationship between the ancestor model and
  //                               another.
  //
  // The relationship object will have the following properties:
  //   type       {String}     The singular name of a Kudu model.
  //   isArray    {Boolean}    Flag indicating whether the relationship is to-
  //                           many.
  //
  getRelated( ancestorType, ancestorId, relationship ) {

    // All of the arguments are required. If we don't have any of them we can't
    // go any further. An identifier is required because it is not possible to
    // get a generic relation between two types.
    if (
      typeof ancestorType !== 'string' ||
      typeof ancestorId !== 'string' ||
      typeof relationship !== 'object'
    ) {
      let err = new Error('Expected a type, identifier and relationship.');
      return Promise.reject(err);
    }

    // Validate the relationship object. If the "type" property is missing we
    // don't know where to find the related instances and can't continue.
    if ( !relationship.hasOwnProperty('type') ) {
      let err = new Error('Missing "type" property on a relationship object.');
      return Promise.reject(err);
    }

    let relatedType = relationship.type;
    let relatedStore = this.store.get(relatedType);

    // If a store for the requested model type doesn't exist we return an empty
    // array or nothing, depending on whether the relationship was specified as
    // to-many or to-one.
    if ( !( relatedStore instanceof Map ) ) {
      return Promise.resolve(relationship.hasMany ? [] : null);
    }

    // If the relationship is to-many build an array containing all instances
    // of the model that are related to the ancestor instance. For example the
    // following data set would result in an array with one element:
    //
    //   { type: 'ancestor', id: '1' }
    //   { type: 'descendant', id: '2', parent: '1' }
    //
    // If the relationship is to-one we return the first matching instance.
    let all = Array.from(relatedStore).map(( i ) => i[ 1 ]);
    let relations = all.filter(( i ) => {
      return i[ relationship.inverse ] === ancestorId;
    });

    return Promise.resolve(relationship.hasMany ? relations : relations[ 0 ]);
  }

  // Update a Kudu model instance in the in-memory store.
  //
  // Arguments:
  //   instance    {Object}    The model instance to update.
  //
  update( instance ) {

    // If we don't have an instance then there's nothing to persist.
    if ( typeof instance !== 'object' ) {
      return Promise.reject(new Error('Expected a model instance to update.'));
    }

    // If the instance does not have a "type" property we don't know where to
    // persist it.
    if ( instance.type === undefined ) {
      return Promise.reject(new Error('Expected a "type" property.'));
    }

    // If the instance does not have an "id" property we don't know which
    // stored instance to update.
    if ( instance.id === undefined ) {
      return Promise.reject(new Error('Expected an "id" property.'));
    }

    // If a store for the requested model type doesn't exist then the specific
    // instance can't exist either.
    let modelStore = this.store.get(instance.type);

    if ( !(modelStore instanceof Map) ) {
      return Promise.reject(new Error('Missing store.'));
    }

    // If the instance we are trying to update doesn't exist in the store we
    // can't update it.
    if ( !modelStore.get(instance.id) ) {
      return Promise.reject(new Error('Missing instance.'));
    }

    // Save the model instance to the relevant type store and return the
    // updated instance.
    modelStore.set(instance.id, instance);
    return Promise.resolve(instance);
  }

  // Delete a Kudu model instance from the in-memory store.
  //
  // Arguments:
  //   instance    {Object}    The model instance to delete.
  //
  delete( instance ) {

    // If we don't have an instance then there's nothing to delete.
    if ( typeof instance !== 'object' ) {
      return Promise.reject(new Error('Expected a model instance to delete.'));
    }

    // If the instance does not have a "type" property we don't know where to
    // delete it from.
    if ( instance.type === undefined ) {
      return Promise.reject(new Error('Expected a "type" property.'));
    }

    // If the instance does not have an "id" property we don't know which
    // stored instance to delete.
    if ( instance.id === undefined ) {
      return Promise.reject(new Error('Expected an "id" property.'));
    }

    // If a store for the requested model type doesn't exist then the specific
    // instance can't exist either.
    let modelStore = this.store.get(instance.type);

    if ( !(modelStore instanceof Map) ) {
      return Promise.reject(new Error('Missing store.'));
    }

    // Delete the model instance from the relevant type store.
    modelStore.delete(instance.id);
    return Promise.resolve();
  }
}
