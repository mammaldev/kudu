// Deserialize a JSON API compliant request object into a Kudu model instance.
// If the "type" property of the payload does not correspond with the expected
// Kudu model type an error will be thrown.
//
// Arguments:
//   app          {Kudu}       A Kudu app instance.
//   obj          {Object}     A JSON API compliant request object in the form
//                             of a JSON string or an object.
//   type         {String}     The Kudu model "type" of which "obj" represents
//                             an instance.
//   requireId    {Boolean}    Flag to indicate whether or not the "id"
//                             property is required on the deserialized object.
//
export default ( app = null, obj = null, type = null, requireId = true ) => {

  if ( typeof obj === 'string' ) {
    obj = JSON.parse(obj);
  }

  if ( typeof obj !== 'object' || !obj ) {
    throw new Error('Expected an object.');
  }

  // JSON API specifies that a request must have a "data" member at the top
  // level. See http://jsonapi.org/format/#document-structure for details.
  if ( !obj.hasOwnProperty('data') ) {
    throw new Error('Expected "data" property.');
  }

  // The "data" property must either be a resource object, resource identifier
  // object or null. It should never be null in this situation. A resource
  // identifier object must have "type" and "id" properties, unless the
  // represented resource has been created on the client and is awaiting a
  // unique identifier assigned by the server, in which case the "id" property
  // is optional.
  let data = obj.data;

  if ( typeof data.type !== 'string' ) {
    throw new Error('Expected "type" property to be a string.');
  }

  if ( requireId && typeof data.id !== 'string' ) {
    throw new Error('Expected "id" property to be a string.');
  }

  // Get the model constructor associated with the resource type. If there is
  // no constructor we can't go any further.
  let Model = app.models.get(data.type);

  if ( !Model ) {
    let err = new Error(`No model for type "${ data.type }".`);
    err.status = 409;
    throw err;
  }

  // If the model constructor is not for the expected type we have a conflict.
  if ( type !== Model.plural && type !== Model.singular ) {
    let err = new Error(`Expected ${ type } model but got ${ Model.singular }.`);
    err.status = 409;
    throw err;
  }

  let instance = new Model(data.attributes);

  // Add the type andi dentifier to the instance. The JSON API specification
  // prohibits the use of "id" or "type" in attribute objects so this shouldn't
  // cause any conflicts.
  instance.type = data.type;
  instance.id = data.id;

  return instance;
};
