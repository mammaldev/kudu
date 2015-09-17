// Validate a Kudu model instance against the schema of its constructor. Assume
// that the schema is complete and valid.
//
// Arguments:
//   model    {Object}    A Kudu model instance
//
export default ( model ) => {

  // Get the schema from the constructor of the model instance. The properties
  // key of the whole schema object contains the validation rules we need.
  let schema = model.constructor.schema.properties;

  // Check the validity of every own property of the model instance. If the
  // value of any property is invalid an error will be thrown.
  Object.getOwnPropertyNames(schema).forEach(( prop ) => {

    let value = model[ prop ];
    let rule = schema[ prop ];

    // If the schema specifies that this property is required it must appear on
    // the model instance.
    if ( rule.required === true && value === undefined ) {
      throw new Error(`Property '${ prop }' is required.`);
    }

    // If the property is not required and the value is not present we don't
    // need to try any other validation.
    if ( value === undefined ) {
      return true;
    }

    // If the property is present on the instance its type must match that
    // which is specified in the schema.
    switch ( rule.type ) {

    case String:
      if ( typeof value !== 'string' && !( value instanceof String ) ) {
        throw new Error(`Property '${ prop }' must be of type String.`);
      }
      break;

    case Number:
      if ( typeof value !== 'number' && !( value instanceof Number ) ) {
        throw new Error(`Property '${ prop }'' must be of type Number.`);
      }
      break;

    case Boolean:
      if ( typeof value !== 'boolean' && !( value instanceof Boolean ) ) {
        throw new Error(`Property '${ prop }'' must be of type Boolean.`);
      }
      break;

    case Object:
      if ( typeof value !== 'object' || value === null ) {
        throw new Error(`Property '${ prop }'' must be of type Object.`);
      }
      break;
    }
  });

  // If the model instance conforms to the schema we will reach this point
  // without having thrown an error.
  return true;
};