import chai from 'chai';
import { Kudu } from '../src/kudu';

let expect = chai.expect;

describe('Kudu.DB', () => {

  it('should be a simple object exposed on Kudu', () => {
    expect(Kudu.DB).to.be.an('object');
  });
});
