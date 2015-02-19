export default ( app ) => {

  // The example app uses the CouchDB database adapter. CouchDB documents all
  // have a _id field containing a unique identifier. We are using that here,
  // hence the underscore.
  app.createModel('base', {
    properties: {
      _id: {
        type: 'string'
      },
      type: {
        type: 'string',
        required: true
      }
    }
  })
};
