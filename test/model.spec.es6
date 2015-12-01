import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import Kudu from '../src/kudu';
import BaseModel from '../src/model';

chai.use(chaiAsPromised);
let expect = chai.expect;

describe('Model', () => {

  let kudu;

  beforeEach(() => {
    kudu = new Kudu();
  });

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

  it('should default "relationships" to an empty object on the schema', () => {
    let schema = {};
    let Model = kudu.createModel('test', schema);
    expect(Model.schema.relationships).to.deep.equal({});
  });

  it('should decorate the constructor with a static "inherits" method', () => {
    let Model = kudu.createModel('test', {});
    expect(Model.inherits).to.be.a('function');
  });

  describe('static get', () => {

    let Model;

    beforeEach(() => {
      Model = kudu.createModel('test', {
        properties: {},
      });
    });

    it('should fail when no identifier is provided', () => {
      return expect(Model.get()).to.be.rejectedWith(Error, /identifier/);
    });
  });

  describe('instances', () => {

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

  describe('#save', () => {

    let Model;

    beforeEach(() => {
      Model = kudu.createModel('test', {
        properties: {
          name: {
            type: String,
            required: true,
          },
        },
      });
    });

    it('should return a promise', () => {
      let instance = new Model();
      expect(instance.save()).to.be.an.instanceOf(Promise);
    });

    it('should run a "create" hook function', () => {
      let Model = kudu.createModel('hookTest', {
        properties: {
          name: {
            type: String,
            required: true,
          },
        },
        hooks: {
          onCreate() {
            this.name = 'test';
          },
        },
      });
      let instance = new Model();
      return expect(instance.save()).to.eventually.have.property('name', 'test');
    });

    it('should run an array of "create" hook functions', () => {
      let Model = kudu.createModel('hookTest', {
        properties: {
          name: {
            type: String,
            required: true,
          },
        },
        hooks: {
          onCreate: [
            function () { this.name = 'test'; },
            function () { this.name = 'new'; },
          ],
        },
      });
      let instance = new Model();
      return expect(instance.save()).to.eventually.have.property('name', 'new');
    });

    it('should fail when the model is invalid', () => {
      let instance = new Model();
      return expect(instance.save()).to.be.rejectedWith(Error, /required/);
    });

    it('should add a "type" property when one is not present', () => {
      let instance = new Model({ name: 'test' });
      return expect(instance.save()).to.eventually.have.property('type', 'test');
    });

    it('should succeed when the model is valid', () => {
      let instance = new Model({ type: 'test', name: 'test' });
      return expect(instance.save()).to.be.fulfilled;
    });

    it('should merge properties generated by the adapter with the model', () => {
      let instance = new Model({ type: 'test', name: 'test' });
      return expect(instance.save()).to.eventually.have.property('id');
    });
  });

  describe('#update', () => {

    let Model;
    let instance;

    beforeEach(() => {
      Model = kudu.createModel('test', {
        properties: {
          name: {
            type: String,
            required: true,
          },
        },
      });
      instance = new Model({
        type: 'test',
        name: 'test',
      });
      return instance.save();
    });

    it('should return a promise', () => {
      expect(instance.update()).to.be.an.instanceOf(Promise);
    });

    it('should run an "update" hook function', () => {
      let Model = kudu.createModel('hookTest', {
        properties: {
          name: {
            type: String,
            required: true,
          },
        },
        hooks: {
          onUpdate() {
            this.name = 'new';
          },
        },
      });
      let instance = new Model({
        name: 'test',
      });
      return expect(instance.save().then(instance.update.bind(instance)))
        .to.eventually.have.property('name', 'new');
    });

    it('should run an "update" hook function', () => {
      let Model = kudu.createModel('hookTest', {
        properties: {
          name: {
            type: String,
            required: true,
          },
        },
        hooks: {
          onUpdate: [
            function () { this.name = '1'; },
            function () { this.name = '2'; },
          ],
        },
      });
      let instance = new Model({
        name: 'test',
      });
      return expect(instance.save().then(instance.update.bind(instance)))
        .to.eventually.have.property('name', '2');
    });

    it('should fail when the model is invalid', () => {
      let instance = new Model();
      return expect(instance.update()).to.be.rejectedWith(Error, /required/);
    });

    it('should return the updated instance', () => {
      return expect(instance.update()).to.eventually.become(instance);
    });
  });

  describe('#delete', () => {

    let Model;

    beforeEach(() => {
      Model = kudu.createModel('test', {
        properties: {
          name: {
            type: String,
            required: true,
          },
        },
      });
    });

    it('should return a promise', () => {
      let instance = new Model({ type: 'test', name: 'test' });
      expect(instance.delete()).to.be.an.instanceOf(Promise);
    });

    it('should return the deleted instance', () => {
      let instance = new Model({ type: 'test', name: 'test' });
      expect(instance.delete()).to.be.eventually.become(instance);
    });
  });

  describe('#link', () => {

    let Model;
    let Child;
    let Child2;
    let Inverse;

    beforeEach(() => {
      Child = kudu.createModel('child', {
        properties: {
          name: {
            type: String,
            required: true,
          },
        },
        relationships: {
          deep: { type: 'child2' },
          deeps: { type: 'child2', hasMany: true },
        },
      });
      Child2 = kudu.createModel('child2', {
        properties: {
          name: {
            type: String,
            required: true,
          },
        },
      });
      Inverse = kudu.createModel('inverse', {
        properties: {
          name: {
            type: String,
            required: true,
          },
        },
        relationships: {
          test: { type: 'test' },
        },
      });
      Model = kudu.createModel('test', {
        properties: {
          name: {
            type: String,
            required: true,
          },
        },
        relationships: {
          children: { type: 'child', hasMany: true },
          child: { type: 'child2' },
          inverses: { type: 'inverse', hasMany: true, inverse: 'test' },
        },
      });
    });

    it('should return a promise', () => {
      let instance = new Model({ type: 'test', name: 'test', children: [ '1' ] });
      expect(instance.link('children')).to.be.an.instanceOf(Promise);
    });

    it('should resolve to the instance', () => {
      let instance = new Model({ type: 'test', name: 'test', children: [ '1' ] });
      return expect(instance.link('children')).to.become(instance);
    });

    it('should attach a related model instance to the instance', () => {
      return new Child2({ id: '1', name: 'test' }).save()
      .then(() => {

        let instance = new Model({ type: 'test', name: 'test', child: '1' });
        return instance.link('child').then(( instance ) => {
          expect(instance.child).to.be.an.instanceOf(Child2);
        });
      });
    });

    it('should attach an array of related model instances to the instance', () => {
      new Child({ id: '1', name: 'test' }).save();
      let instance = new Model({ type: 'test', name: 'test', children: [ '1' ] });
      return instance.link('children').then(( instance ) => {
        expect(instance.children[ 0 ]).to.be.an.instanceOf(Child);
      });
    });

    it('should attach inverse-related instances to the instance', () => {
      let instance = new Model({ id: '1', name: 'test' });
      new Inverse({ id: '2', test: '1', name: 'inverse' }).save();
      return instance.link('inverses').then(( instance ) => {
        expect(instance.inverses[ 0 ]).to.be.an.instanceOf(Inverse);
      });
    });

    it('should attach deeply nested instances', () => {
      new Child2({ id: '1', name: 'deep' }).save();
      new Child({ id: '2', name: 'child', deep: '1' }).save();
      let instance = new Model({ type: 'test', name: 'test', children: [ '2' ] });
      return instance.link('children.deep').then(( instance ) => {
        expect(instance.children[ 0 ].deep).to.be.an.instanceOf(Child2);
      });
    });

    it('should attach an array of deeply nested instances', () => {
      new Child2({ id: '1', name: 'deep' }).save();
      new Child2({ id: '2', name: 'deep2' }).save();
      new Child({ id: '3', name: 'child', deeps: [ '1', '2' ] }).save();
      let instance = new Model({ type: 'test', name: 'test', children: [ '3' ] });
      return instance.link('children.deeps').then(( instance ) => {
        expect(instance.children[ 0 ].deeps[ 1 ]).to.be.an.instanceOf(Child2);
      });
    });
  });

  describe('#toJSON', () => {

    let Model;
    let instance;

    beforeEach(() => {
      Model = kudu.createModel('test', {
        properties: {
          name: {
            type: String,
            required: true,
          },
        },
      });
      instance = new Model({ type: 'test', name: 'test' });
    });

    it('should remove the reference to the Kudu app from the instance', () => {
      expect(instance.toJSON()).not.to.have.property('app');
    });

    it('should allow serialisation of the resulting object', () => {
      expect(JSON.stringify(instance.toJSON())).to.be.a('string');
    });

    it('should not affect the original instance', () => {
      instance.toJSON();
      expect(instance).to.have.property('app');
    });
  });
});
