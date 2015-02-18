import chai from 'chai';
import Kudu from '../src/kudu';
import BaseModel from '../src/models/base';

let expect = chai.expect;
let Model;
let EmptyModel;
let InheritedModel;

beforeEach(() => {

  EmptyModel = new Kudu.Model({});

  Model = new Kudu.Model({
    title: 'Test',
    properties: {
      id: {
        type: 'integer',
        required: true
      },
      hidden: {
        type: 'integer',
        public: false
      },
      defaults: {
        type: 'string',
        default: 'default'
      }
    }
  });
  Model.prototype.someMethod = () => 1;

  InheritedModel = new Kudu.Model(Model, {
    properties: {
      additional: {
        type: 'string',
        required: true
      }
    }
  });
  InheritedModel.prototype.anotherMethod = () => 2;
});

describe('Kudu.Model', () => {

  it('should be a static method on Kudu', () => {
    expect(Kudu.Model).to.exist();
  });

  it('should throw an error if not passed a schema object', () => {
    function test() {
      return new Kudu.Model();
    }
    expect(test).to.throw(Error, /schema/);
  });

  it('should return a constructor function', () => {
    expect(Model).to.be.a('function');
  });

  describe('Constructor functions', () => {

    it('should throw an error if not passed instance data', () => {
      function test() {
        return new Model();
      }
      expect(test).to.throw(Error, /instance data/);
    });
  });

  describe('Constructor instances', () => {

    it('should be instantiable', () => {
      expect(new EmptyModel({})).to.be.an.instanceOf(EmptyModel);
    });

    it('should inherit from the base model', () => {
      expect(new EmptyModel({})).to.be.an.instanceof(BaseModel);
    });

    it('should validate instance data against the schema', () => {
      function test() {
        return new Model({});
      }
      expect(test).to.throw(Error, /is required/);
    });

    it('should receive default values for missing properties', () => {
      expect(new Model({ id: 1 })).to.have.property('defaults', 'default');
    });

    it('should not use default values when property is present', () => {
      expect(new Model({
        id: 1,
        defaults: 'present'
      })).to.have.property('defaults', 'present');
    });
  });

  describe('Extended instances', () => {

    it('should inherit properties from the parent model', () => {
      expect(new InheritedModel({
        id: 1,
        additional: '1'
      })).to.have.property('id', 1);
    });

    it('should obey the schema for inherited properties', () => {
      let test = () => new InheritedModel({ additional: '1' });
      expect(test).to.throw(Error, /is required/);
    });

    it('should obey the schema for own properties', () => {
      let test = () => new InheritedModel({ id: 1 });
      expect(test).to.throw(Error, /is required/);
    });

    it('should have access to its own methods', () => {
      let instance = new InheritedModel({ id: 1, additional: '1' });
      expect(instance).to.have.deep.property('anotherMethod');
    });

    it('should have access to methods from the parent', () => {
      let instance = new InheritedModel({ id: 1, additional: '1' });
      expect(instance).to.have.deep.property('someMethod');
    });
  });

  describe('Base methods', () => {

    let instance;

    beforeEach(() => {
      instance = new Model({
        id: 1,
        hidden: 2
      });
    });

    describe('#toJSON', () => {

      it('should strip private properties from the instance', () => {
        let serialised = JSON.stringify(instance);
        let obj = JSON.parse(serialised);
        expect(obj).not.to.have.property('hidden');
      });
    });
  });
});
