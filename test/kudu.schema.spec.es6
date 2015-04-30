import chai from 'chai';
import Schema from '../src/modeller/schema';

let expect = chai.expect;

describe('Kudu.Schema', () => {

  it('should expose a "validate" method', () => {
    expect(Schema).to.have.ownProperty('validate');
  });

  describe('#validate', () => {

    let validate = Schema.validate.bind(Schema);

    it('should throw an error when not passed any data', () => {
      expect(validate).to.throw(Error, /Missing/);
    });

    it('should throw an error when not passed a schema', () => {
      let test = () => validate({});
      expect(test).to.throw(Error, /Missing/);
    });

    it('should require a "properties" key on a schema', () => {
      let test = () => validate({}, {});
      expect(test).to.throw(Error, /properties/);
    });

    it('should throw errors for missing "required" properties', () => {
      let test = () => validate({}, {
        properties: {
          name: {
            required: true,
          },
        },
      });
      expect(test).to.throw(Error, /required/);
    });

    it('should add missing default values', () => {
      expect(validate({}, {
        properties: {
          x: {
            type: Number,
            default: 10,
          },
        },
      })).to.deep.equal({ x: 10 });
    });

    it('should not add default values when a value already exists', () => {
      expect(validate({ x: 5 }, {
        properties: {
          x: {
            type: Number,
            default: 10,
          },
        },
      })).to.deep.equal({ x: 5 });
    });
  });

  describe('#validateType', () => {

    it('should throw an error when not passed a type', () => {
      expect(Schema.validateType).to.throw(Error, /Unknown type/);
    });

    it('should throw an error when passed an invalid type', () => {
      let test = () => Schema.validateType(1, 'invalid');
      expect(test).to.throw(Error, /Unknown type/);
    });

    it('should throw an error when the type does not match', () => {
      let test = () => Schema.validateType(1, 'string');
      expect(test).to.throw(Error, /not of type/);
    });

    it('should return true when the value is a literal of valid type', () => {
      expect(Schema.validateType(1, 'number')).to.equal(true);
    });

    it('should return true when the value is an instance of valid type', () => {
      expect(Schema.validateType(new Number(1), 'number')).to.equal(true);
    });
  });

  describe('#validateString', () => {

    it('should throw an error when the value is not a string', () => {
      let test = () => Schema.validateString(1);
      expect(test).to.throw(Error, /not of type/);
    });

    it('should accept string literals', () => {
      expect(Schema.validateString('a')).to.equal(true);
    });

    it('should accept String instances', () => {
      expect(Schema.validateString(new String('a'))).to.equal(true);
    });
  });

  describe('#validateNumber', () => {

    it('should throw an error when the value is not a number', () => {
      let test = () => Schema.validateNumber('a');
      expect(test).to.throw(Error, /not of type/);
    });

    it('should accept numeric literals', () => {
      expect(Schema.validateNumber(1)).to.equal(true);
    });

    it('should accept Number instances', () => {
      expect(Schema.validateNumber(new Number(1))).to.equal(true);
    });
  });

  describe('#validateBoolean', () => {

    it('should throw an error when the value is not a number', () => {
      let test = () => Schema.validateBoolean('a');
      expect(test).to.throw(Error, /not of type/);
    });

    it('should accept boolean literals', () => {
      expect(Schema.validateBoolean(true)).to.equal(true);
    });

    it('should accept Boolean instances', () => {
      expect(Schema.validateBoolean(new Boolean(true))).to.equal(true);
    });
  });

  describe('#validateDate', () => {

    it('should throw an error when the value is not a date', () => {
      let test = () => Schema.validateDate('a');
      expect(test).to.throw(Error, /not of type/);
    });

    it('should accept valid date strings', () => {
      expect(Schema.validateDate('2015-02-17T11:53:39.482Z')).to.equal(true);
    });

    it('should accept valid Date instances', () => {
      let date = new Date('2015-02-17T11:53:39.482Z');
      expect(Schema.validateDate(date)).to.equal(true);
    });

    it('should throw an error when the value is an invalid instance', () => {
      let test = () => Schema.validateDate(new Date('invalid'));
      expect(test).to.throw(Error, /not of type/);
    });
  });

  describe('#validateArray', () => {

    it('should throw an error when the value is not an array', () => {
      let test = () => Schema.validateArray('a');
      expect(test).to.throw(Error, /not of type array/);
    });

    it('should throw an error when a data value is of the wrong type', () => {
      let test = () => Schema.validateArray([ 1 ], { type: [ { type: String } ] });
      expect(test).to.throw(Error, /not of type string/);
    });

    it('should accept an array of valid values', () => {
      let arraySchema = { type: [ { type: Number } ] };
      expect(Schema.validateArray([ 1, 2, 3 ], arraySchema)).to.equal(true);
    });
  });

  describe('#validateObject', () => {

    it('should throw an error when the value is not an object', () => {
      let test = () => Schema.validateObject('a');
      expect(test).to.throw(Error, /not of type object/);
    });

    it('should throw an error when a property is of the wrong type', () => {
      let test = () => Schema.validateObject({ x: 1 }, { x: { type: String } });
      expect(test).to.throw(Error, /not of type string/);
    });

    it('should accept an object of valid values', () => {
      let objectSchema = { x: { type: Number } };
      expect(Schema.validateObject({ x: 1 }, objectSchema)).to.equal(true);
    });

    it('should recursively validate nested objects', () => {
      let test = () => {
        let data = { x: { y: 1 } };
        Schema.validateObject(data, {
          x: {
            type: {
              y: {
                type: String,
              },
            },
          },
        });
      };
      expect(test).to.throw(Error, /not of type string/);
    });
  });
});
