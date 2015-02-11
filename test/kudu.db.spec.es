import chai from 'chai';
import { Kudu } from '../src/kudu';

let expect = chai.expect;

describe('Kudu.DB', function () {

  it('should be a simple object exposed on Kudu', function () {
    expect(Kudu.DB).to.be.an('object');
  });
});
