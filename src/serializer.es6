export default {

  // Serialize a Kudu model instance to a JSON string.
  //
  // Arguments:
  //   instance    {Object}    A Kudu model instance.
  //
  toJSON( instance ) {

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

    // Convert the new object to a serialized JSON string.
    return JSON.stringify(result);
  },
};
