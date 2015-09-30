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

  describe('#update', () => {

    beforeEach(() => {
      adapter.create({ type: 'test', id: 1 });
    });

    it('should throw an error when not passed an object', () => {
      return expect(adapter.update()).to.be.rejectedWith(Error, /model instance/);
    });

    it('should throw an error when passed an object without a type', () => {
      return expect(adapter.update({})).to.be.rejectedWith(Error, /"type"/);
    });

    it('should throw an error when passed an object without an id', () => {
      return expect(adapter.update({ type: 'test' })).to.be.rejectedWith(Error, /"id"/);
    });

    it('should throw an error when a type store does not exist', () => {
      return expect(adapter.update({ type: 'fail', id: 1 })).to.be.rejectedWith(Error, /store/);
    });

    it('should throw an error when an instance is not stored', () => {
      return expect(adapter.update({ type: 'test', id: 2 })).to.be.rejectedWith(Error, /instance/);
    });

    it('should return an updated instance', () => {
      let instance = { type: 'test', id: 1, name: 'new' };
      return expect(adapter.update(instance)).to.eventually.deep.equal(instance);
    });
  });
});
