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
  //   DELETE /users/:userId
  //
  // If the same application also had a "List" model which has, for example, a
  // many-to-many relationship to the "User" model the following routes will
  // also be available:
  //
  //   GET /users/:userId/lists
  //
  // This method should be called after any custom route handlers have been set
  // up because the URLs used for matching are highly generic and therefore
  // likely to conflict with other, more specific routes.
  //
  createGenericRoutes() {

    const base = this.config.baseURL || '';
    let genericURL = `${ base }/:type`;
    let specificURL = `${ base }/:type/:id`;
    let descendantURL = `${ specificURL }/:descendantType`;
    let kudu = this.kudu;

    // Register the route handlers with the Express app.
    kudu.app.post(genericURL, handlePost);
    kudu.app.get(genericURL, handleGet);
    kudu.app.get(specificURL, handleGet);
    kudu.app.put(specificURL, handlePatch);
    kudu.app.patch(specificURL, handlePatch);
    kudu.app.delete(specificURL, handleDelete);
    kudu.app.get(descendantURL, handleDescendantGet);

    //
    // Utility functions
    //

    function handlePost( req, res ) {

      const type = req.params.type;
      const Model = getModel(type);

      // If the resource type is unknown we cannot go any further.
      if ( !Model ) {
        return res.status(404).end();
      }

      let instance;

      // Custom route handlers that run before this generic handler are able to
      // deserialize and manipulate the model instance. If they do so they
      // should attach the resulting instance to the request object. If an
      // instance is already available here we don't need to deserialize it.
      if ( req.instance ) {
        instance = req.instance;
      } else {

        // If an instance was not already available on the request object we
        // attempt to deserialize and instantiate the request body now. Because
        // the resource has been created on the client it is not required to
        // have an "id" property hence the flag as the final argument.
        try {
          instance = kudu.deserialize(req.body, type, false);
        } catch ( err ) {

          let errors = kudu.serialize.errorsToJSON(err, false);

          // The deserializer can throw errors with a suggested HTTP response
          // status. If this error has one we send it to the client.
          if ( typeof err.status === 'number' ) {
            return res.status(err.status).json(errors);
          }

          // If the error thrown by the deserializer doesn't have a recommended
          // status code attached to it we just use the generic 400 "Bad
          // request" status.
          return res.status(400).json(errors);
        }
      }

      // Attempt to persist the newly created instance. By this point we can be
      // confident that the instance is valid so any errors are likely to be
      // caused by an adapter failure, meaning 500 "Internal server error" is
      // likely the most appropriate response.
      return instance.save()
      .then(( instance ) => link(instance, req.query))
      .then(( instance ) =>
        res.status(201).json(kudu.serialize.toJSON(instance, {
          stringify: false,
        }))
      )
      .catch(( err ) => {

        // If the error came from the model instance validator we can tell the
        // client that something was wrong with the data it sent.
        const response = kudu.serialize.errorsToJSON(err, false);

        if ( err instanceof kudu.validateInstance.Error ) {
          return res.status(400).json(response);
        }

        // If ther error didn't come from the validator we respond with a
        // generic 500 status.
        res.status(500).json(response);
      });
    }

    function handleGet( req, res ) {

      const type = req.params.type;
      const Model = getModel(type);

      // If the resource type is unknown we cannot go any further.
      if ( !Model ) {
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

          return link(new Model(instance), req.query);
        })
        .then(( instance ) =>
          res.status(200).json(kudu.serialize.toJSON(instance, {
            stringify: false,
          }))
        )
        .catch(( err ) =>
          res.status(500).json(kudu.serialize.errorsToJSON(err, false))
        );
      }

      // If no identifier was present we need to retrieve an array of all
      // instances. If there are no instances for the given type an empty array
      // will be sent to the client.
      return kudu.db.getAll(Model.singular)
      .then(( result ) => result.rows.map(( row ) => new Model(row)))
      .then(( instances ) => Promise.all(
        instances.map(( instance ) => link(instance, req.query))
      ))
      .then(( instances ) => {

        res.status(200).json(kudu.serialize.toJSON(instances, {
          stringify: false,
        }));
      })
      .catch(( err ) =>
        res.status(500).json(kudu.serialize.errorsToJSON(err, false))
      );
    }

    function handlePatch( req, res ) {

      const type = req.params.type;
      const Model = getModel(type);

      // If the resource type is unknown we cannot go any further.
      if ( !Model ) {
        return res.status(404).end();
      }

      // Attempt to deserialize the request body into a Kudu model instance.
      let newInstance;

      try {
        newInstance = kudu.deserialize(req.body, type);
      } catch ( err ) {

        let errors = kudu.serialize.errorsToJSON(err);

        // The deserializer can throw errors with a suggested HTTP response
        // status. If this error has one we send it to the client.
        if ( typeof err.status === 'number' ) {
          return res.status(err.status).json(errors);
        }

        // If the error thrown by the deserializer doesn't have a recommended
        // status code attached to it we just use the generic 400 "Bad request"
        // status.
        return res.status(400).json(errors);
      }

      // Attempt to retrieve the stored data corresponding to the model.
      return kudu.db.get(Model.singular, req.params.id)
      .then(( instance ) => {

        // If the instance we are attempting to update doesn't exist we can't
        // go any further.
        if ( !instance ) {
          return res.status(404).end();
        }

        instance = new Model(instance);

        // Merge the stored instance with the new instance. The JSON API spec
        // states that properties sent with a PATCH request should be used to
        // update the corresponding stored property and stored properties that
        // are not present in the request should retain the current values.
        Object.keys(newInstance).forEach(( key ) => {
          instance[ key ] = newInstance[ key ];
        });

        return instance.update();
      })
      .then(( updated ) => res.status(200).json(kudu.serialize.toJSON(updated, {
        stringify: false,
      })))
      .catch(( err ) => res.status(500).json(kudu.serialize.errorsToJSON(err)));
    }

    function handleDelete( req, res ) {

      const type = req.params.type;
      const Model = getModel(type);

      // If the resource type is unknown we cannot go any further.
      if ( !Model ) {
        return res.status(404).end();
      }

      // Attempt to retrieve the stored data corresponding to the model.
      return kudu.db.get(Model.singular, req.params.id)
      .then(( instance ) => {

        // If the instance we are attempting to delete doesn't exist we can't
        // go any further.
        if ( !instance ) {
          return res.status(404).end();
        }

        // Delete the instance.
        return instance.delete();
      })
      .then(() => res.status(204).end())
      .catch(( err ) => res.status(500).json(kudu.serialize.errorsToJSON(err)));
    }

    function handleDescendantGet( req, res ) {

      const descendantType = req.params.descendantType;
      const ancestorType = req.params.type;
      const ancestorId = req.params.id;

      // If the ancestor resource type is unknown we cannot go any further.
      const Ancestor = getModel(ancestorType);

      if ( !Ancestor ) {
        return res.status(404).end();
      }

      // If the ancestor model schema does not specify a relationship to the
      // descendant we cannot go any further.
      const relationship = Ancestor.schema.relationships[ descendantType ];

      if ( typeof relationship !== 'object' ) {
        return res.status(404).end();
      }

      // If the descendant resource type is unknown we cannot go any further.
      const Descendant = getModel(relationship.type, false);

      if ( !Descendant ) {
        return res.status(404).end();
      }

      // Attempt to retrieve the stored data.
      relationship.key = relationship.key || descendantType;

      return kudu.db.getRelated(ancestorType, ancestorId, relationship)
      .then(( arr ) => res.status(200).json(kudu.serialize.toJSON(arr, {
        stringify: false,
      })))
      .catch(( err ) => res.status(500).json(kudu.serialize.errorsToJSON(err)));
    }

    // Get a Kudu model constructor. If the model is not "requestable" it is
    // not visible to the generic route handlers and attempts to access routes
    // related to such a model should result in a 404.
    function getModel( type, plural = true ) {

      const Model = kudu[ plural ? 'modelsByPluralName' : 'models' ].get(type);

      if ( !Model || !Model.schema || Model.schema.requestable === false ) {
        return null;
      }

      return Model;
    }

    // Link any requested "includes" into a model instance.
    function link( instance, qs = {} ) {

      // If no instance is provided we just resolve with nothing.
      if ( !instance ) {
        return Promise.resolve(instance);
      }

      // Get the relationships the client has asked to be included.
      let requestedIncludes = [];
      if ( qs.include ) {
        requestedIncludes = qs.include.split(',');
      }

      return instance.link(requestedIncludes);
    }
  }

  // Register a route handler with Express.
  //
  // Arguments:
  //   verb        {String}    The HTTP verb to which the route will respond.
  //   path        {String}    The URL at which the route will be mounted.
  //   [config]    {Object}    Optional options.
  //
  // Options:
  //   prependBaseURL    {Boolean}    If false, don't prepend the configured
  //                                  base URL path to the given path.
  handle( verb, path, config, ...handlers ) {

    let expressArgs;

    // The config object is optional. If that parameter is a function then no
    // config has been provided. Express exposes methods corresponding to HTTP
    // verbs. The router exposes a single method and expects the verb as an
    // argument. We slice off the verb, path and options, if present, and pass
    // the rest of the arguments through.
    if ( typeof config === 'function' ) {
      expressArgs = [].slice.call(arguments, 2);
      config = {};
    } else {
      expressArgs = [].slice.call(arguments, 3);
    }

    // If the router has been configured with a base URL we prepend it to the
    // path, except in the case when the config for this route explictly says
    // not to.
    if ( config.prependBaseURL !== false ) {
      path = this.config.baseURL + path;
    }

    expressArgs.unshift(path);
    this.kudu.app[ verb.toLowerCase() ].apply(this.kudu.app, expressArgs);
  }
}
