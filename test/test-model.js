var chai = require('chai')
var assert = chai.assert
var expect = chai.expect
var should = chai.should()

require('mongoose').connect('mongodb://127.0.0.1:27000/authentication')

describe('testing models module in authentication module', function() {
  it('models module should be in "models" folder', function() {
    assert(require('./../models'))
  })

  describe('models', function() {
    var models = require('./../models')

    it('should register a "token" model in mognoose', function() {
      var TokenModel = require('mongoose').model('token')
      assert(TokenModel, '"token" model is not registered in mongoose')
    })

    it('models.Token should exists', function() {
      assert(models.Token, 'models.Token is not defined')
    })

    describe('models.Token', function() {
      var Token = models.Token

      beforeEach(function(done) {
        Token.remove({}, done)
      })

      it('should generate a new random token', function(done) {
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
        assert(dif > -100, 'different is ' + dif)
        assert(dif < 100, 'different is ' + dif)
      })

      it('expireAt should be for next 10 minutes', function() {
        var now = Date.now()
        var tokenA = new Token({
          token: 'token',
          userKey: 'userKey',
          roles: 'admin'
        })

        var dif = tokenA.expireAt - now
        assert(dif > 599900, 'different is ' + dif)
        assert(dif < 600100, 'different is ' + dif)
      })

      describe('public methods', function() {
        var token = new Token({
          userKey: 'userKey',
          roles: 'roles'
        })
        describe('# extendExpirationTime', function() {
          it('should extend expireAt for 10 minutes', function() {
            var expTime = token.expireAt

            token.extendExpirationTime()
            var newExpTime = token.expireAt

            var dif = newExpTime - expTime
            assert(dif === 600000)
          })
        })
      })
    })
  })
})