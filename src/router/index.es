export class Router {

  constructor( kudu, config = {} ) {

    this.kudu = kudu;
    this.config = config;

    config.baseURL = config.baseURL || '';
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
  // This method should be called after any custom route handlers have been
  // configured because the URLs its uses are highly generic and would be
  // likely to match many more requests than intended.
  enableGenericRouteHandlers() {

    let self = this;
    let kudu = this.kudu;
    let base = this.config.baseURL || '';
    let specificURL = base + '/:type/:id';
    let genericURL = base + '/:type';
    let express = this.kudu.app;

    express.post(genericURL, handlePost); // Create
    express.get(specificURL, handleGet); // Get one
    express.get(genericURL, handleGet); // Get all
    express.put(specificURL, handlePut); // Update one
    express.delete(specificURL, handleDelete); // Delete one

    //
    // Utility functions
    //

    function handlePost( req, res ) {

      let type = req.params.type;
      let Model = kudu.getModelByPluralName(type);

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
        return res.status(400).send(e);
      }

      // Save the instance in the database and send it back to the client.
      kudu.db.create(instance)
      .then(() => res.status(201).json(instance))
      .catch(self.genericErrorHandler.bind(self, req, res));
    }

    function handleGet( req, res ) {

      let type = req.params.type;
      let Model = kudu.getModelByPluralName(type);

      // If there isn't an associated model we can't go any further.
      if ( !Model ) {
        return res.status(404).end();
      }

      // If an identifier is present in the URL we need a single instance
      let id = req.params.id;

      if ( id ) {
        return kudu.db.get(id)
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
      let Model = kudu.getModelByPluralName(type);

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
        return res.status(400).send(e);
      }

      // Save the instance in the database and send it back to the client.
      kudu.db.update(instance)
      .then(() => res.status(200).json(instance))
      .catch(self.genericErrorHandler.bind(self, req, res));
    }

    function handleDelete( req, res ) {

      let type = req.params.type;
      let Model = kudu.getModelByPluralName(type);

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
        return res.status(400).send(e);
      }

      // Delete the instance in the database and send back an empty response.
      kudu.db.delete(instance)
      .then(() => res.status(204).end())
      .catch(self.genericErrorHandler.bind(self, req, res));
    }
  }

  genericErrorHandler( req, res ) {
    return res.status(500).end();
  }
}
