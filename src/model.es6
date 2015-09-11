export default class BaseModel {

  constructor( data = {} ) {

    // If an initial data object is provided to a model constructor the
    // properties of that object are mapped onto the resulting instance.
    Object.keys(data).forEach(( key ) => this[ key ] = data[ key ]);
  }
}
