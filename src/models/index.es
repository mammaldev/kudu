import { BaseModel } from './base';

export class Model {

  constructor( schema ) {

    if ( typeof schema !== 'object' ) {
      throw new Error('No schema provided.');
    }

    class Constructor extends BaseModel {

      constructor() {

        super();
      }
    }

    Object.setPrototypeOf(Constructor, Model.prototype);

    return Constructor;
  }
}
