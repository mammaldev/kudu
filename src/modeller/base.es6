import { validate } from 'jsonschema';

export default class BaseModel {

  constructor( data ) {

    // Ensure data has been provided to the constructor. All model instances
    // must be created with initial data matching the schema.
    if ( typeof data !== 'object' ) {
      throw new Error('No instance data provided.');
    }

    // Add any default values to the instance where necessary. It is possible
    // but unlikely for a model schema to have no properties. It would be nice
    // if the JSON-Schema module did this for us but it doesn't so for now we
    // have to do it manually.
    if ( data ) {
      Object.keys(data).forEach(( k ) => {
        let defaultVal;
        try {
          defaultVal = schema.properties[ k ].default;
        } catch ( err ) {
          throw new Error(`No property for "${ k }" found on schema definition`);
        }
        if ( defaultVal && !data.hasOwnProperty(k) ) {
          data[ k ] = defaultVal;
        }
      });
    }

    // Validate the provided data against the schema.
    let schema = this.constructor.schema;
    let result = validate(data, schema);

    // If there were any errors that we can't continue. We just throw the first
    // one which allows a client to deal with them one at a time.
    if ( result.errors && result.errors.length ) {
      throw new Error(result.errors[ 0 ]);
    }

    // Add a property to the instance for each key of the given data
    Object.keys(data).forEach(( k ) => this[ k ] = result.instance[ k ]);
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
