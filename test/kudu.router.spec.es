// Because Kudu sits on top of Express we use a real Express app in the tests
// rather than attempting to mock all the required Express functionality
import { json } from 'body-parser';
import supertest from 'supertest';
import express from 'express';
import chai from 'chai';

import MockAdapter from './utils/kudu.db.mock';
import Kudu from '../src/kudu';

let expect = chai.expect;
let expressApp;
let request;
let app;

beforeEach(() => {

  expressApp = express();
  expressApp.use(json());

  app = new Kudu(expressApp, {
    databaseAdapter: MockAdapter
  });

  app.router.handle('GET', '/handle', ( req, res ) => {
    res.status(200).end();
  });

  app.router.enableGenericRouteHandlers();

  app.createModel('Test', {
    properties: {
      id: {
        type: 'integer',
        required: true
      }
    }
  });

  request = supertest(expressApp);
});

describe('Kudu.Router', () => {

  it('should be a constructor function exposed on Kudu', () => {
    expect(Kudu.Router).to.be.a('function');
  });

  it('should be instantiated and exposed on Kudu instances', () => {
    expect(app.router).to.be.an.instanceOf(Kudu.Router);
  });

  it('should prepend a given base path to each URL', ( done ) => {

    let expressApp = express();
    let app = new Kudu(expressApp, {
      databaseAdapter: MockAdapter,
      router: {
        baseURL: '/api'
      }
    });
    let request = supertest(expressApp);

    app.router.handle('GET', '/handle', ( req, res ) => res.status(200).end());

    request.get('/api/handle')
    .expect(200, done);
  });

  describe('generic POST handler', () => {

    it('should return a serialized model instance when given valid data', ( done ) => {
      request.post('/tests')
      .send({ id: 1 })
      .expect(201)
      .end(( err, res ) => {
        expect(res.body).to.have.property('id', 1);
        done();
      });
    });

    it('should fail with 404 when a model is not found for the URL', ( done ) => {
      request.post('/invalid')
      .send({ id: 1 })
      .expect(404, done);
    });

    it('should fail with 400 when a model cannot be instantiated', ( done ) => {
      request.post('/tests')
      .send({ id: 'invalid' })
      .expect(400, done);
    });

    it('should fail with 500 when the database adapter throws/rejects', ( done ) => {
      request.post('/tests')
      .send({ id: 0 })
      .expect(500, done);
    });
  });

  describe('generic GET handler', () => {

    beforeEach(( done ) => {
      Promise.all([
        app.db.create({ type: 'tests', id: 1 }),
        app.db.create({ type: 'tests', id: 2 })
      ])
      .then(() => done());
    });

    it('should return all instances when no ID is present', ( done ) => {
      request.get('/tests')
      .expect(200)
      .end(( err, res ) => {
        expect(res.body).to.be.an('array').with.property('length', 2);
        done();
      });
    });

    it('should fail with 404 when a model is not found for the URL', ( done ) => {
      request.get('/fail')
      .expect(404, done);
    });

    it('should return a single instance when an ID is present', ( done ) => {
      request.get('/tests/1')
      .expect(200)
      .end(( err, res ) => {
        expect(res.body).to.have.property('id', 1);
        done();
      });
    });

    it('should fail with 404 when no instance is found for the given ID', ( done ) => {
      request.get('/tests/3')
      .expect(404, done);
    });

    it('should fail with 500 when the database adapter throws/rejects', ( done ) => {
      request.get('/tests/throw')
      .expect(500, done);
    });
  });

  describe('generic PUT handler', () => {

    it('should return a serialized model instance when given valid data', ( done ) => {
      request.put('/tests/1')
      .send({ id: 2 })
      .end(( err, res ) => {
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('id', 2);
        done();
      });
    });

    it('should fail with 404 when a model is not found for the URL', ( done ) => {
      request.put('/invalid/1')
      .send({ id: 2 })
      .expect(404, done);
    });

    it('should fail with 400 when a model cannot be instantiated', ( done ) => {
      request.put('/tests/1')
      .send({ id: 'invalid' })
      .expect(400, done);
    });

    it('should fail with 500 when the database adapter throws/rejects', ( done ) => {
      request.put('/tests/1')
      .send({ id: 0 })
      .expect(500, done);
    });
  });

  describe('generic DELETE handler', () => {

    it('should return 204 with no content when given valid data', ( done ) => {
      request.delete('/tests/1')
      .send({ id: 2 })
      .end(( err, res ) => {
        expect(res.status).to.equal(204);
        expect(Object.keys(res.body)).to.have.length(0);
        done();
      });
    });

    it('should fail with 404 when a model is not found for the URL', ( done ) => {
      request.delete('/invalid/1')
      .send({ id: 2 })
      .expect(404, done);
    });

    it('should fail with 400 when a model cannot be instantiated', ( done ) => {
      request.delete('/tests/1')
      .send({ id: 'invalid' })
      .expect(400, done);
    });

    it('should fail with 500 when the database adapter throws/rejects', ( done ) => {
      request.delete('/tests/1')
      .send({ id: 0 })
      .expect(500, done);
    });
  });

  describe('#handle', () => {

    it('should set up a route handler on the Express app', ( done ) => {
      request.get('/handle')
      .expect(200, done);
    });
  });
});
