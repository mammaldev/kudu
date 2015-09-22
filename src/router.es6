import validate from './validate';

export default class Router {

  constructor( kudu, config = {} ) {
    this.kudu = kudu;
    this.config = config;
  }

  // Create route handlers on the Express app for generic API requests. URLs
  // are based on the plural names of models registered with the Kudu instance.
  // An application with the a "User" model will respond on the following
  // routes by default:
  //
  //   POST /users
  //   GET /users
  //   GET /users/:userId
  //   PATCH /users/:userId
  //
  // This method should be called after any custom route handlers have been set
  // up because the URLs used for matching are highly generic and therefore
  // likely to conflict with other, more specific routes.
  //
  createGenericRoutes() {

    const base = this.config.baseURL || '';
    let genericURL = `${ base }/:type`;
    let specificURL = `${ base }/:type/:id`;
    let kudu = this.kudu;

    // Register the route handlers with the Express app.
    kudu.app.post(genericURL, handlePost);
    kudu.app.get(genericURL, handleGet);
    kudu.app.get(specificURL, handleGet);
    kudu.app.patch(specificURL, handlePatch);

    //
    // Utility functions
    //

    function handlePost( req, res ) {

      const type = req.params.type;
      const Model = kudu.modelsByPluralName.get(type);

      // If the resource type is unknown we cannot go any further.
      if ( Model === undefined ) {
        return res.status(404).end();
      }

      // Attempt to deserialize the request body into a Kudu model instance.
      // Because the resource has been created on the client it is not required
      // to have an "id" property hence the flag as the final argument.
      let instance;

      try {
        instance = kudu.deserialize(req.body, type, false);
      } catch ( err ) {

        // The deserializer can throw errors with a suggested HTTP response
        // status. If this error has one we send it to the client.
        if ( typeof err.status === 'number' ) {
          return res.status(err.status).send({
            errors: [ err.message ],
          });
        }

        // If the error thrown by the deserializer doesn't have a recommended
        // status code attached to it we just use the generic 400 "Bad request"
        // status.
        return res.status(400).send({
          errors: [ err.message ],
        });
      }

      // Validate the model instance. If it doesn't conform to the schema an
      // error will be thrown.
      try {
        validate(instance);
      } catch ( err ) {
        return res.status(400).send({
          errors: [ err.message ],
        });
      }

      // Attempt to persist the newly created instance. By this point we can be
      // confident that the instance is valid so any errors are likely to be
      // caused by an adapter failure, meaning 500 "Internal server error" is
      // likely the most appropriate response.
      return instance.save()
      .then(( instance ) => res.status(201).json(kudu.serialize.toJSON(instance)))
      .catch(( err ) => res.status(500).send({
        errors: [ err.message ],
      }));
    }

    function handleGet( req, res ) {

      const type = req.params.type;
      const Model = kudu.modelsByPluralName.get(type);

      // If the resource type is unknown we cannot go any further.
      if ( Model === undefined ) {
        return res.status(404).end();
      }

      // If an identifier is present in the URL we need to retrieve a single
      // model instance.
      const id = req.params.id;

      if ( id ) {
        return kudu.db.get(Model.singular, id)
        .then(( instance ) => {

          if ( !instance ) {
            return res.status(404).end();
          }

          res.status(200).json(kudu.serialize.toJSON(instance));
        });
      }

      // If no identifier was present we need to retrieve an array of all
      // instances. If there are no instances for the given type an empty array
      // will be sent to the client.
      return kudu.db.getAll(Model.singular)
      .then(( arr ) => res.status(200).json(kudu.serialize.toJSON(arr)));
    }

    function handlePatch( req, res ) {

      const type = req.params.type;
      const Model = kudu.modelsByPluralName.get(type);

      // If the resource type is unknown we cannot go any further.
      if ( Model === undefined ) {
        return res.status(404).end();
      }

      // Attempt to deserialize the request body into a Kudu model instance.
      let newInstance;

      try {
        newInstance = kudu.deserialize(req.body, type);
      } catch ( err ) {

        return res.status(400).send({
          errors: [ err.message ],
        });
      }

      // Attempt to retrieve the stored data corresponding to the model.
      return kudu.db.get(Model.singular, req.params.id)
      .then(( instance ) => {

        // If the instance we are attempting to update doesn't exist we can't
        // go any further.
        if ( !instance ) {
          return res.status(404).end();
        }

        // Merge the stored instance with the new instance. The JSON API spec
        // states that properties sent with a PATCH request should be used to
        // update the corresponding stored property and stored properties that
        // are not present in the request should retain the current values.
        Object.keys(newInstance).forEach(( key ) => {
          instance[ key ] = newInstance[ key ];
        });

        return instance.save();
      })
      .then(( updated ) => res.status(200).json(kudu.serialize.toJSON(updated)))
      .catch(( err ) => res.status(500).send({
        errors: [ err.message ],
      }));
    }
  }
}
