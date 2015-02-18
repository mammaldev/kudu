export default class MockAdapter {

  constructor() {
    this.cache = {};
  }

  create( model ) {
    return new Promise(( resolve, reject ) => {

      if ( model.id === 0 ) {
        return reject();
      }

      this.cache[ model.type ] = this.cache[ model.type ] || [];
      this.cache[ model.type ].push(model);

      return resolve(model);
    });
  }

  get( type, id ) {
    return new Promise(( resolve, reject ) => {

      if ( id === 'throw' ) {
        return reject();
      }

      let instance = this.cache[ type ].filter(( m ) => m.id === +id)[ 0 ];
      return resolve(instance || null);
    });
  }

  getAll( type ) {
    return new Promise(( resolve ) => resolve(this.cache[ type ]));
  }

  update( model ) {
    return new Promise(( resolve, reject) => {

      if ( model.id === 0 ) {
        return reject();
      }

      return resolve(model);
    });
  }

  delete( model ) {
    return new Promise(( resolve, reject ) => {

      if ( model.id === 0 ) {
        return reject();
      }

      return resolve();
    });
  }
}
