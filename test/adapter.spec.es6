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
});
