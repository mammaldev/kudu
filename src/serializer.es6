export default {

  // Serialize a Kudu model instance to a JSON string.
  //
  // Arguments:
  //   instance     {Object|Array}    A Kudu model instance or an array of
  //                                  model instances.
  //   stringify    {Boolean}         If set, return a JSON string. Otherwise,
  //                                  return a serializable subset of the model
  //                                  instance as an object.
  //
  toJSON( instance, stringify = true ) {

    // If we have an array of model instances we need to serialize each one
    // individually before returning a JSON string of the resulting array.
    if ( Array.isArray(instance) ) {
      return JSON.stringify(instance.map(( i ) => this.toJSON(i, false)));
    }

    // Get the schema that applies to this model instance. The schema specifies
    // which properties can and cannot be transmitted to a client.
    let schema = instance.constructor.schema.properties;

    // Build up a new object containing only those properties that can be sent
    // to a client.
    let result = {};

    Object.keys(instance).forEach(( key ) => {

      let keySchema = schema[ key ];

      // If a property is present in the model schema, and the property is
      // "public" then it will be included in the serialization. All properties
      // are public by default.
      if (
        keySchema &&
        ( keySchema.public === true || keySchema.public === undefined )
      ) {
        result[ key ] = instance[ key ];
      }
    });

    // If the "stringify" flag was set we convert the new object into a
    // serialized JSON string. Otherwise we just return the new object.
    if ( stringify ) {
      return JSON.stringify(result);
    }

    return result;
  },
};
