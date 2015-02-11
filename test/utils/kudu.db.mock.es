export class MockAdapter {

  constructor( kudu ) {
    this.kudu = kudu;
  }

  create( model ) {
    return new Promise(( resolve ) => resolve(model));
  }
}
