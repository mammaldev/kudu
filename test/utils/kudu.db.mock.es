export class MockAdapter {

  constructor( kudu ) {
    this.kudu = kudu;
  }

  create( model ) {
    return new Promise(( resolve ) => resolve(model));
  }

  get( id ) {
    return new Promise(function ( resolve ) {

      if ( id === '2' ) {
        return resolve(null);
      }

      return resolve({ id: 1 });
    });
  }

  getAll() {
    return new Promise(( resolve ) => resolve([ { id: 1 } ]));
  }
}
