import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import Kudu from '../src/kudu';
import MemoryAdapter from '../src/adapter';

chai.use(chaiAsPromised);
let expect = chai.expect;

describe('Kudu', () => {

  let kudu;

  beforeEach(() => {
    kudu = new Kudu();
  });

  it('should expose a constructor function', () => {
    expect(Kudu).to.be.a('function');
  });

  it('should throw an error when given invalid adapter config', () => {
    let test = () => new Kudu({}, { adapter: {} });
    expect(test).to.throw(Error, /config/);
  });

  it('should expose an instance of the in-memory adapter by default', () => {
    expect(kudu.db).to.be.an.instanceOf(MemoryAdapter);
  });

  it('should expose an instance of a custom adapter', () => {
    let CustomAdapter = () => {};
    let kudu = new Kudu(null, {
      adapter: {
        type: CustomAdapter,
      },
    });
    expect(kudu.db).to.be.an.instanceOf(CustomAdapter);
  });

  it('should expose a deserialize method', () => {
    expect(kudu.deserialize).to.be.a('function');
  });

  it('should expose a serializer', () => {
    expect(kudu.serialize).to.be.an('object');
  });

  it('should expose "services" passed through the config', () => {
    let kudu = new Kudu(null, {
      services: {
        test: 1,
      },
    });
    expect(kudu.services).to.have.property('test', 1);
  });

  it('should expose a model validator function', () => {
    expect(kudu.validateInstance).to.be.a('function');
  });

  describe('#createModel', () => {

    it('should throw an error if not passed a schema object', () => {
      let test = () => kudu.createModel('test');
      expect(test).to.throw(Error, /schema/);
    });

    it('should return a constructor when passed valid arguments', () => {
      expect(kudu.createModel('test', {})).to.be.a('function');
    });

    it('should not treat a plural name as a schema', () => {
      expect(kudu.createModel('test', 'tests', {})).to.be.a('function');
    });

    it('should add the model to the model cache', () => {
      let Model = kudu.createModel('test', {});
      expect(kudu.models.get('test')).to.equal(Model);
    });

    it('should add the model to the pluralised model cache', () => {
      let Model = kudu.createModel('test', {});
      expect(kudu.modelsByPluralName.get('tests')).to.equal(Model);
    });
  });

  describe('#getModel', () => {

    it('should return a model constructor from the model cache', () => {
      let Model = kudu.createModel('test', {});
      expect(kudu.getModel('test')).to.equal(Model);
    });

    it('should return undefined when no model matches the given name', () => {
      expect(kudu.getModel('fail')).to.be.undefined;
    });
  });
});
