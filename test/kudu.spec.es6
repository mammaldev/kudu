import sinonChai from 'sinon-chai';
import chai from 'chai';
import express from 'express';

import Kudu from '../src/kudu';

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

    it('should return a model constructor function', () => {
      let Model = app.createModel('Test', {});
      expect(Model).to.be.a('function');
    });

    it('should accept both singular and plural names', () => {
      let Model = app.createModel('person', 'people', {});
      expect(Model).to.be.a('function');
    });

    it('should expose the lowercase singular name on the constructor', () => {
      let Model = app.createModel('Test', {});
      expect(Model.singular).to.equal('test');
    });

    it('should expose the lowercase plural name on the constructor', () => {
      let Model = app.createModel('Test', {});
      expect(Model.plural).to.equal('tests');
    });

    it('should accept a parent model by singular name', () => {
      let Parent = app.createModel('parent', {});
      let Child = app.createModel('child', {}, 'parent');
      let child = new Child({});
      expect(child).to.be.an.instanceOf(Parent);
    });
  });

  describe('#getModel', () => {

    it('should allow retreival of model constructors by name', () => {
      app.createModel('Test', {});
      let Model = app.getModel('Test');
      expect(Model).to.be.a('function');
    });

    it('should be case-insensitive', () => {
      app.createModel('Test', {});
      let Model = app.getModel('test');
      expect(Model).to.be.a('function');
    });
  });
});
