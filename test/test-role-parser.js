'use strict';

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var sinon = require('sinon');
var async = require('async');

describe('Testing role-parser module in authentication module.', function describeRoleParser() {
    var roleParser;
    it('Should be in ./lib/role-parser', function describeRoleParser_1() {
        roleParser = require('./../lib/role-parser');
    })

    describe('Methods', function describeMethods() {
        describe('# parseRole(role, req)', function describeParserRole() {
            it('Should return if role if is null or not string', function() {
                // check null value
                var parsedRole = roleParser.parseRole(null);
                assert.isNull(parsedRole);

                // check not string value
                var role = {
                    'jafar': 'true'
                };
                parsedRole = roleParser.parseRole(role);
                assert.equal(role, parsedRole);
            })

            it('Should return the role if it does not contain "{{"', function() {
                var role = 'manager';

                var parsedRole = roleParser.parseRole(role);
                assert.equal(role, parsedRole);
            })

            it('Should return the role it does not contain "}}" for example "manager{{" or "}}manager{{"', function() {
                var role = 'manager{{';
                var parsedRole = roleParser.parseRole(role);
                assert.equal(role, parsedRole);

                var role = '}}manager{{';
                var parsedRole = roleParser.parseRole(role);
                assert.equal(role, parsedRole);
            })

            it('Should return the role if contains {{VARIABLE}} which variable does not start with "?" or ":"', function() {
                var role = 'manager-at-{{SALAM}}';
                var parsedRole = roleParser.parseRole(role);
                assert.equal(role, parsedRole);
            })

            it('Should return req.params.businessId for the role {{:businessId}}', function() {
                var req = {};
                req.params = {};
                req.params.businessId = 'salam';

                var role = '{{:businessId}}';
                var parsedRole = roleParser.parseRole(role, req);
                assert.equal(req.params.businessId, parsedRole);
            })

            it('Should return req.query.businessId for the role {{?businessId}}', function() {
                var req = {};
                req.query = {};
                req.query.businessId = 'salam';

                var role = '{{?businessId}}';
                var parsedRole = roleParser.parseRole(role, req);
                assert.equal(req.query.businessId, parsedRole);
            })
        })
    })
})