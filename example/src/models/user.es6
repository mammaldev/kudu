import bcrypt from 'bcrypt';

export default ( app ) => {

  const INHERIT_FROM = 'base';

  let User = app.createModel('user', {
    properties: {
      firstName: {
        type: 'string',
        required: true
      },
      lastName: {
        type: 'string',
        required: true
      },
      password: {
        type: 'string',
        public: false
      }
    }
  }, INHERIT_FROM);

  User.prototype.toString = () => `${ firstName } ${ lastName }`;
};
