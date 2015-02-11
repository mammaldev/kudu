import sinonChai from 'sinon-chai';
import chai from 'chai';
import express from 'express';

import { Kudu } from '../src/kudu';

chai.use(sinonChai);

let expect = chai.expect;
let expressApp;
let app;

beforeEach(function () {
  expressApp = express();
  app = new Kudu(expressApp);
});

describe('Kudu', function () {

  it('should expose a constructor function', function () {
    expect(Kudu).to.be.a('function');
  });

  describe('#createModel', function () {

    it('should be an instance method of Kudu', function () {
      expect(app.createModel).to.be.a('function');
    });

    it('should return a Kudu.Model instance', function () {
      var Model = app.createModel('Test', {});
      expect(Model).to.be.an.instanceOf(Kudu.Model);
    });
  });

  describe('#getModel', function () {

    it('should allow retreival of model constructors by name', function () {
      app.createModel('Test', {});
      var Model = app.getModel('Test');
      expect(Model).to.be.an.instanceOf(Kudu.Model);
    });

    it('should be case-insensitive', function () {
      app.createModel('Test', {});
      var Model = app.getModel('test');
      expect(Model).to.be.an.instanceOf(Kudu.Model);
    });
  });
});
