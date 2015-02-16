export default class MockAdapter {

  constructor( kudu ) {
    this.kudu = kudu;
  }

  create( model ) {
    return new Promise(( resolve, reject ) => {

      if ( model.id === 2 ) {
        return reject();
      }

      return resolve(model);
    });
  }

  get( id ) {
    return new Promise(( resolve, reject ) => {

      if ( id === '2' ) {
        return resolve(null);
      }

      if ( id === '3' ) {
        return reject();
      }

      return resolve({ id: 1 });
    });
  }

  getAll() {
    return new Promise(( resolve ) => resolve([ { id: 1 } ]));
  }

  update( model ) {
    return new Promise(( resolve, reject) => {

      if ( model.id === 3 ) {
        return reject();
      }

      return resolve(model);
    });
  }

  delete( model ) {
    return new Promise(( resolve, reject ) => {

      if ( model.id === 3 ) {
        return reject();
      }

      return resolve();
    });
  }
}
