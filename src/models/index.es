import { validate } from 'jsonschema';
import { BaseModel } from './base';

export class Model {

  constructor( schema ) {

    // Ensure a schema is present. We can't create instances without something
    // to validate them against.
    if ( typeof schema !== 'object' ) {
      throw new Error('No schema provided.');
    }

    class Constructor extends BaseModel {

      constructor( data ) {

        // Ensure data has been provided to the constructor. All model instances
        // must be created with initial data matching the schema.
        if ( typeof data !== 'object' ) {
          throw new Error('No instance data provided.');
        }

        // Validate the provided data against the schema.
        let result = validate(data, schema);

        // If there were any errors that we can't continue. We just throw the
        // first one which allows a client to deal with them one at a time.
        if ( result.errors && result.errors.length ) {
          throw new Error(result.errors[ 0 ].stack);
        }

        // Add a property to the instance for each key of the given data
        Object.keys(data).forEach(( k ) => this[ k ] = result.instance[ k ]);

        super();
      }
    }

    // Set up inheritance. Returned constructors will be instance of Kudu.Model.
    Object.setPrototypeOf(Constructor, Model.prototype);

    return Constructor;
  }
}
