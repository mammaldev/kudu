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
  handle( verb, path, config ) {

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
    if ( !config.hasOwnProperty('ignoreBaseURL') ) {
      path = this.config.baseURL + path;
    }
    expressArgs.unshift(path);

    this.kudu.app[ verb.toLowerCase() ].apply(this.kudu.app, expressArgs);
  }

  // Register a route handler specific to a Kudu model with Express. Takes a
  // Kudu model constructor (or model name as a string) and delegates the rest
  // of its arguments to Router#handle.
  handleForModel( model, verb, path, ...rest ) {

    // If the provided model is a string we need to get the actual constructor.
    // This is (a) to ensure the model exists and (b) so we can get its plural
    // name as URLs should always use the plural.
    let Model;
    if ( typeof model === 'string' ) {

      // Assume that the given string corresponds to a singular model name.
      Model = this.kudu.getModel(model);

      // If that didn't work then we can try again with the plural name.
      if ( !Model ) {
        Model = this.kudu.getModelByPluralName(model);
      }
    }

    // If we don't have a model constructor at this point then the given name
    // didn't correspond to a registered model and we can't proceed.
    if ( !Model ) {
      throw new Error(`Model ${ model } is not registered.`);
    }

    // Get the plural name of the model and let Router#handle do the rest.
    let modelPath = `/${ Model.plural }${ path }`;
    this.handle(verb, modelPath, ...rest);
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
