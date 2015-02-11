// Because Kudu sits on top of Express we use a real Express app in the tests
// rather than attempting to mock all the required Express functionality
import express from 'express';
import chai from 'chai';

import { Kudu } from '../src/kudu';

let expect = chai.expect;
let expressApp;
let app;

beforeEach(function () {
  expressApp = express();
  app = new Kudu(expressApp);
});

describe('Kudu.Router', function () {

  it('should be a constructor function exposed on Kudu', function () {
    expect(Kudu.Router).to.be.a('function');
  });
});
