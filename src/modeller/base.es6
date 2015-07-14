import { validate } from './schema';

export default class BaseModel {

  constructor( data, type ) {

    // Ensure data has been provided to the constructor. All model instances
    // must be created with initial data matching the schema.
    if ( typeof data !== 'object' ) {
      throw new Error('No instance data provided.');
    }

    // If a 'type' is specified on the data object it must match the type we
    // are attempting to instantiate. If it isn't specified we need to add it.
    if ( data.type !== undefined && data.type !== type ) {
      throw new Error('Type mismatch.');
    }

    if ( data.type === undefined ) {
      data.type = type;
    }

    // Validate the provided data against the schema. The result of validation
    // will be a modified data object containing any relevant default values or
    // an error.
    let schema = this.constructor.schema;
    let result = validate(data, schema);

    // If the validation process succeeded we add a property to the instance
    // for each key of the given data.
    Object.keys(result).forEach(( k ) => this[ k ] = result[ k ]);
  }

  toJSON( unsafe = false ) {

    let properties = this.constructor.schema.properties;
    let copy = Object.assign({}, this);

    // Remove non-public properties from a copy of the instance. This is useful
    // for e.g. password hash fields on a user model which should never be sent
    // to the client. Unsafe mode will result in all properties being present
    // in the serialized instance.
    if ( !unsafe ) {
      Object.keys(properties).forEach(( key ) => {
        if ( properties[ key ].public === false ) {
          delete copy[ key ];
        }
      });
    }

    // Return the modified instance. This is what will be serialized.
    return copy;
  }
}
