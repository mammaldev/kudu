import bcrypt from 'bcrypt';

export default ( app ) => {

  app.router.handle('POST', '/users', ( req, res, next ) => {

    // If you don't want to handle database interaction manually here you can
    // perform custom validation and manipulation of data before handing off to
    // the generic POST handler. In this case we want to hash the password so
    // the plain text copy never reaches the database.
    if ( req.body && req.body.password ) {
      req.body.password = bcrypt.hashSync(req.body.password, 12);
    }

    // Calling next will pass execution to the next route handler. In this case
    // that will be the generic POST handler.
    next();
  });
};
