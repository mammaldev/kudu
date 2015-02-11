import chai from 'chai';
import { Kudu } from '../src/kudu';
import { BaseModel } from '../src/models/base';

let expect = chai.expect;
let Model;
let EmptyModel;

beforeEach(() => {
  EmptyModel = new Kudu.Model({});
  Model = new Kudu.Model({
    title: 'Test',
    properties: {
      id: {
        type: 'integer',
        required: true
      }
    }
  });
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

    it('should be an instance of Kudu.Model', () => {
      expect(Model).to.be.an.instanceOf(Kudu.Model);
    });

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
  });

  describe('Base methods', () => {

    let instance;

    beforeEach(() => {
      instance = new Model({
        id: 1
      });
    });

    describe('#toJSON', () => {

      it('should be called when stringifying an instance', () => {
        expect(JSON.stringify(instance)).to.be.a('string');
      });
    });
  });
});
