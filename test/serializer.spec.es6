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
      expect(JSON.parse(serialized)).to.deep.equal({ name: 'test' });
    });

    it('should exclude non-schema properties from the result', () => {
      let instance = new Model({ name: 'test', excluded: true });
      let serialized = Serialize.toJSON(instance);
      expect(JSON.parse(serialized)).to.not.have.property('excluded');
    });

    it('should exclude private properties from the result', () => {
      let instance = new Model({ name: 'test', private: true });
      let serialized = Serialize.toJSON(instance);
      expect(JSON.parse(serialized)).to.not.have.property('private');
    });

    it('should serialize an array of instances', () => {
      let instances = [
        new Model({ name: '1' }),
        new Model({ name: '2' }),
      ];
      let serialized = Serialize.toJSON(instances);
      expect(JSON.parse(serialized)).to.be.an('array');
    });
  });
});
