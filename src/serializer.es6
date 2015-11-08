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
  //   wrap         {Boolean}         If set, return a JSON API compliant
  //                                  primary data object.
  //
  toJSON( instance = null, stringify = true, wrap = true ) {

    // If we don't have an instance to serialize we just return null.
    if ( !instance ) {
      return JSON.stringify(null);
    }

    // If we have an array of model instances we need to serialize each one
    // individually before returning a JSON string of the resulting array.
    if ( Array.isArray(instance) ) {

      let toSerialize = {
        data: instance.map(( instance ) =>
          this.toJSON(instance, false, false)
        ),
      };

      return JSON.stringify(toSerialize);
    }

    // If we have a single instance we need to serialize it to a JSON API
    // resource object.
    let resource = buildResource(instance);

    // If the "wrap" flag was set we need to wrap the resource in a JSON API
    // primary data object.
    if ( wrap ) {
      resource = {
        data: resource,
      };
    }

    // If the "stringify" flag was set we convert the new object into a
    // serialized JSON string. Otherwise we just return the new object.
    if ( stringify ) {
      return JSON.stringify(resource);
    }

    return resource;
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

    // If the "stringify" flag was set we convert the new object into a
    // serialized JSON string. Otherwise we just return the new object.
    const response = {
      errors,
    };

    if ( stringify ) {
      return JSON.stringify(response);
    }

    return response;
  },
};

//
// Utility functions
//

// Build a JSON API resource object for a Kudu model instance as per
// http://jsonapi.org/format/#document-resource-objects
function buildResource( instance ) {

  // A JSON API resource object must contain top-level "id" and "type"
  // properties. We can infer the type from the name registered when the model
  // constructor was created but "id" must be present on the instance itself.
  if ( !instance.hasOwnProperty('id') ) {
    throw new Error('Expected an "id" property.');
  }

  return {
    id: instance.id,
    type: instance.constructor.singular,
    attributes: buildAttributes(instance),
    relationships: buildRelationships(instance),
  };
}

// Build a JSON API attributes object for a Kudu model instance as per
// http://jsonapi.org/format/#document-resource-object-attributes
function buildAttributes( instance ) {

  // Get the schema that applies to this model instance. The schema specifies
  // which properties can and cannot be transmitted to a client.
  let schema = instance.constructor.schema.properties;

  // Build up a new object containing only those properties that can be sent to
  // a client as "attributes".
  let attributes = {};

  Object.keys(instance).forEach(( key ) => {

    let keySchema = schema[ key ];

    // If a property is present in the model schema, and the property is
    // "public" then it will be included in the serialization. All properties
    // are public by default.
    if (
      keySchema &&
      ( keySchema.public === true || keySchema.public === undefined )
    ) {
      attributes[ key ] = instance[ key ];
    }
  });

  return attributes;
}

// Build a JSON API relationship object for a Kudu model instance as per
// http://jsonapi.org/format/#document-resource-object-relationships
function buildRelationships( instance ) {

  // Get any relationships that apply to this model instance.
  let relationshipSchema = instance.constructor.schema.relationships || {};
  let plural = instance.constructor.plural;

  // Build up an object representing the relationships between this instance
  // and others.
  let relationships = {};

  Object.keys(relationshipSchema).forEach(( key ) => {
    relationships[ key ] = {
      links: {
        self: `/${ plural }/${ instance.id }/relationships/${ key }`,
        related: `/${ plural }/${ instance.id }/${ key }`,
      },
    };
  });

  return relationships;
}
