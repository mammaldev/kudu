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

        super();
      }
    }

    // Set up inheritance. Returned constructors will be instance of Kudu.Model.
    Object.setPrototypeOf(Constructor, Model.prototype);

    return Constructor;
  }
}
