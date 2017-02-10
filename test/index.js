'use strict';
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
require("reflect-metadata");
const should = require("should");
const assert = require("assert");
const di_1 = require("@molecuel/di");
const core_1 = require("@molecuel/core");
const mongodb_1 = require("@molecuel/mongodb");
const dist_1 = require("../dist");
should();
let config = {
    molecuel: {
        database: {
            name: 'mongodb_pers',
            type: 'MlclMongoDb',
            uri: 'mongodb://localhost/mongodb_persistence_test',
            layer: dist_1.PERSISTENCE_LAYER
        },
        databases: [{
                name: 'mongodb_popul',
                type: 'MlclMongoDb',
                uri: 'mongodb://localhost/mongodb_population_test',
                layer: dist_1.POPULATION_LAYER
            }, {
                name: 'failing_db',
                type: 'MlclMongoDb',
                url: 'not_an_actual_url',
                layer: dist_1.POPULATION_LAYER
            }]
    }
};
describe('MlclDatabase', function () {
    before(() => {
        di_1.di.bootstrap(core_1.MlclCore, mongodb_1.MlclMongoDb);
    });
    let dbHandler;
    describe('startup', () => {
        it('should be possible to load the database config', () => {
            try {
                dbHandler = di_1.di.getInstance('MlclDatabase', config);
                assert(dbHandler);
                dbHandler.should.be.instanceOf(dist_1.MlclDatabase);
                dbHandler.addDatabasesFrom(config);
                dbHandler._databases.should.be.an.Array();
                dbHandler._databases.length.should.be.above(0);
            }
            catch (error) {
                should.not.exist(error);
            }
        });
        it('should be possible to initialize all configured Database interfaces', () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield dbHandler.init();
            }
            catch (error) {
                should.not.exist(error);
            }
        }));
        it('should be possible to access the database connections', () => {
            try {
                let connections = dbHandler.connections;
                should.exist(connections);
                (dbHandler.connections).should.be.an.Array();
                connections.length.should.be.above(0);
            }
            catch (error) {
                should.not.exist(error);
            }
        });
    });
    describe('interaction', () => __awaiter(this, void 0, void 0, function* () {
        let Car = class Car {
            get collection() { return 'cars'; }
        };
        Car = __decorate([
            di_1.injectable
        ], Car);
        let car = di_1.di.getInstance('Car');
        car.id = 1;
        car.make = 'C4';
        car.engine = 'V6';
        car.gearbox = '5gear';
        let engine = {
            get collection() { return 'engines'; },
            id: car.engine,
            cylinders: parseInt(car.engine.slice(-1))
        };
        let gearbox = {
            get collection() { return 'transmissions'; },
            id: car.gearbox,
            gears: parseInt(car.gearbox.slice(0, 1))
        };
        try {
            yield dbHandler.populationDatabases.save(engine);
            yield dbHandler.populationDatabases.save(gearbox);
        }
        catch (error) { }
        it('should not store data in persistence layer (no collection)', () => __awaiter(this, void 0, void 0, function* () {
            try {
                let response = yield dbHandler.persistenceDatabases.save({ _id: 2, make: 'B8' });
                should.not.exist(response);
            }
            catch (error) {
                should.exist(error);
            }
        }));
        it('should be possible to store data in persistence layer', () => __awaiter(this, void 0, void 0, function* () {
            try {
                let response = yield dbHandler.persistenceDatabases.save(car);
                should.exist(response);
            }
            catch (error) {
                should.not.exist(error);
            }
        }));
        it('should not read data from the persistence layer (no collection)', () => __awaiter(this, void 0, void 0, function* () {
            try {
                let response = yield dbHandler.persistenceDatabases.find({ _id: car.id }, undefined);
                should.not.exist(response);
            }
            catch (error) {
                should.exist(error);
            }
        }));
        it('should be possible to read data from the persistence layer', () => __awaiter(this, void 0, void 0, function* () {
            try {
                let response = yield dbHandler.persistenceDatabases.find({ _id: car.id }, car.collection);
                should.exist(response);
            }
            catch (error) {
                should.not.exist(error);
            }
        }));
        it('should fail to populate', () => __awaiter(this, void 0, void 0, function* () {
            let response;
            let errorObj = { engines: ['V2', 'V4'] };
            try {
                response = yield dbHandler.populationDatabases.populate(errorObj, ['engines'], ['engines']);
                should.not.exist(response);
            }
            catch (error) {
                should.exist(error);
                assert(error.engines && error.engines === errorObj.engines);
            }
            let partialErrorObj = { primaryEngine: 'V8', backupEngine: 'V6' };
            try {
                response = yield dbHandler.populationDatabases.populate(partialErrorObj, ['primaryEngine', 'backupEngine'], ['engines', 'engines']);
                should.not.exist(response);
            }
            catch (error) {
                should.exist(error);
                assert(error.primaryEngine && error.primaryEngine === partialErrorObj.primaryEngine);
            }
        }));
        it('should be possible to populate data', () => __awaiter(this, void 0, void 0, function* () {
            let response;
            try {
                response = yield dbHandler.populationDatabases.populate(car, undefined, undefined);
                should.exist(response);
                response = yield dbHandler.populationDatabases.populate({ engines: ['V6', 'V6'] }, ['engines'], ['engines']);
                should.exist(response);
                response = yield dbHandler.populationDatabases.populate(car, ['engine', 'gearbox'], ['engines', 'transmissions']);
                should.exist(response);
                car = response;
            }
            catch (error) {
                should.not.exist(error);
            }
        }));
        it('should be possible to store and populate data in the population layer', () => __awaiter(this, void 0, void 0, function* () {
            try {
                let response = yield dbHandler.populationDatabases.save(car);
                should.exist(response);
            }
            catch (error) {
                should.not.exist(error);
            }
        }));
        it('should be possible to read data from the population layer', () => __awaiter(this, void 0, void 0, function* () {
            try {
                let response = yield dbHandler.populationDatabases.find({ _id: car.id }, car.collection);
                should.exist(response);
            }
            catch (error) {
                should.not.exist(error);
            }
        }));
    }));
});
