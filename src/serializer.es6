export default {

  // Serialize a Kudu model instance to a JSON string compliant with the JSON
  // API specification.
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

      let toSerialize = {
        data: instance.map(( i ) => ({
          attributes: this.toJSON(i, false),
        })),
      };

      return JSON.stringify(toSerialize);
    }

    // Get the schema that applies to this model instance. The schema specifies
    // which properties can and cannot be transmitted to a client.
    let schema = instance.constructor.schema.properties;

    // Build up a new object containing only those properties that can be sent
    // to a client as "attributes".
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

      let toSerialize = {
        data: {
          attributes: result,
        },
      };

      return JSON.stringify(toSerialize);
    }

    return result;
  },

  // Serialize an Error-like object or an array of Error-like objects to a JSON
  // string compliant with the JSON API specification.
  //
  // Arguments:
  //   errors       {Object|Array}    An Error-like object or an array of Error
  //                                  -like objects.
  //   stringify    {Boolean}         If set, return a JSON string. Otherwise,
  //                                  return a serializable subset of the
  //                                  errors as an object.
  //
  // An Error-like object is an instance of the built-in Error constructor or
  // an object that a "message" property.
  errorsToJSON( errors, stringify = true ) {

    // The JSON API specification states that errors must be located in an
    // "errors" property of the top level document. The value of that property
    // must be an array of error objects.
    if ( !Array.isArray(errors) ) {
      errors = [ errors ];
    }

    // Map the array of Error-like objects to error objects that are compliant
    // with the JSON API spec.
    errors = errors.map(( error ) => ({
      detail: error.message,
      status: error.status,
    }));

    // Convert the new array into serialized JSON string.
    return JSON.stringify({
      errors,
    });
  },
};
