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
  });
});
