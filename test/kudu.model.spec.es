import chai from 'chai';
import { Kudu } from '../src/kudu';
import { BaseModel } from '../src/models/base';

let expect = chai.expect;
let Model;
let EmptyModel;

beforeEach(function () {
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

describe('Kudu.Model', function () {

  it('should be a static method on Kudu', function () {
    expect(Kudu.Model).to.exist();
  });

  it('should throw an error if not passed a schema object', function () {
    function test() {
      return new Kudu.Model();
    }
    expect(test).to.throw(Error, /schema/);
  });

  it('should return a constructor function', function () {
    expect(Model).to.be.a('function');
  });

  describe('Constructor functions', function () {

    it('should be an instance of Kudu.Model', function () {
      expect(Model).to.be.an.instanceOf(Kudu.Model);
    });

    it('should throw an error if not passed instance data', function () {
      function test() {
        return new Model();
      }
      expect(test).to.throw(Error, /instance data/);
    });
  });

  describe('Constructor instances', function () {

    it('should be instantiable', function () {
      expect(new EmptyModel({})).to.be.an.instanceOf(EmptyModel);
    });

    it('should inherit from the base model', function () {
      expect(new EmptyModel({})).to.be.an.instanceof(BaseModel);
    });

    it('should validate instance data against the schema', function () {
      function test() {
        return new Model({});
      }
      expect(test).to.throw(Error, /is required/);
    });
  });
});
