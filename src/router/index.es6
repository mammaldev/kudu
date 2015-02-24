let defaults = Symbol();

export default class Router {

  get [ defaults ]() {
    return {
      baseURL: ''
    };
  }

  constructor( kudu, config = {} ) {

    this.kudu = kudu;
    this.config = Object.assign({}, this[ defaults ], config);
  }

  // Register a route handler with Express. Takes an HTTP verb and a URL path.
  handle( verb, path ) {

    // If the router has been configured with a base URL we prepend it to the
    // path.
    path = this.config.baseURL + path;

    // Express exposes methods corresponding to HTTP verbs. The router exposes
    // a single method and expects the verb as an argument. We slice off the
    // verb and path pass the rest of the arguments through.
    let expressArgs = [].slice.call(arguments, 2);
    expressArgs.unshift(path);

    this.kudu.app[ verb.toLowerCase() ].apply(this.kudu.app, expressArgs);
  }

  // Configure generic API routes. URLs are based on pluralised model names.
  // For example an application with a 'User' model will currently accept the
  // following requests by default:
  //
  //   POST /users
  //   GET /users
  //   GET /users/:userId
  //   PUT /users/:userId
  //   DELETE /users/:userId
  //
  // There are also generic route handlers that allow you to take advantage
  // of the relationships between models. If you have a List model and each
  // list refers to a User model the following routes will be available:
  //
  //   GET /users/:userId/lists
  //
  // This method should be called after any custom route handlers have been
  // configured because the URLs its uses are highly generic and would be
  // likely to match many more requests than intended.
  enableGenericRouteHandlers() {

    let self = this;
    let kudu = this.kudu;

    if ( !kudu.hasOwnProperty('db') ) {
      throw new Error('Generic route handlers cannot be enabled for an ' +
       'application that does not have a database adapter configured.');
    }

    let base = this.config.baseURL || '';
    let specificURL = base + '/:type/:id';
    let genericURL = base + '/:type';
    let descendantURL = base + '/:ancestorType/:ancestorId/:descendantType';
    let express = this.kudu.app;

    express.post(genericURL, handlePost); // Create
    express.get(specificURL, handleGet); // Get one
    express.get(genericURL, handleGet); // Get all
    express.put(specificURL, handlePut); // Update one
    express.delete(specificURL, handleDelete); // Delete one

    express.get(descendantURL, handleDescendantGet);

    //
    // Utility functions
    //

    function handlePost( req, res ) {

      let type = req.params.type;
      let [ Model ] = getModels(type);

      // If there isn't an associated model we can't go any further.
      if ( !Model ) {
        return res.status(404).end();
      }

      // If there is a model we can attempt to instantiate it with the data
      // provided with the request. If the data is invalid we send back an
      // error.
      let instance;

      try {
        instance = new Model(req.body);
      } catch ( e ) {
        return res.status(400).send(e.toString());
      }

      // Save the instance in the database and send it back to the client.
      kudu.db.create(instance)
      .then(() => res.status(201).json(instance))
      .catch(self.genericErrorHandler.bind(self, req, res));
    }

    function handleGet( req, res ) {

      let type = req.params.type;
      let [ Model ] = getModels(type);

      // If there isn't an associated model we can't go any further.
      if ( !Model ) {
        return res.status(404).end();
      }

      // If an identifier is present in the URL we need a single instance
      let id = req.params.id;

      if ( id ) {
        return kudu.db.get(type, id)
        .then(( data ) => {

          if ( !data ) {
            return res.status(404).end();
          }

          let instance = new Model(data);
          return res.status(200).json(instance);
        })
        .catch(self.genericErrorHandler.bind(self, req, res));
      }

      // If no identifier is present we need all instances
      kudu.db.getAll(type)
      .then(( data ) => {

        let instances = data.map(( item ) => new Model(item));
        res.status(200).json(instances);
      })
      .catch(self.genericErrorHandler.bind(self, req, res));
    }

    function handlePut( req, res ) {

      let type = req.params.type;
      let [ Model ] = getModels(type);

      // If there isn't an associated model we can't go any further.
      if ( !Model ) {
        return res.status(404).end();
      }

      // If there is a model we can attempt to instantiate it with the data
      // provided with the request. If the data is invalid we send back an
      // error.
      let instance;

      try {
        instance = new Model(req.body);
      } catch ( e ) {
        return res.status(400).send(e.toString());
      }

      // Save the instance in the database and send it back to the client.
      kudu.db.update(instance)
      .then(() => res.status(200).json(instance))
      .catch(self.genericErrorHandler.bind(self, req, res));
    }

    function handleDelete( req, res ) {

      let type = req.params.type;
      let [ Model ] = getModels(type);

      // If there isn't an associated model we can't go any further.
      if ( !Model ) {
        return res.status(404).end();
      }

      // If there is a model we can attempt to instantiate it with the data
      // provided with the request. If the data is invalid we send back an
      // error.
      let instance;

      try {
        instance = new Model(req.body);
      } catch ( e ) {
        return res.status(400).send(e.toString());
      }

      // Delete the instance in the database and send back an empty response.
      kudu.db.delete(instance)
      .then(() => res.status(204).end())
      .catch(self.genericErrorHandler.bind(self, req, res));
    }

    function handleDescendantGet( req, res ) {

      let descendantType = req.params.descendantType;
      let ancestorType = req.params.ancestorType;

      let [ Descendant, Ancestor ] = getModels(descendantType, ancestorType);

      // If there aren't associated models we can't go any further.
      if ( !Descendant || !Ancestor ) {
        return res.status(404).end();
      }

      let ancestorId = req.params.ancestorId;

      // Get the descendant instances and send them back to the client.
      return kudu.db.getDescendants(ancestorType, ancestorId, descendantType)
      .then(( data ) => {

        let instances = data.map(( item ) => new Descendant(item));
        res.status(200).json(instances);
      })
      .catch(self.genericErrorHandler.bind(self, req, res));
    }

    // Get the models related to the URL
    function getModels( ...types ) {

      return types.map(( type ) => {

        let Model = kudu.getModelByPluralName(type);

        if ( !Model || Model.schema.requestable === false ) {
          return null;
        }

        return Model;
      });
    }
  }

  genericErrorHandler( req, res ) {
    return res.status(500).end();
  }
}