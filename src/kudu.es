import { Model } from './models';

class Kudu {

  constructor( app ) {

    // Keep a reference to the server (usually an Express app)
    this.app = app;
  }
}

Kudu.Model = Model;

export { Kudu };
