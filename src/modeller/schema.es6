export default {

  // Validate an object against a schema. Returns the same object after adding
  // any required default property values.
  validate( data, schema ) {

    // If we don't have a schema to validate against, or any data to validate,
    // we can't go any further.
    if ( typeof data !== 'object' || typeof schema !== 'object' ) {
      throw new Error('Missing schema.');
    }

    // A schema must contain a 'properties' object. This object dictates the
    // property names and value types that must be present on instances derived
    // from this schema.
    if ( typeof schema.properties !== 'object' ) {
      throw new Error('A model schema must include a "properties" object.');
    }

    // Enumerate the keys of the 'properties' object. Each value dictates how
    // its key should be validated on the 'data' object.
    let properties = schema.properties;
    Object.keys(properties).forEach(( key ) => {

      let sub = properties[ key ];

      // If a property is 'required' it must be present on the data object. The
      // value of 'required' must be a boolean value.
      if ( sub.required === true && !data.hasOwnProperty(key) ) {
        throw new Error(`Property "${ key }" is required.`);
      }
    });
  },
};
