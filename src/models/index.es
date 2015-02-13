import { merge } from 'lodash';
import { BaseModel } from './base';

export class Model {

  constructor( ToExtend, schema ) {

    // Ensure a schema is present. We can't create instances without something
    // to validate them against.
    if ( typeof schema === 'undefined' ) {
      schema = ToExtend;
      ToExtend = BaseModel;
    }

    if ( typeof schema !== 'object' ) {
      throw new Error('No schema provided.');
    }

    // Models can inherit from other models. If a parent is specified we merge
    // the parent schema with the one provided here.
    if ( ToExtend !== BaseModel ) {
      schema = merge({}, schema, ToExtend.schema);
    }

    class Constructor extends ToExtend {

      static get schema() {
        return schema;
      }

      constructor( data ) {
        super(data);
      }
    }

    return Constructor;
  }
}
