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
  });

  // If the model instance conforms to the schema we will reach this point
  // without having thrown an error.
  return true;
};
