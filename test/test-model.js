var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var sinon = require('sinon');
var async = require('async');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27000/authentication');

describe('Testing models module in authentication module.', function() {
  var models;
  it('Models module should be in ./models/ folder.', function() {
    models = require('./../models/');
    assert(models, 'Models is not in ./models/ folder.');
  })

  describe('Models', function() {
    var Token;
    it('Models should contain "token" models.', function() {
      Token = models.Token;
      assert(Token, '"Token" is not in models.')
    })

    describe('Token', function describeToken() {
      function saveToken(token, userKey, roles) {
        return function innerSaveToken(cb) {
          new Token({
            token: token,
            userKey: userKey,
            roles: roles
          }).save(function(error, token) {
            return cb(error, token);
          })
        }
      }

      function revokeToken(token, cb) {
        return token.revoke(function(error, token) {
          return cb(error, token);
        });
      }

      describe('Specifications', function describeSpecifications() {
        before(function(done) {
          Token.remove({}, done);
        })

        afterEach(function(done) {
          Token.remove({}, done);
        })


        it('Token.token is required.', function(done) {
          saveToken(undefined, 'user', 'role')(function(error) {
            assert(error, 'An error should be raised for empty token.');
            done();
          })
        })

        it('Token.token should be unique.', function(done) {
          async.series([saveToken('token', 'user', 'role'), saveToken('token', 'user', 'role')], function(error, token2) {
            assert(error, 'An error should be raised for duplicate token.');
            done();
          })
        })

        it('Token.userKey is required.', function(done) {
          saveToken('token', null, 'role')(function(error) {
            assert(error, 'An error should be raised for empty userKey');
            done();
          });
        })

        it('Token.roles is required.', function(done) {
          saveToken('token', 'user', undefined)(function(error) {
            assert(error, 'An error should be raised for not string array roles');
            done();
          });
        })

        it('Token.expireAt shoudl be now.', function(done) {
          var now = Date.now();
          saveToken('token', 'user', 'role')(function(error, token) {
            assert(token.expireAt < now + 1000, 'expireAt - now is ' + (token.expireAt - now) + '.');
            assert(token.expireAt > now - 1000, 'expireAt - now is ' + (token.expireAt - now) + '.');
            done();
          });
        })
      })

      describe('Mothods', function describeMethods() {
        var token;
        before(function describeMethodsBefore(done) {
          saveToken('token', 'user', 'role')(function(error, result) {
            if (error)
              throw error;
            token = result;
            done();
          })
        })

        describe('# revoke(callback)', function describeRevoke() {
          it('isRevoked initially should be false', function(done) {
            assert(token.isRevoked === false, 'Initially isRevoked is not false, its ' + token.isRevoked);
            done();
          })

          it('Should set the isRevoked true.', function(done) {
            token.revoke();
            assert(token.isRevoked, 'isRevoked is not true after call revoke, its ' + token.isRevoked);
            done();
          })

          it('Should not save token if callback is null', function(done) {
            Token.findByToken('token', function(error, token) {
              if (error)
                throw error;

              if (!token)
                throw new Error('token is not saved or is not finded.');

              assert(token.isRevoked === false, 'isRevoked !== false');
              done();
            })
          })

          it('Should save the token if callback is passed.', function(done) {
            token.revoke(function(error, token) {
              if (error)
                throw error;

              Token.findByToken('token', function(error, token) {
                if (error)
                  throw error;

                if (!token)
                  throw new Error('token is not saved or is not finded.');

                assert(token.isRevoked === true, 'isRevoked !== false. its =' + token.isRevoked);
                done();
              })
            })
          })
        })

        describe('# extendExpirationTime(time, callback)', function describeExtendExpirationTime() {
          var EXTENTION_TIME = 1;
          it('Should extend expireAt for the given time', function describeExtendExpirationTime_1(done) {
            var expireAt_1 = token.expireAt;
            token.extendExpirationTime(EXTENTION_TIME);
            var expireAt_2 = token.expireAt;

            var extendedTime = expireAt_2 - expireAt_1;
            assert(extendedTime === EXTENTION_TIME);
            done();
          })

          it('Should not save if callback is null', function describeExtendExpirationTime_2(done) {
            Token.findByToken('token', function describeExtendExpirationTime_2_callback(error, result) {
              if (error)
                throw error;
              assert(result.expireAt.getTime() === token.expireAt.getTime() - EXTENTION_TIME, 'saveToken.expireAt = ' + result.expireAt + ' and notSavedToken.expireAt = ' + token.expireAt);
              done();
            })
          })

          it('Should save if callback is provided', function describeExtendExpirationTime_3(done) {
            token.extendExpirationTime(2, function describeExtendExpirationTime_extend_3_callback(error, result) {
              Token.findByToken('token', function describeExtendExpirationTime_3_callback(error, result) {
                if (error)
                  throw error;

                assert(result.expireAt.getTime() === token.expireAt.getTime(), 'saveToken.expireAt = ' + result.expireAt + ' and notSavedToken.expireAt = ' + token.expireAt);
                done();
              })
            })
          })
        })

        describe('# isExpired()', function describeIsExpired() {
          it('Should return true if its not extended.', function describeIsExpired_1(done) {
            var isExpired = token.isExpired();
            assert(isExpired, 'isExpired() should return true, it returns ' + isExpired);
            done();
          })

          it('Should return false if extend for ten minutes.', function describeIsExpired_2(done) {
            token.extendExpirationTime(10 * 60 * 1000);
            var isExpired = token.isExpired();
            assert(isExpired === false, 'isExpired() should return false, it returns ' + isExpired);
            done();
          })
        })
      })

      describe('Statics', function describeStatics() {
        before(function describeStaticsBefore(done) {
          Token.remove({}, done);
        })

        describe('# createToken', function describeStaticsCreateToken() {
          it('Should create and save a new token.', function describeStaticsCreateToken_1(done) {
            Token.createToken('token', 'userKey', 'roles', {}, 10 * 60 * 1000, false, function(error, token) {
              if (error)
                throw error;

              assert(token, 'token is not valid.');
              assert(token instanceof Token, 'returned token is not instanceof Token');
              done();
            })
          })
        })

        describe('# findByUserKey', function describeStaticsFindByUserKey() {
          it('Should find 2 tokens for the userKey = "userKey"', function describeStaticsFindByUserKey_1(done) {
            Token.createToken('token1', 'userKey', 'admin', {}, 10 * 30, false, function(error, token) {
              if (error)
                throw error;


              Token.findByUserKey('userKey', function(error, tokens) {
                if (error)
                  throw error;

                assert(tokens.length === 2, 'There is not two token!');
                done();
              })
            })
          })
        })


        describe('# findByToken', function describeStaticsFindByToken() {
          it('Should find the token saved with the token = "token".', function describeStaticsFindByToken_1(done) {
            Token.findByToken('token', function(error, findedToken) {
              if (error)
                throw error;

              assert(findedToken, 'Finded token is null!');
              assert(!findedToken.length, 'findedToken should be one instance not array.');
              assert(findedToken.token === 'token', 'should find token with the token = "token"');
              done();
            });
          })
        })

        describe('# revokeByToken', function describeStaticsRevokeByToken() {
          it('Should revoke the token with the "token = token".', function describeStaticsRevokeByToken_1(done) {
            Token.revokeByToken('token', function(error, savedToken) {
              if (error)
                throw error;

              Token.findByToken('token', function(error, findedToken) {
                if (error)
                  throw error;

                if (!findedToken)
                  throw new Error('there is not such a token.');

                assert(findedToken.isRevoked, 'findedToken.isRevoked = ' + findedToken.isRevoked);
                done();
              })
            })
          })
        })

        describe('# revokeByUserKey', function describeStaticsRevokeByUserKey() {
          it('Should revoke tokens with the "userKey = userKey".', function describeStaticsRevokeByUserKey_1(done) {
            Token.revokeByUserKey('userKey', function(error, savedToken) {
              if (error)
                throw error;

              Token.findByUserKey('userKey', function(error, findedToken) {
                if (error)
                  throw error;

                if (!findedToken)
                  throw new Error('There is no token.');

                if (findedToken.length != 2)
                  throw new Error('There should be tow tokens. But there is ' + findedToken.length);


                assert(findedToken[0].isRevoked, 'findedToken[0].isRevoked = ' + findedToken[0].isRevoked);
                assert(findedToken[1].isRevoked, 'findedToken[1].isRevoked = ' + findedToken[1].isRevoked);
                done();
              })
            })
          })
        })
      })
    })
  })
})