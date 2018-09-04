const chai = require('chai');
const sinonChai = require('sinon-chai');

global.chai = chai;
global.expect = chai.expect;

chai.use(sinonChai);
