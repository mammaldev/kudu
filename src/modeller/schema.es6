import _ from 'lodash';

let Schema = {

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

    validateObject(data, schema.properties);
    return data;
  },

  validateString( value ) {
    return this.validateType(value, 'string');
  },

  validateNumber( value ) {
    return this.validateType(value, 'number');
  },

  validateBoolean( value ) {
    return this.validateType(value, 'boolean');
  },

  validateDate( value ) {

    let type = Object.prototype.toString.call(value);
    let date = type === '[object Date]' ? value : new Date(value);

    if ( isNaN(date.valueOf()) ) {
      throw new Error('Value is not of type date.');
    }

    return true;
  },

  validateArray( value, schema ) {

    // If the value is not an array we can fail straight away.
    if ( !Array.isArray(value) ) {
      throw new Error('Value is not of type array.');
    }

    // If the schema has an element at index 0 we treat that as a type and need
    // to ensure that every element of the data array matches.
    let arrayOf = schema.type[ 0 ];
    let type = arrayOf.type.name || arrayOf.type.constructor.name;
    let validator = this[ `validate${ type }`].bind(this);

    value.forEach(( item, i ) => {
      try {
        validator(item);
      } catch ( err ) {
        throw new Error(`Element at index ${ i }: ${ err.message }`);
      }
    });

    return true;
  },

  validateObject( value, schema ) {

    // If the value is not an object we can fail straight away.
    if ( typeof value !== 'object' || !value ) {
      throw new Error('Value is not of type object.');
    }

    return validateObject(value, schema);
  },

  validateType( value, type ) {

    // Get the native type constructor. If we can't find one then assume we are
    // attempting to validate an unknown type.
    let Type = global[ _.capitalize(type) ];

    if ( typeof Type !== 'function' ) {
      throw new Error('Unknown type.');
    }

    // Validate type. Accepts literal values and boxed instances.
    if ( typeof value !== type && !(value instanceof Type) ) {
      throw new Error(`Value is not of type ${ type }.`);
    }

    return true;
  },
};

function validateObject( obj, schema ) {

  // Enumerate the keys of the 'properties' object. Each value dictates how its
  // key should be validated on the 'data' object.
  Object.keys(schema).forEach(( key ) => {

    let sub = schema[ key ];

    // If a property is 'required' it must be present on the data object. The
    // value of 'required' must be a boolean value.
    if ( sub.required === true && !obj.hasOwnProperty(key) ) {
      throw new Error(`Property "${ key }" is required.`);
    }

    let val = obj[ key ];

    // If a property has a 'default' and the data object does not include that
    // property (or includes it with the value of null or undefined) we add it
    // with the default value.
    if ( sub.hasOwnProperty('default') && val == null ) {
      val = obj[ key ] = sub.default;
    }

    // If a property has a 'type' and the data object includes that property,
    // the value must be of the correct type. The 'type' property in the schema
    // should be a native constructor.
    if ( sub.hasOwnProperty('type') && val != null ) {

      let type = sub.type.name || sub.type.constructor.name;

      // If the 'type' is an object literal we treat it like a nested schema.
      if ( type === 'Object' ) {
        sub = sub.type;
      }

      try {
        Schema[ `validate${ type }`](val, sub);
      } catch ( err ) {
        throw new Error(`Property "${ key }": ${ err.message }`);
      }
    }
  });

  return true;
}

export default Schema;
