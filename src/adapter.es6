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
}
