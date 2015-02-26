var chai = require('chai')
var assert = chai.assert
var expect = chai.expect
var should = chai.should()
var sinon = require('sinon')

var configs = require('./../lib/configs')

configs.init({
  secret: 'salamolaghe aziz',
  mongoose: {
    uri: 'mongodb://127.0.0.1:27000/authentication'
  },
  expirationTime: 10
})

describe('Testing models module in authentication module', function() {
  it('Models module should be in "models" folder', function() {
    assert(require('./../models'))
  })

  describe('MODELS', function() {
    var models = require('./../models')

    it('Should register a "token" model in mognoose', function() {
      var TokenModel = require('mongoose').model('token')
      assert(TokenModel, '"token" model is not registered in mongoose')
    })

    it('Models.Token should exists', function() {
      assert(models.Token, 'models.Token is not defined')
    })

    describe('TOKEN', function() {
      var Token = models.Token

      beforeEach(function(done) {
        Token.remove({}, done)
      })

      it('Should generate a new random token', function(done) {
        var tokenA = new Token({
          token: 'token',
          userKey: 'userKey',
          roles: 'admin'
        })

        tokenA.save(function(error, token) {
          assert(!error, 'should not rase error!')
          assert(token.token !== 'token', 'new random token should not be the same as given token!')
          done()
        })
      })

      it('userKey is required', function(done) {
        var tokenA = new Token({
          token: 'token',
          roles: 'roles'
        })
        tokenA.save(function(error, token) {
          assert(error, 'saving token without userKey should rase error!')
          assert(!token, 'returned token object is not undefiend!')
          done()
        })
      })

      it('roles is required', function(done) {
        var tokenA = new Token({
          token: 'token',
          userKey: 'userKey'
        })

        tokenA.save(function(error, token) {
          assert(error, 'saving token without roles should rase error!')
          assert(!token, 'returned token object is not undefiend!')
          done()
        })
      })

      it('roles should be array', function(done) {
        var tokenA = new Token({
          token: 'token',
          userKey: 'userKey',
          roles: 'roles'
        })

        tokenA.save(function(error, token) {
          assert(!error, 'saving should not rase error!')
          assert(token.roles instanceof Array, 'roles is not array')
          done()
        })
      })

      it('loginAt should be now', function() {
        var now = Date.now()
        var tokenA = new Token({
          token: 'token',
          userKey: 'userKey',
          roles: 'admin'
        })

        var dif = tokenA.loginAt - now
        assert(dif > -1000, 'different is ' + dif)
        assert(dif < 1000, 'different is ' + dif)
      })

      it('expireAt should be for next 10 minutes', function() {
        var now = Date.now()
        var tokenA = new Token({
          token: 'token',
          userKey: 'userKey',
          roles: 'admin'
        })

        tokenA.save(function(error, token) {
          var dif = tokenA.expireAt - now
          assert(dif > configs.getExpirationTime() - 1000, 'different is ' + dif)
          assert(dif < configs.getExpirationTime() + 1000, 'different is ' + dif)
        })
      })

      describe('PUBLIC METHODS', function() {
        var token
        beforeEach(function(done) {
          token = new Token({
            token: 'salam',
            userKey: 'userKey',
            roles: 'roles'
          })
          token.save(done)
        })

        describe('# extendExpirationTime', function() {
          it('Should extend expireAt for 10 minutes', function() {
            var expTime = token.expireAt

            token.extendExpirationTime()
            var newExpTime = token.expireAt

            var dif = newExpTime - expTime
            assert(dif === configs.getExpirationTime())
          })
        })

        describe('# isExpired', function() {
          it('Should return false for now', function() {
            assert(token.isExpired() === false)
          })
          it('Should return true after 10 mitunes now', function() {
            var timer = sinon.useFakeTimers(Date.now());
            timer.tick(configs.getExpirationTime());
            assert(token.isExpired() === true)
            timer.restore()
          })
        })

        describe('# revoke', function() {
          it('Should set isRevoked true', function() {
            token.revoke(function(error) {
              if (error)
                throw error

              assert(token.isRevoked === true)
            })
          });
        });
      });

      describe("PUBLIC STATIC METHODS", function() {
        describe("# generateToken", function() {
          var token;

          beforeEach(function(done) {
            Token.generateToken('fuck', 'manager', 'me', false, function(error, result) {
              if (error)
                throw error;

              token = result;
              done();
            });
          });

          it('Should generate a new token and save it to database.', function() {
            assert(typeof token === 'string', 'type of token is ' + typeof token);
          });

          it('There should be only one token.', function() {
            var query = {
              token: token
            };
            
            Token.find(query, function(error, tokens) {
              if (error)
                throw error;
              assert(tokens.length === 1, 'there are ' + tokens.length + ' with the token ' + token + '. ')
            });
          });
        });
      });
    });
  });
});