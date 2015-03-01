var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var sinon = require('sinon');
var async = require('async');

describe('Testing token-generator module in authentication module.', function describeTokenGenerator() {
  var tokenGenerator;
  it('Should be in folder ./lib/token-generator', function describeTokenGenerator1(done) {
    tokenGenerator = require('./../lib/token-generator');
    assert(tokenGenerator, 'Module token-generator is not in "./../lib/token-generator"');
    done();
  })

  describe('Before Init', function describeBeforeInit() {
    describe('# generateToken', function describeBeforeInitGenerateToken() {
      it('Should raise an error', function describeBeforeInitGenerateToken_1() {
        function _generateToken() {
          tokenGenerator.generateToken('string')
        }
        assert.throws(_generateToken);
      })
    })

    describe('# isValidToken', function describeBeforeInitIsValidToken() {
      it('Should raise an error.', function describeBeforeInitIsValidToken_1() {
        function _isValidToken() {
          tokenGenerator.isValidToken('string')
        }
        assert.throws(_isValidToken);
      })
    })
  })

  describe('Init', function describeInit() {
    it('Should raise error for empty secretKey', function describeInit_1() {
      function _init_notSecretKey() {
        tokenGenerator.init('', 'salam');
      }
      assert.throws(_init_notSecretKey);
    })

    it('Should raise error for bad algorithm', function describeInit_2() {
      function _init_badAlgorithm() {
        tokenGenerator.init('salam man secret key hastam', 'salam');
      }
      assert.throws(_init_badAlgorithm);
    })

    it('should not raise error for good secret key and algorithm', function describeInit_3() {
      function _init_good() {
        tokenGenerator.init('salam man secret key hastam', 'HS256');
      }
      assert.doesNotThrow(_init_good);
    })
  })

  describe('After Init', function describeAfterInit() {
    describe('# generateToken', function describeAfterInitGenerateToken() {
      it('Should generate a unique token', function describeAfterInitGenerateToken_1() {
        var token = tokenGenerator.generateToken();
        assert.ok(token, 'token is not valid, it is ' + token);
      })
      it('Should generate unique token eachTime', function describeAfterInitGenerateToken_2() {
        var token1 = tokenGenerator.generateToken();
        var token2 = tokenGenerator.generateToken();
        assert.notEqual(token1, token2, 'tokens are equal');
      })
    })

    describe('# isValidToken', function describeAfterInitIsValidToken() {
      it('Should accept module generated token', function describeAfterInitIsValidToken_1() {
        var token = tokenGenerator.generateToken();
        var isValid = tokenGenerator.isValidToken(token);
        assert(isValid, 'generated Token is not valid.' + isValid);
      })

      it('Should not accept none-module generated token', function describeAfterInitIsValidToken_1() {
        var isValid = tokenGenerator.isValidToken('jafarian');
        assert.notOk(isValid, 'generated Token is not valid.' + isValid);
      })
    })
  })
})