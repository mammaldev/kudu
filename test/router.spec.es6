import chai from 'chai';
import supertest from 'supertest';

// Because Kudu is designed to work with Express we use a real Express instance
// in the routing tests, rather than attempting to mock all of the required
// Express functionality.
import express from 'express';
import { json } from 'body-parser';
import Kudu from '../src/kudu';
import Router from '../src/router';

let expect = chai.expect;
let expressApp;
let request;
let app;

describe('Router', () => {

  beforeEach(() => {
    expressApp = express();
    expressApp.use(json());
    app = new Kudu(expressApp);
    app.createModel('test', {
      properties: {
        name: {
          type: String,
          required: true,
        },
      },
    });
    app.createGenericRoutes();
    request = supertest(expressApp);
  });

  describe('generic POST handler', () => {

    it('should 404 when the URL does not correspond to a model', ( done ) => {
      request.post('/fail').send().expect(404, done);
    });

    it('should 400 when the request body is an invalid model', ( done ) => {
      request.post('/tests').send().expect(400, done);
    });

    it('should respond with a serialized object containing errors', ( done ) => {
      request.post('/tests').send().expect(400)
      .end(( err, res ) => {
        expect(res.body).to.have.property('errors').which.is.an('array');
        done();
      });
    });

    it('should 201 with the serialized instance when the body is valid', ( done ) => {
      request.post('/tests').send({ name: 'test', type: 'test' }).expect(201)
      .end(( err, res ) => {
        if ( err ) {
          return done(err);
        }
        expect(JSON.parse(res.body)).to.have.property('name', 'test');
        done();
      });
    });
  });
});
