import chai from 'chai';
import Kudu from '../src/kudu';
import deserialize from '../src/deserializer';

let expect = chai.expect;

describe('Deserializer', () => {

  let kudu;
  let Model;

  beforeEach(() => {
    kudu = new Kudu();
    Model = kudu.createModel('test', {
      properties: {
        name: {
          type: String,
        },
      },
    });
  });

  it('should throw if not passed anything to deserialize', () => {
    let test = () => deserialize();
    expect(test).to.throw(Error, /Expected an object/);
  });

  it('should throw if passed an object without a "data" property', () => {
    let test = () => deserialize(kudu, {});
    expect(test).to.throw(Error, /data/);
  });

  it('should throw if passed an object without a type property', () => {
    let test = () => deserialize(kudu, { data: {} });
    expect(test).to.throw(Error, /"type"/);
  });

  it('should throw if passed an object without an id property', () => {
    let test = () => deserialize(kudu, { data: { type: 'type' } });
    expect(test).to.throw(Error, /"id"/);
  });

  it('should not throw if passed an object without an id property when an id is not required', () => {
    let test = () => deserialize(kudu, { data: { type: 'test' } }, 'test', false);
    expect(test).not.to.throw(Error);
  });

  it('should throw if the type refers to a non-existent model', () => {
    let test = () => deserialize(kudu, { data: { type: 'fail', id: '1' } });
    expect(test).to.throw(Error, /model/);
  });

  it('should throw if the expected type does not match the provided type', () => {
    let test = () => deserialize(kudu, { data: { type: 'test', id: '1' } }, 'fail');
    expect(test).to.throw(Error, /model/);
  });

  it('should return a Kudu model instance if passed a JSON string', () => {
    let obj = JSON.stringify({
      data: { type: 'test', id: '1' },
    });
    let deserialized = deserialize(kudu, obj, 'test');
    expect(deserialized).to.be.an.instanceOf(Model);
  });

  it('should return a Kudu model instance if passed an object', () => {
    let obj = {
      data: { type: 'test', id: '1' },
    };
    let deserialized = deserialize(kudu, obj, 'test');
    expect(deserialized).to.be.an.instanceOf(Model);
  });

  it('should copy "attributes" onto the Kudu model instance', () => {
    let obj = {
      data: { type: 'test', id: '1', attributes: { prop: 'test' } },
    };
    let deserialized = deserialize(kudu, obj, 'test');
    expect(deserialized).to.have.property('prop', 'test');
  });
});
