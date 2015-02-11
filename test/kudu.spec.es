import sinonChai from 'sinon-chai';
import chai from 'chai';
import express from 'express';

import { Kudu } from '../src/kudu';

chai.use(sinonChai);

let expect = chai.expect;
let expressApp;
let app;

beforeEach(() => {
  expressApp = express();
  app = new Kudu(expressApp);
});

describe('Kudu', () => {

  it('should expose a constructor function', () => {
    expect(Kudu).to.be.a('function');
  });

  describe('#createModel', () => {

    it('should be an instance method of Kudu', () => {
      expect(app.createModel).to.be.a('function');
    });

    it('should return a Kudu.Model instance', () => {
      var Model = app.createModel('Test', {});
      expect(Model).to.be.an.instanceOf(Kudu.Model);
    });
  });

  describe('#getModel', () => {

    it('should allow retreival of model constructors by name', () => {
      app.createModel('Test', {});
      var Model = app.getModel('Test');
      expect(Model).to.be.an.instanceOf(Kudu.Model);
    });

    it('should be case-insensitive', () => {
      app.createModel('Test', {});
      var Model = app.getModel('test');
      expect(Model).to.be.an.instanceOf(Kudu.Model);
    });
  });
});
