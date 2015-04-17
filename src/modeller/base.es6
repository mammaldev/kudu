import { validate } from 'jsonschema';
import { createHash } from 'crypto';

export default class BaseModel {

  constructor( data ) {

    // Ensure data has been provided to the constructor. All model instances
    // must be created with initial data matching the schema.
    if ( typeof data !== 'object' ) {
      throw new Error('No instance data provided.');
    }

    // Validate the provided data against the schema.
    let schema = this.constructor.schema;
    let result = validate(data, schema);

    // If there were any errors that we can't continue. We just throw the first
    // one which allows a client to deal with them one at a time.
    if ( result.errors && result.errors.length ) {
      throw new Error(result.errors[ 0 ]);
    }

    // Add any default values to the instance where necessary. It is possible
    // but unlikely for a model schema to have no properties. It would be nice
    // if the JSON-Schema module did this for us but it doesn't so for now we
    // have to do it manually.
    let properties = schema.properties;

    if ( properties ) {
      Object.keys(properties).forEach(( k ) => {
        if ( properties[ k ].default && !result.instance.hasOwnProperty(k) ) {
          result.instance[ k ] = properties[ k ].default;
        }
      });
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

  // Generate a weak entity tag for the instance in its current state. The tags
  // are weak because the order of object properties is not guaranteed which
  // makes a byte-to-byte comparison prone to failure.
  etag() {

    // Serialize the instance. This strips off any private properties which is
    // fine because clients should not be able to modify such properties.
    let serialized = JSON.stringify(this);

    // Return a SHA1 hash of the serialized object. This will be sent to the
    // client in an ETag header and used to compare versions when the client
    // sends an updated version of this resource.
    return `W/"${ createHash('sha1').update(serialized).digest('hex') }"`;
  }
}
