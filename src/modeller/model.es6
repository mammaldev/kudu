import { merge } from 'lodash';
import BaseModel from './base';

export default class Model {

  constructor( type, ToExtend, schema ) {

    // Ensure a schema is present. We can't create instances without something
    // to validate them against.
    if ( typeof schema === 'undefined' ) {
      schema = ToExtend;
      ToExtend = BaseModel;
    }

    if ( typeof schema !== 'object' ) {
      throw new Error('No schema provided.');
    }

    let finalSchema = schema;

    // Models can inherit from other models. If a parent is specified we merge
    // the parent schema with the one provided here. If a parent is not
    // requestable the child will be, unless the requestable property is
    // explictly set to false in the child schema.
    if ( ToExtend !== BaseModel ) {
      finalSchema = merge({}, schema, ToExtend.schema);

      if (
        finalSchema.requestable === false &&
        !schema.hasOwnProperty('requestable')
      ) {
        delete finalSchema.requestable;
      }
    }

    class Constructor extends ToExtend {

      static get schema() {
        return finalSchema;
      }

      constructor( data ) {
        super(data, type);
      }
    }

    return Constructor;
  }
}
