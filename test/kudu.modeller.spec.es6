import chai from 'chai';
import Modeller from '../src/modeller';

let expect = chai.expect;
let model;

beforeEach(() => {
  model = new Modeller();
});

describe('Kudu.Modeller', () => {

  describe('#create', () => {

    it('should be an instance method of Modeller', () => {
      expect(model.create).to.be.a('function');
    });

    it('should return a model constructor function', () => {
      let Model = model.create('Test', {});
      expect(Model).to.be.a('function');
    });

    it('should accept both singular and plural names', () => {
      let Model = model.create('person', 'people', {});
      expect(Model).to.be.a('function');
    });

    it('should expose the lowercase singular name on the constructor', () => {
      let Model = model.create('Test', {});
      expect(Model.singular).to.equal('test');
    });

    it('should expose the lowercase plural name on the constructor', () => {
      let Model = model.create('Test', {});
      expect(Model.plural).to.equal('tests');
    });

    it('should accept a parent model by singular name', () => {
      let Parent = model.create('parent', {});
      let Child = model.create('child', {}, 'parent');
      let child = new Child({});
      expect(child).to.be.an.instanceOf(Parent);
    });
  });

  describe('#get', () => {

    it('should allow retreival of model constructors by name', () => {
      model.create('Test', {});
      let Model = model.get('Test');
      expect(Model).to.be.a('function');
    });

    it('should be case-insensitive', () => {
      model.create('Test', {});
      let Model = model.get('test');
      expect(Model).to.be.a('function');
    });
  });
});
