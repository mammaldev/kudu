import { BaseModel } from './base';

export class Model {

  constructor() {

    class Constructor extends BaseModel {

      constructor() {

        super();
      }
    }

    Object.setPrototypeOf(Constructor, Model.prototype);

    return Constructor;
  }
}
