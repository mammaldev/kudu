import { validate } from 'jsonschema';

export default class BaseModel {

  constructor( data ) {

    // Ensure data has been provided to the constructor. All model instances
    // must be created with initial data matching the schema.
    if ( typeof data !== 'object' ) {
      throw new Error('No instance data provided.');
    }

    // Validate the provided data against the schema.
    let result = validate(data, this.constructor.schema);

    // If there were any errors that we can't continue. We just throw the first
    // one which allows a client to deal with them one at a time.
    if ( result.errors && result.errors.length ) {
      throw new Error(result.errors[ 0 ].stack);
    }

    // Add a property to the instance for each key of the given data
    Object.keys(data).forEach(( k ) => this[ k ] = result.instance[ k ]);
  }

  toJSON() {
    return this;
  }
}
