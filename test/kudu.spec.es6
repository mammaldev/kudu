import chai from 'chai';
import Kudu from '../src/kudu';

let expect = chai.expect;

describe('Kudu', () => {

  it('should expose a constructor function', () => {
    expect(Kudu).to.be.a('function');
  });
});
