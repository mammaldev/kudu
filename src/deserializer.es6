// Deserialize a JSON API compliant request object into a Kudu model instance.
//
// Arguments:
//   app          {Kudu}       A Kudu app instance.
//   obj          {Object}     A JSON API compliant request object in the form
//                             of a JSON string or an object.
//   requireId    {Boolean}    Flag to indicate whether or not the "id"
//                             property is required on the deserialized object.
//
export default ( app = null, obj = null, requireId = true ) => {

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
    throw new Error('Expected "id" property to be strings.');
  }

  // Get the model constructor associated with the resource type. If there is
  // no constructor we can't go any further.
  let Model = app.models.get(data.type);

  if ( !Model ) {
    throw new Error(`No model for type "${ data.type }".`);
  }

  return new Model(data.attributes);
};
