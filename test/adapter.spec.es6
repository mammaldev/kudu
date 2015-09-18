import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import MemoryAdapter from '../src/adapter';

chai.use(chaiAsPromised);
let expect = chai.expect;

describe('MemoryAdapter', () => {

  let adapter;

  beforeEach(() => {
    adapter = new MemoryAdapter();
  });

  it('should expose a constructor function', () => {
    expect(MemoryAdapter).to.be.a('function');
  });

  describe('#create', () => {

    it('should throw an error when not passed an object', () => {
      return expect(adapter.create()).to.be.rejectedWith(Error, /model instance/);
    });

    it('should return a promise', () => {
      expect(adapter.create({})).to.be.an.instanceOf(Promise);
    });

    it('should generate an identifier and attach it to the result', () => {
      let instance = { type: 'test' };
      return expect(adapter.create(instance)).to.eventually.have.property('id');
    });
  });

  describe('#get', () => {

    it('should throw an error when not passed a type', () => {
      return expect(adapter.get()).to.be.rejectedWith(Error, /type/);
    });

    it('should throw an error when not passed an identifier', () => {
      return expect(adapter.get('test')).to.be.rejectedWith(Error, /identifier/);
    });

    it('should return undefined when a type does not exist', () => {
      return expect(adapter.get('test', 1)).to.eventually.be.undefined;
    });

    it('should return undefined when an identifier does not exist', () => {
      adapter.create({ type: 'test', id: 1 });
      return expect(adapter.get('test', 2)).to.eventually.be.undefined;
    });

    it('should return an object when an identifier is found', () => {
      adapter.create({ type: 'test', id: 1 });
      return expect(adapter.get('test', 1)).to.eventually.have.property('id', 1);
    });
  });

  describe('#getAll', () => {

    it('should throw an error when not passed a type', () => {
      return expect(adapter.getAll()).to.be.rejectedWith(Error, /type/);
    });

    it('should return an empty array when a type does not exist', () => {
      return expect(adapter.getAll('test')).to.eventually.deep.equal([]);
    });

    it('should return an array of instances', () => {
      adapter.create({ type: 'test', id: 1 });
      return expect(adapter.getAll('test')).to.eventually.deep.equal([
        { type: 'test', id: 1 },
      ]);
    });
  });
});
