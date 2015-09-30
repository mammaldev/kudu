import chai from 'chai';
import Kudu from '../src/kudu';
import Serialize from '../src/serializer';

let expect = chai.expect;

describe('Serializer', () => {

  let kudu;
  let Model;

  beforeEach(() => {
    kudu = new Kudu();
    Model = kudu.createModel('test', {
      properties: {
        name: {
          type: String,
        },
        private: {
          type: String,
          public: false,
        },
      },
    });
  });

  describe('#toJSON', () => {

    it('should return a JSON string', () => {
      let instance = new Model({ name: 'test' });
      let serialized = Serialize.toJSON(instance);
      expect(JSON.parse(serialized)).to.deep.equal({
        data: { name: 'test' },
      });
    });

    it('should exclude non-schema properties from the result', () => {
      let instance = new Model({ name: 'test', excluded: true });
      let serialized = Serialize.toJSON(instance);
      expect(JSON.parse(serialized).data).to.not.have.property('excluded');
    });

    it('should exclude private properties from the result', () => {
      let instance = new Model({ name: 'test', private: true });
      let serialized = Serialize.toJSON(instance);
      expect(JSON.parse(serialized).data).to.not.have.property('private');
    });

    it('should serialize an array of instances', () => {
      let instances = [
        new Model({ name: '1' }),
        new Model({ name: '2' }),
      ];
      let serialized = Serialize.toJSON(instances);
      expect(JSON.parse(serialized).data).to.be.an('array');
    });
  });

  describe('#errorsToJSON', () => {

    it('should return a JSON string', () => {
      let error = new Error('test');
      let serialized = Serialize.errorsToJSON(error);
      expect(JSON.parse(serialized)).to.deep.equal({
        errors: [ { detail: 'test' } ],
      });
    });

    it('should serialize an array of errors', () => {
      let errors = [
        new Error('test1'),
        new Error('test2'),
      ];
      let serialized = Serialize.errorsToJSON(errors);
      expect(JSON.parse(serialized).errors).to.be.an('array');
    });
  });
});
