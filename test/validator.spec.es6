import chai from 'chai';
import Kudu from '../src/kudu';
import validate from '../src/validator';

let expect = chai.expect;

describe('Validator', () => {

  let kudu;
  let Model;
  let validate;

  beforeEach(() => {
    kudu = new Kudu();
    Model = kudu.createModel('test', {
      properties: {
        name: {
          type: String,
          required: true,
        },
        test: {
          type: String,
        },
        linked: {
          link: 'test',
        },
      },
    });
    validate = kudu.validateInstance.bind(kudu);
  });

  it('should throw an error when a required property is not present', () => {
    let instance = new Model();
    let test = () => validate(instance);
    expect(test).to.throw(Error, /required/);
  });

  it('should not throw an error when a non-required property is not present', () => {
    let instance = new Model({ name: 'test' });
    let test = () => validate(instance);
    expect(test).not.to.throw(Error);
  });

  describe('Strings', () => {

    beforeEach(() => {
      Model = kudu.createModel('test', {
        properties: {
          name: {
            type: String,
          },
        },
      });
    });

    it('should throw an error when a property is not a string', () => {
      let instance = new Model({ name: 1 });
      let test = () => validate(instance);
      expect(test).to.throw(Error, /must be of type/);
    });

    it('should not throw an error when a property is a string literal', () => {
      let instance = new Model({ name: '1' });
      let test = () => validate(instance);
      expect(test).not.to.throw();
    });

    it('should not throw an error when a property is a String instance', () => {
      let instance = new Model({ name: new String('1') });
      let test = () => validate(instance);
      expect(test).not.to.throw();
    });
  });

  describe('Numbers', () => {

    beforeEach(() => {
      Model = kudu.createModel('test', {
        properties: {
          name: {
            type: Number,
          },
        },
      });
    });

    it('should throw an error when a property is not a number', () => {
      let instance = new Model({ name: '1' });
      let test = () => validate(instance);
      expect(test).to.throw(Error, /must be of type/);
    });

    it('should not throw an error when a property is a number literal', () => {
      let instance = new Model({ name: 1 });
      let test = () => validate(instance);
      expect(test).not.to.throw();
    });

    it('should not throw an error when a property is a Number instance', () => {
      let instance = new Model({ name: new Number('1') });
      let test = () => validate(instance);
      expect(test).not.to.throw();
    });
  });

  describe('Booleans', () => {

    beforeEach(() => {
      Model = kudu.createModel('test', {
        properties: {
          name: {
            type: Boolean,
          },
        },
      });
    });

    it('should throw an error when a property is not a boolean', () => {
      let instance = new Model({ name: 'true' });
      let test = () => validate(instance);
      expect(test).to.throw(Error, /must be of type/);
    });

    it('should not throw an error when a property is a boolean literal', () => {
      let instance = new Model({ name: true });
      let test = () => validate(instance);
      expect(test).not.to.throw();
    });

    it('should not throw an error when a property is a Boolean instance', () => {
      let instance = new Model({ name: new Boolean(true) });
      let test = () => validate(instance);
      expect(test).not.to.throw();
    });
  });

  describe('Objects', () => {

    beforeEach(() => {
      Model = kudu.createModel('test', {
        properties: {
          name: {
            type: Object,
          },
        },
      });
    });

    it('should throw an error when a property is not an object', () => {
      let instance = new Model({ name: 'string' });
      let test = () => validate(instance);
      expect(test).to.throw(Error, /must be of type/);
    });

    it('should throw an error when a property is null', () => {
      let instance = new Model({ name: null });
      let test = () => validate(instance);
      expect(test).to.throw(Error, /must be of type/);
    });

    it('should not throw an error when a property is an object', () => {
      let instance = new Model({ name: {} });
      let test = () => validate(instance);
      expect(test).not.to.throw();
    });
  });

  describe('links', () => {

    it('should throw an error when a property is not of the correct type', () => {
      let instance = new Model({ name: 'test', linked: '1' });
      let test = () => validate(instance);
      expect(test).to.throw(Error, /instance/);
    });

    it('should not throw an error when a property is of the correct type', () => {
      let instance = new Model({ name: 'test', linked: new Model() });
      let test = () => validate(instance);
      expect(test).not.to.throw();
    });
  });
});
