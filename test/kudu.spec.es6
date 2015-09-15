import chai from 'chai';
import Kudu from '../src/kudu';
import BaseModel from '../src/model';
import validate from '../src/validate';

let expect = chai.expect;

describe('Kudu', () => {

  let kudu;

  beforeEach(() => {
    kudu = new Kudu();
  });

  it('should expose a constructor function', () => {
    expect(Kudu).to.be.a('function');
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

  describe('Model', () => {

    it('should expose the singular name on the constructor', () => {
      let Model = kudu.createModel('test', {});
      expect(Model).to.have.property('singular', 'test');
    });

    it('should expose the plural name on the constructor', () => {
      let Model = kudu.createModel('test', 'tests', {});
      expect(Model).to.have.property('plural', 'tests');
    });

    it('should default the plural name to singular name plus "s"', () => {
      let Model = kudu.createModel('test', {});
      expect(Model).to.have.property('plural', 'tests');
    });

    it('should expose the schema on the constructor', () => {
      let schema = {};
      let Model = kudu.createModel('test', schema);
      expect(Model.schema).to.equal(schema);
    });
  });

  describe('Model instances', () => {

    let Model;

    beforeEach(() => {
      Model = kudu.createModel('test', {});
    });

    it('should inherit from the base Model constructor', () => {
      expect(new Model()).to.be.an.instanceOf(BaseModel);
    });

    it('should map provided data onto the instance', () => {
      expect(new Model({ id: 1 })).to.have.property('id', 1);
    });
  });

  describe('Validator', () => {

    let Model;

    beforeEach(() => {
      Model = kudu.createModel('test', {
        properties: {
          name: {
            required: true,
          },
        },
      });
    });

    it('should throw an error when a required property is not present', () => {
      let instance = new Model();
      let test = () => validate(instance);
      expect(test).to.throw(Error, /required/);
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
  });
});
