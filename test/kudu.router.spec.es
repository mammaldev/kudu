// Because Kudu sits on top of Express we use a real Express app in the tests
// rather than attempting to mock all the required Express functionality
import { json } from 'body-parser';
import supertest from 'supertest';
import express from 'express';
import chai from 'chai';

import { MockAdapter } from './utils/kudu.db.mock';
import { Kudu } from '../src/kudu';

let expect = chai.expect;
let expressApp;
let request;
let app;

beforeEach(function () {

  expressApp = express();
  expressApp.use(json());

  app = new Kudu(expressApp, {
    databaseAdapter: MockAdapter
  });

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

describe('Kudu.Router', function () {

  it('should be a constructor function exposed on Kudu', function () {
    expect(Kudu.Router).to.be.a('function');
  });

  describe('generic POST handler', function () {

    it('should return a serialized model instance when given valid data', function ( done ) {
      request.post('/tests')
      .send({ id: 1 })
      .expect(201)
      .end(( err, res ) => {
        expect(res.body).to.have.property('id', 1);
        done();
      });
    });

    it('should fail with 404 when a model is not found for the URL', function ( done ) {
      request.post('/invalid')
      .send({ id: 1 })
      .expect(404, done);
    });

    it('should fail with 400 when a model cannot be instantiated', function ( done ) {
      request.post('/tests')
      .send({ id: 'invalid' })
      .expect(400, done);
    });

    it('should fail with 500 when the database adapter throws/rejects', function ( done ) {
      request.post('/tests')
      .send({ id: 2 })
      .expect(500, done);
    });
  });

  describe('generic GET handler', function () {

    it('should return all instances when no ID is present', function ( done ) {
      request.get('/tests')
      .expect(200)
      .end(function ( err, res ) {
        expect(res.body).to.be.an('array');
        done();
      });
    });

    it('should fail with 404 when a model is not found for the URL', function ( done ) {
      request.get('/fail')
      .expect(404, done);
    });

    it('should return a single instance when an ID is present', function ( done ) {
      request.get('/tests/1')
      .expect(200)
      .end(function ( err, res ) {
        expect(res.body).to.have.property('id', 1);
        done();
      });
    });

    it('should fail with 404 when no instance is found for the given ID', function ( done ) {
      request.get('/tests/2')
      .expect(404, done);
    });

    it('should fail with 500 when the database adapter throws/rejects', function ( done ) {
      request.get('/tests/3')
      .expect(500, done);
    });
  });
});
