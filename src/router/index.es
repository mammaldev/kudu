export class Router {

  constructor( kudu, config = {} ) {

    this.kudu = kudu;

    // Configure generic API routes.
    let express = kudu.app;
    let base = config.baseURL || '';
    let url = base + '/:type';

    express.post(url, handlePost);

    //
    // Utility functions
    //

    function handlePost( req, res ) {

      let type = req.params.type;
      let Model = kudu.getModel(type);

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
      .catch(() => res.status(500).end());
    }
  }
}
