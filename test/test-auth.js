'use strict';

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var sinon = require('sinon');
var async = require('async');
var path = require('path');

chai.use(require('chai-connect-middleware'));

describe('Testing authentication module.', function describeAuthentication() {
    var authentication;
    var Token;

    it('Should be in ./lib/authentication', function describeAuthentication_1() {
        authentication = require(path.resolve('lib/authentication'));
    })

    describe('Methods', function describeMethods() {
        describe('# init(options)', function describeInit() {
            var options;

            function init() {
                authentication.init(options);
            }

            it('Should raise error for null secretKey', function() {
                options = {};
                assert.throws(init);
            })

            it('Should raise error for short secret Key, min_length = 6', function() {
                options = {
                    secretKey: 'short'
                };
                assert.throws(init);
            })

            it('Should not raise error when secretKey.length > 6', function() {
                options = {
                    secretKey: 'the_good_secret_key'
                };
                assert.ok(init);
            })

            it('Should raise error for bad algorithm', function() {
                options = {
                    secretKey: 'the_good_secret_key',
                    algorithm: 'salam'
                };
                assert.throws(init);
            })

            it('Should not raise error for a good algorithm', function() {
                options = {
                    secretKey: 'the_good_secret_key',
                    algorithm: 'HS256'
                };
                init();
            })

            it('Should create the token model in mongoose.', function() {
                Token = require('mongoose').model('token');
                assert.ok(Token);
            })
        })

        describe('# login(userKey, roles, info, revokeOther, callback)', function describeLogin() {
            before(function(done) {
                Token.remove(done);
            });
            after(function(done) {
                Token.remove(done);
            });

            it('Should raise error when userKey is empty', function(done) {
                authentication.login('', 'roles', {}, true, function(error, token) {
                    assert.ok(error);
                    done();
                })
            })

            it('Should raise error when roles is empty', function(done) {
                authentication.login('userKey', '', {}, true, function(error, token) {
                    assert.ok(error);
                    done();
                })
            })

            var token1;
            it('Should generate a new token for the given user and given roles', function(done) {
                var userInfo = {
                    name: 'jafar'
                };

                authentication.login('userKey', 'roles', userInfo, true, function(error, token) {
                    if (error)
                        throw error;

                    assert.ok(token, 'token is empty or null.');
                    Token.findByToken(token.token, function(error, findedToken) {
                        if (error)
                            throw error;

                        assert.ok(findedToken);

                        assert.isFalse(findedToken.isRevoked, 'findedToken.isRevoked != true');
                        assert.isFalse(findedToken.isExpired(), 'findedToken.isRevoked != true');

                        token1 = findedToken.token;
                        done();
                    });
                });
            })

            it('Should revoke previuse generated token if revokeOther is true.', function(done) {
                authentication.login('userKey', 'roles', null, true, function(error, token) {
                    if (error)
                        throw error;

                    assert.ok(token, 'generated token is null');
                    Token.findByToken(token1, function(error, findedToken) {
                        if (error)
                            throw error;

                        assert.ok(findedToken, 'finded Token is empty');
                        assert(findedToken.isRevoked, 'findedToken.isRevoked != true');
                        done();
                    })
                })
            })

            it('Should not raise error for not passing info or revokeOther', function(done) {
                authentication.login('userKey', 'roles', function(error, token) {
                    assert.notOk(error, 'error is not null');
                    assert.ok(token, 'token is null');
                    done();
                });
            })
        })

        describe('# authenticate(req, res, next)', function() {
            var token;
            before(function(done) {
                authentication.login('userKey', 'admin', function(error, generatedToken) {
                    if (error)
                        throw error;
                    token = generatedToken.token;
                    done();
                });
            })

            after(function(done) {
                Token.remove(done);
            })

            it('Should contain authentication property.', function(done) {
                var req, res;

                req = {
                    query: {
                        token: token
                    }
                };

                authentication.authenticate(req, res, function(error) {
                    assert.notOk(error);
                    assert.ok(req.authentication);
                    done();
                });
            })

            it('Should do nothing for invalid token', function(done) {
                var req, res;
                req = {
                    query: {
                        token: 'jafarian'
                    }
                };

                authentication.authenticate(req, res, function(error) {
                    assert.notOk(error);

                    assert.notOk(req.authentication);
                    done();
                });
            })

            it('Should generate token expired error for expired token', function(done) {
                var req, res;
                var req = {
                    query: {
                        token: token
                    }
                };

                var timer = sinon.useFakeTimers(Date.now());
                timer.tick(11 * 60 * 1000);

                authentication.authenticate(req, res, function(error) {
                    assert.ok(error, 'error is no ok.');
                    assert.equal(error.status, 419, 'error.status is not 419, it is ' + error.status);
                    assert.equal(error.message, 'Authentication Timeout', 'error.message is ' + error.message);
                    assert.equal(error.details, 'Token has been expired', 'error.details is ' + error.details);
                    assert.notOk(req.authentication, 'req.authentication should be empty but it is ' + req.authentication);
                    timer.restore();
                    done();
                })
            })

            it('Should generate authentication error for revoked token', function(done) {
                var req, res;
                var req = {
                    query: {
                        token: token
                    }
                };

                Token.revokeByToken(token, function(error) {
                    if (error)
                        throw error;

                    authentication.authenticate(req, res, function(error) {
                        assert.ok(error, 'error is no ok.');
                        assert.equal(error.status, 401, 'error.status is not 401, it is ' + error.status);
                        assert.equal(error.message, 'Unauthorized', 'error.message is ' + error.message);
                        assert.equal(error.details, 'You need authentication for the current request', 'error.details is ' + error.details);
                        assert.notOk(req.authentication, 'req.authentication should be empty but it is ' + req.authentication);
                        done();
                    });
                });
            })
        })

        describe('# logout(revokeAll)', function() {
            var token;
            var token1;
            var token2;

            before(function(done) {
                authentication.login('userKey', 'admin', function(error, generatedToken) {
                    if (error)
                        throw error;

                    token = generatedToken.token;
                    authentication.login('userKey', 'admin', function(error, generatedToken) {
                        if (error)
                            throw error;

                        token1 = generatedToken.token;
                        authentication.login('userKey', 'admin', function(error, generatedToken) {
                            if (error)
                                throw error;

                            token2 = generatedToken.token;
                            done();
                        });
                    });
                });
            })

            after(function(done) {
                Token.remove(done);
            });

            it('Should revoke the current token if revokeAll is false', function(done) {
                var req, res;
                req = {
                    query: {
                        token: token
                    }
                }

                authentication.authenticate(req, res, function(error) {
                    if (error)
                        throw error;

                    authentication.logout(false)(req, res, function(error) {
                        assert.notOk(error, 'logout should not raise error');

                        authentication.authenticate(req, res, function(error) {
                            assert.ok(error, 'error should not be empty');
                            assert.equal(error.status, 401);
                            assert.notOk(req.authentication, 'req.authentication should be empty');
                            done();
                        })
                    })
                })
            })

            it('Should not revoke the other tokens if revokeAll is false', function(done) {
                var req, res;
                req = {
                    query: {
                        token: token1
                    }
                }

                authentication.authenticate(req, res, function(error) {
                    if (error)
                        throw error;

                    assert.ok(req.authentication, 'req.authentication should not be empty');
                    done();
                })
            })

            it('Should revoke the other tokens if revokeAll is true', function(done) {
                var req, res;
                req = {
                    query: {
                        token: token1
                    }
                }

                authentication.authenticate(req, res, function(error) {
                    if (error)
                        throw error;

                    authentication.logout(true)(req, res, function(error) {
                        assert.notOk(error, 'logout should not raise error');

                        authentication.authenticate(req, res, function(error) {
                            assert.ok(error, 'error should not be empty');
                            assert.equal(error.status, 401);
                            assert.notOk(req.authentication, 'req.authentication should be empty');

                            Token.findByToken(token2, function(error, findedToken) {
                                if (error)
                                    throw error;

                                assert.isTrue(findedToken.isRevoked, 'isRevoked is not true');
                                done();
                            })
                        })
                    })
                })
            })
        })

        describe('# revoke(userKey)', function() {
            before(function(done) {
                authentication.login('userKey', 'roles', function(error) {
                    if (error)
                        throw error;
                    authentication.login('userKey', 'roles', function(error) {
                        if (error)
                            throw error;
                        done();
                    });
                });
            })
            after(function(done) {
                Token.remove(done);
            })

            it('Should revoke all the users tokens', function(done) {
                authentication.revoke('userKey', function(error) {
                    if (error)
                        throw error;

                    Token.findByUserKey('userKey', function(error, tokens) {
                        if (error)
                            throw error;

                        for (var i = tokens.length - 1; i >= 0; i--)
                            assert(tokens[i].isRevoked, 'tokens[' + i + '] is not revoked!');

                        done();
                    });
                });
            })
        })

        describe('# authorize(requiredRoles)', function() {
            var token;
            before(function(done) {
                authentication.login('userKey', ['admin', 'manager-at-123456789'], function(error, generatedToken) {
                    token = generatedToken.token;
                    done();
                });
            })

            after(function(done) {
                Token.remove(done);
            })

            it('Should generate not authentication error for not authenticated request', function(done) {
                var req = {},
                    res;
                authentication.authenticate(req, res, function(error) {
                    if (error)
                        throw error;

                    authentication.authorize('admin')(req, res, function(error) {
                        assert.ok(error, 'error should not be empty.');
                        assert.equal(error.status, 401, 'error.status should be 401');
                        done();
                    })
                })
            })

            it('Should generate not forbidden error for not authorized requests', function(done) {
                var req, res;
                req = {
                    query: {
                        token: token
                    }
                }

                authentication.authenticate(req, res, function(error) {
                    if (error)
                        throw error;

                    authentication.authorize('fucker')(req, res, function(error) {
                        assert.ok(error, 'error should not be empty.');
                        assert.equal(error.status, 403, 'error.status should be 401');
                        done();
                    })
                })
            })

            it('Should not generate error for simple role authorized requests', function(done) {
                var req, res;
                req = {
                    query: {
                        token: token
                    }
                }

                authentication.authenticate(req, res, function(error) {
                    if (error)
                        throw error;

                    authentication.authorize('admin')(req, res, function(error) {
                        assert.notOk(error, 'error should be empty.');
                        done();
                    })
                })
            })

            it('Should not generate error for compelex authorized requests', function(done) {
                var req, res;
                req = {
                    query: {
                        token: token
                    },
                    params: {
                        businessId: '123456789'
                    }
                }

                authentication.authenticate(req, res, function(error) {
                    if (error)
                        throw error;

                    authentication.authorize('manager-at-{{:businessId}}')(req, res, function(error) {
                        assert.notOk(error, 'error should be empty.');
                        done();
                    })
                })
            })

            it('Should not generate error not authorized error for compelex not authorized requests', function(done) {
                var req, res;
                req = {
                    query: {
                        token: token
                    },
                    params: {
                        businessId: '123456789467899'
                    }
                }

                authentication.authenticate(req, res, function(error) {
                    if (error)
                        throw error;

                    authentication.authorize('manager-at-{{:businessId}}')(req, res, function(error) {
                        assert.ok(error, 'error should be empty.');
                        assert.equal(error.status, 403, 'error.status should be 403');
                        done();
                    })
                })
            })

        })
    })
})