const config = require('./config');

const { MongoClient, ObjectID } = require('../src/lib');

describe('source/middleware/mongo/util/getTenantCollectionObject.js #fast #integration', function () {

    let client;
    let collection;
    let altCollection;

    before('init', async () => {
        client = await new MongoClient(config.uri, config.options).connect();

        collection = client.db().collection('test2').setTenant('myTenant');
        altCollection = client.db().collection('test2').setTenant('Another tenant');
    });
    after('done', async () => {
        await client.close();
    });

    describe('runs the tests', function () {
        describe('aggregate and return array of documents', () => {
            before('clear', async () => {
                await client.db().dropCollection('test2');
            });

            it('should contains documents without _tenant', function (done) {
                collection.insert(
                    [
                        { dummy: 'I am a dummmy #1.1', testOfAggregation: true },
                        { dummy: 'I am a dummmy #1.2', testOfAggregation: true },
                        { dummy: 'I am a dummmy #1.3', testOfAggregation: true }
                    ],
                    { safe: true },
                    getInsertedDocument
                );

                function getInsertedDocument(err) {
                    if (err) {
                        return done(err);
                    }
                    collection.aggregate([{ $match: { testOfAggregation: true } }], {}, verify);
                }

                function verify(err, cursor) {
                    if (err) {
                        return done(err);
                    }

                    cursor.toArray((err, docs) => {
                        if (err) {
                            return done(err);
                        }

                        expect(docs)
                            .to.be.an('array')
                            .to.have.lengthOf(3);

                        docs.forEach(function (doc) {
                            expect(doc._tenant).to.not.exist;
                        });

                        done();
                    });
                }
            });
        });

        describe('when aggregate and return cursor', function () {
            before('clear', async () => {
                await client.db().dropCollection('test2');
            });

            before('create dummy data', (done) => {
                collection.insert(
                    [
                        { dummy: 'I am a dummmy #2.1', testOfAggregation: true },
                        { dummy: 'I am a dummmy #2.2', testOfAggregation: true },
                        { dummy: 'I am a dummmy #2.3', testOfAggregation: true }
                    ],
                    { safe: true },
                    getInsertedDocument
                );

                function getInsertedDocument(err) {
                    done(err);
                }
            });

            it('will fetch like stream and each document will have no _tenant field', function (done) {
                collection.aggregate([{ $match: { testOfAggregation: true } }], {}, function (err, cursor) {
                    if (err) {
                        return done(err);
                    }

                    expect(cursor)
                        .to.be.an('object')
                        .to.have.property('stream')
                        .to.be.a('function');

                    const stream = cursor.stream();

                    expect(stream).to.be.a('object');

                    let docCount = 0;

                    stream.on('data', function (doc) {
                        docCount++;
                        expect(doc._tenant).to.not.exist;
                    });
                    stream.on('end', function () {
                        expect(docCount).to.be.eql(3);
                        done();
                    });
                });
            });

            it('will fetch with [forEach] method and each doc will have no _tenant field', function (done) {
                collection.aggregate([{ $match: { testOfAggregation: true } }], {}, function (err, cursor) {
                    if (err) {
                        return done(err);
                    }

                    expect(cursor).to.be.an('object');

                    cursor.forEach(function (doc) {
                        expect(doc._tenant).to.not.exist;
                    });

                    done();
                });
            });

            it('will fetch with [next] method and each doc will have no _tenant field', function (done) {
                collection.aggregate([{ $match: { testOfAggregation: true } }], {}, function (err, cursor) {
                    if (err) {
                        return done(err);
                    }

                    expect(cursor).to.be.an('object');

                    cursor.next().then(function (doc) {
                        expect(doc._tenant).to.not.exist;
                        done();
                    });

                });
            });

            it('will fetch with [toArray] method and each doc will have no _tenant field', function (done) {
                collection.aggregate([{ $match: { testOfAggregation: true } }], {}, function (err, cursor) {
                    if (err) {
                        return done(err);
                    }

                    expect(cursor).to.be.an('object');

                    cursor.toArray().then(function (docs) {
                        expect(docs).to.be.an('array');

                        docs.forEach(function (doc) {
                            expect(doc._tenant).to.not.exist;
                        });

                        done();
                    });

                });
            });
        });

        it('will insert document with tenant', function (done) {
            collection.insert({ dummy: 'I am a dummmy #3.0' }, { safe: true }, (err, res) => {
                if (err) {
                    return done(err);
                }

                const id = new ObjectID(res.ops[0]._id.toString());

                collection.findOne({ _id: id }, { includeTenant: true }, verify);
            });

            function verify(err, doc) {
                if (err) {
                    return done(err);
                }

                expect(doc._tenant).to.equal('myTenant');
                done();
            }
        });
    });

    it('will not return _tenant when insert a document', function (done) {
        collection.insert({ dummy: 'I am a dummmy #4.0' }, { safe: true }, verify);

        function verify(err, doc) {
            if (err) {
                return done(err);
            }
            expect(doc._tenant).to.not.be.ok;
            done();
        }
    });

    it('will not return _tenant when insert - Array of 3 documents is inserted to the same tenant', function (done) {
        const docs = [
            { dummy: 'I am a dummmy #5.1' },
            { dummy: 'I am a dummmy #5.2' },
            { dummy: 'I am a dummmy #5.3' }
        ];

        collection.insert(
            docs,
            { safe: true },
            verify
        );

        function verify(err) {
            if (err) {
                return done(err);
            }

            expect(docs[0]._tenant).to.not.be.ok;
            expect(docs[1]._tenant).to.not.be.ok;
            expect(docs[2]._tenant).to.not.be.ok;

            done();
        }
    });

    it('will insert 2 different documents in the same tenant', function (done) {
        const doc1 = { dummy: 'I am a dummmy #6' };

        collection.insert(doc1, { safe: true }, verify);

        function verify(err) {
            if (err) {
                return done(err);
            }

            const doc2 = { dummy: 'I am a dummmy #7' };

            altCollection.insert(doc2, { safe: true }, function (err) {
                if (err) {
                    return done(err);
                }
                expect(doc1).to.not.equal(doc2);
                done();
            });
        }
    });

    it('will not return _tenant when save', function (done) {
        const doc = { name: 'document to save' };
        collection.save(doc, verify);

        function verify(err) {
            if (err) {
                return done(err);
            }
            expect(doc._tenant).to.not.be.ok;
            done();
        }
    });

    // it('will fail if we try to set the property "_tenant" on the document', function (done) {
    //     collection1.update({}, { $set: { _tenant: 'thisShouldFail' } }, { safe: true }, verify);

    //     function verify(err, doc) {
    //         expect(err).to.be.ok;
    //         done();
    //     }
    // });

    it('will overwrite the tenant if we try to save a document with the property "_tenant"', function (done) {
        collection.remove({}, { safe: true }, function (err) {
            if (err) {
                return done(err);
            }
            collection.update({}, { $set: { _tenant: 'thisShouldBeOverwritten', id: 'myTest' } }, { safe: true }, verify);
        });

        function verify(err, doc) {
            if (err) {
                return done(err);
            }
            expect(doc._tenant).to.not.equal('thisShouldBeOverwritten');
            done();
        }
    });

    it('will remove all documents for a tenant', function (done) {
        collection.remove({}, { safe: true }, verify);

        function verify(err) {
            expect(err).to.be.not.ok;
            done();
        }
    });

    it('will find no document with findOne after all documents have been removed', function (done) {
        collection.remove({}, { safe: true }, function (err, res) {
            if (err) {
                return done(err);
            }
            collection.findOne({}, verify);
        });

        function verify(err, doc) {
            expect(err).to.be.not.ok;
            expect(doc).to.be.not.ok;
            done();
        }
    });

    it('will find a document with findOne after one has been inserted', function (done) {
        collection.remove({}, { safe: true }, function (err) {
            if (err) {
                return done(err);
            }
            collection.insert({ id: 'findOneTest' }, { safe: true }, function (err) {
                if (err) {
                    return done(err);
                }
                collection.findOne({ id: 'findOneTest' }, verify);
            });
        });

        function verify(err, doc) {
            if (err) {
                return done(err);
            }
            expect(doc.id).to.equal('findOneTest');
            done();
        }
    });

    it('will find no document with findOne after all documents have been removed and a document has been inserted for another tenant', function (done) {
        collection.remove({}, { safe: true }, function (err) {
            if (err) {
                return done(err);
            }
            altCollection.insert({ id: 'findOneTest' }, { safe: true }, function (err) {
                if (err) {
                    return done(err);
                }
                collection.findOne({ id: 'findOneTest' }, verify);
            });
        });

        function verify(err, doc) {
            if (err) {
                return done(err);
            }
            expect(err).to.be.not.ok;
            expect(doc).to.be.not.ok;
            done();
        }
    });

    it('will find a document with findOne for tenant1 after a document has been inserted for tenant1 and all documents have been removed for tenant2', function (done) {
        collection.insert({ id: 'findOneTest' }, { safe: true }, function (err) {
            if (err) {
                return done(err);
            }
            altCollection.remove({}, { safe: true }, function (err) {
                if (err) {
                    return done(err);
                }
                collection.findOne({ id: 'findOneTest' }, verify);
            });
        });

        function verify(err, doc) {
            if (err) {
                return done(err);
            }
            expect(doc.id).to.equal('findOneTest');
            done();
        }
    });

    it('findOne - only callback - return document', function (done) {
        collection.remove({}, { safe: true }, function (err) {
            if (err) {
                return done(err);
            }
            collection.insert({ id: 'findOneTest', field: 'bar' }, { safe: true }, function (err) {
                if (err) {
                    return done(err);
                }
                collection.findOne(verify);
            });
        });

        function verify(err, doc) {
            expect(err).to.be.not.ok;
            expect(doc).to.be.ok;
            expect(doc.id).to.be.ok;
            expect(doc.field).to.be.ok;
            expect(doc._tenant).to.be.not.ok;
            done();
        }
    });

    it('findOne - with selector, callback - return document', function (done) {
        collection.remove({}, { safe: true }, function (err) {
            if (err) {
                return done(err);
            }
            collection.insert({ id: 'findOneTest' }, { safe: true }, function (err) {
                if (err) {
                    return done(err);
                }
                collection.findOne({ id: 'findOneTest' }, verify);
            });
        });

        function verify(err, doc) {
            expect(err).to.not.be.ok;
            expect(doc).to.be.ok;
            done();
        }
    });

    it('findOne - with selector, field, callback - return document', function (done) {
        collection.remove({}, { safe: true }, function (err) {
            if (err) {
                return done(err);
            }

            collection.insert({ id: 'findOneTest', field: 'bar' }, { safe: true }, function (err) {
                if (err) {
                    return done(err);
                }

                collection.findOne({ id: 'findOneTest' }, { fields: { field: 1 } }, verify);
            });
        });

        function verify(err, doc) {
            if (err) {
                return done(err);
            }

            expect(err).to.be.not.ok;
            expect(doc).to.be.ok;
            expect(doc.id).to.be.not.ok;
            expect(doc.field).to.be.ok;
            expect(doc._tenant).to.not.be.ok;
            done();
        }
    });

    it('findOne - with selector, option, callback - return document', function (done) {
        collection.remove({}, { safe: true }, function (err) {
            if (err) {
                return done(err);
            }

            collection.insert({ id: 'findOneTest', field: 'bar' }, { safe: true }, function (err) {
                if (err) {
                    return done(err);
                }

                collection.findOne({ id: 'findOneTest' }, { fields: { field: 1 } }, verify);
            });
        });

        function verify(err, doc) {
            if (err) {
                return done(err);
            }

            expect(err).to.be.not.ok;
            expect(doc).to.be.ok;
            expect(doc.id).to.be.not.ok;
            expect(doc.field).to.be.ok;
            done();
        }
    });

    it('findAndModify - _tenant is not in result', function (done) {
        collection.remove({}, { safe: true }, function (err) {
            if (err) {
                return done(err);
            }

            collection.insert({ id: 'findTestToModify', field: 'bar' }, { safe: true }, function (err) {
                if (err) {
                    return done(err);
                }

                collection.findAndModify({ id: 'findTestToModify' }, [], { $set: { id: 'findTestModified' } }, {}, verify);
            });
        });

        function verify(err, doc) {
            if (err) {
                return done(err);
            }
            expect(doc._tenant).to.not.be.ok;
            done();
        }
    });

    it('findAndRemove - _tenant is not in result', function (done) {
        collection.remove({}, { safe: true }, function (err) {
            if (err) {
                return done(err);
            }

            collection.insert({ id: 'findTestToRemove', field: 'bar' }, { safe: true }, function (err) {
                if (err) {
                    return done(err);
                }

                collection.findAndRemove({ id: 'findTestToRemove' }, {}, verify);
            });
        });

        function verify(err, doc) {
            if (err) {
                return done(err);
            }
            expect(doc._tenant).to.not.be.ok;
            done();
        }
    });

    it('find - _tenant is not in result', function (done) {
        collection.remove({}, { safe: true }, function (err) {
            if (err) {
                return done(err);
            }

            collection.insert({ id: 'findTest', field: 'bar' }, { safe: true }, function (err) {
                if (err) {
                    return done(err);
                }

                var cursor = collection.find({ id: 'findTest' });
                cursor.toArray(function (err, docs) {
                    if (err) {
                        return done(err);
                    }

                    expect(docs._tenant).to.not.be.ok;
                    done();
                });
            });
        });
    });
});