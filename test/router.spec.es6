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
let Model;
let app;

describe('Router', () => {

  beforeEach(() => {
    expressApp = express();
    expressApp.use(json());
    app = new Kudu(expressApp);
    Model = app.createModel('test', {
      properties: {
        name: {
          type: String,
          required: true,
        },
        another: {
          type: String,
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
      request.post('/tests').send({
        data: { type: 'test', attributes: { name: 'test' } },
      }).expect(201)
      .end(( err, res ) => {
        if ( err ) {
          return done(err);
        }
        expect(JSON.parse(res.body).data).to.have.property('name', 'test');
        done();
      });
    });
  });

  describe('generic GET handler', () => {

    it('should 404 when the URL does not correspond to a model', ( done ) => {
      request.get('/fail').send().expect(404, done);
    });

    it('should 404 when the identifier does not correspond to a model', ( done ) => {
      request.get('/tests/1').send().expect(404, done);
    });

    it('should 200 with the serialized model instance when a valid identifier is present', ( done ) => {
      new Model({ id: '1', name: 'test' }).save()
      .then(() => {
        request.get('/tests/1').send().expect(200)
        .end(( err, res ) => {
          if ( err ) {
            throw err;
          }
          expect(JSON.parse(res.body).data).to.have.property('name', 'test');
          done();
        });
      })
      .catch(( err ) => done(err));
    });

    it('should 200 with a serialized array of model instances when no identifier is present', ( done ) => {
      new Model({ id: '1', name: 'test' }).save()
      .then(() => {
        request.get('/tests').send().expect(200)
        .end(( err, res ) => {
          if ( err ) {
            throw err;
          }
          expect(JSON.parse(res.body).data).to.be.an('array').and.to.have.length(1);
          done();
        });
      })
      .catch(( err ) => done(err));
    });

    it('should 200 with an empty array when no identifier is present and no models exist', ( done ) => {
      request.get('/tests').send().expect(200)
      .end(( err, res ) => {
        if ( err ) {
          throw err;
        }
        expect(JSON.parse(res.body).data).to.be.an('array').and.to.have.length(0);
        done();
      });
    });
  });

  describe('generic PATCH handler', () => {

    it('should 404 when the URL does not correspond to a model', ( done ) => {
      request.patch('/fail').send().expect(404, done);
    });

    it('should 404 when the identifier does not correspond to a model', ( done ) => {
      request.patch('/tests/1').send({
        data: { type: 'test', id: '1' },
      }).expect(404, done);
    });

    it('should 200 with an updated model instance', ( done ) => {
      new Model({ id: '1', name: 'test' }).save()
      .then(() => {
        request.patch('/tests/1').send({
          data: { type: 'test', id: '1', attributes: { name: 'new' } },
        }).expect(200)
        .end(( err, res ) => {
          if ( err ) {
            throw err;
          }
          expect(JSON.parse(res.body).data).to.have.property('name', 'new');
          done();
        });
      })
      .catch(( err ) => done(err));
    });

    it('should not modify attributes not present in the request', ( done ) => {
      new Model({ id: '1', name: 'test', another: 'test' }).save()
      .then(() => {
        request.patch('/tests/1').send({
          data: { type: 'test', id: '1', attributes: { name: 'new' } },
        }).expect(200)
        .end(( err, res ) => {
          if ( err ) {
            throw err;
          }
          expect(JSON.parse(res.body).data).to.have.property('another', 'test');
          done();
        });
      })
      .catch(( err ) => done(err));
    });
  });
});
