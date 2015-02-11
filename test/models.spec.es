import chai from 'chai';
import { Kudu } from '../src/kudu';

let expect = chai.expect;
let Model;

beforeEach(function () {
  Model = new Kudu.Model({});
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
});

describe('Kudu.Model constructor functions', function () {

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

describe('Kudu.Model constructor instances', function () {

  it('should be instantiable', function () {
    expect(new Model({})).to.be.an.instanceOf(Model);
  });
});
