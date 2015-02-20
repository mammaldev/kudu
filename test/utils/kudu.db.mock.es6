export default class MockAdapter {

  constructor() {
    this.cache = {};
  }

  configureRelationships( data ) {
    this.relationships = data;
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

  getDescendants( ancestorType, ancestorId, descendantType ) {
    return new Promise(( resolve, reject ) => {

      if ( ancestorId === 'throw' ) {
        return reject();
      }

      let relation = this.relationships[ ancestorType ][ descendantType ];
      let instances = this.cache[ descendantType ].filter(( m ) => {
        return m[ relation ] === +ancestorId;
      });

      return resolve(instances);
    });
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
