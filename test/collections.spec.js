// var mongodb = require('mongodb');
// var ObjectID = mongodb.ObjectID;
// var injectr = require('injectr');

// describe('source/middleware/mongo/util/getTenantCollectionObject.js #fast #integration', function () {

// 	var getStandardCollectionObject;
// 	var getTenantCollectionObject = require('../../source/util/getTenantCollectionObject');

// 	var collectionName = 'test',
// 		collection1 = null,
// 		collection2 = null;

// 	before(function (done) {
// 		var getDb = injectr('./source/util/getDb.js', {
// 			'config': {
// 				mongo: require('../mongoTestDbConfig')
// 			}
// 		});
// 		getStandardCollectionObject = injectr('./source/util/getStandardCollectionObject.js', {
// 			'./getDb.js': getDb,
// 			'./mongoCallbackDecorator': require('../../source/util/mongoCallbackDecorator.js')
// 		});
// 		getStandardCollectionObject(collectionName, '',
// 			function (err, collection) {
// 				if (err) {
// 					done(err);
// 				}
// 				getTenantCollectionObject('Tenant1', collection, function (err, tenantCollection) {
// 					if (err) {
// 						done(err);
// 					}
// 					collection1 = tenantCollection;
// 					setupCollection2(done);
// 				});
// 			}
// 		);
// 	});

// 	function setupCollection2(done) {
// 		getStandardCollectionObject(collectionName, '',
// 			function (err, collection) {
// 				if (err) {
// 					done(err);
// 				}
// 				getTenantCollectionObject('Another tenant', collection, function (err, tenantCollection) {
// 					if (err) {
// 						done(err);
// 					}
// 					collection2 = tenantCollection;
// 					done();
// 				});
// 			});

// 	}

// 	describe('runs the tests', function () {
// 		it('will fail if no tenant is specified', function (done) {
// 			getStandardCollectionObject(collectionName, '',
// 				function (err, collection) {

// 					if (err) {
// 						done(err);
// 					}
// 					getTenantCollectionObject(null, collection, function (err) {
// 						expect(err).to.be.ok;
// 						done();
// 					});
// 				});
// 		});

// 		it('will aggregate and return array of documents without _tenant', function (done) {

// 			getStandardCollectionObject(collectionName, '',
// 				function (err, collection) {
// 					if (err) {
// 						done(err);
// 					}
// 					getTenantCollectionObject('myTenant', collection, function (err, tenantCollection) {
// 						if (err) {
// 							done(err);
// 						}
// 						tenantCollection.insert(
// 							[
// 								{dummy: 'I am a dummmy #1', testOfAggregation: true},
// 								{dummy: 'I am a dummmy #2', testOfAggregation: true},
// 								{dummy: 'I am a dummmy #3', testOfAggregation: true}
// 							],
// 							{safe: true}, getInsertedDocument);
// 					});

// 					function getInsertedDocument(err, insertedObjects) {

// 						getTenantCollectionObject('myTenant', collection, function (err, tenantCollection) {
// 							if (err) {
// 								done(err);
// 							}

// 							tenantCollection.aggregate([{$match: {testOfAggregation: true}}], verify);
// 						});

// 					}
// 				});

// 			function verify(err, docs) {
// 				if (err) {
// 					return done(err);
// 				}

// 				expect(docs)
// 					.to.be.an('array')
// 					.to.have.lengthOf(3);

// 				docs.forEach(function (doc) {
// 					expect(doc._tenant).to.not.exist;
// 				});

// 				done();
// 			}
// 		});

// 		describe('when aggregate and return cursor', function () {
// 			var aggregateFunc;

// 			before(function (done) {
// 				getStandardCollectionObject(collectionName, '',
// 					function (err, collection) {
// 						if (err) {
// 							done(err);
// 						}
// 						getTenantCollectionObject('myTenant', collection, function (err, tenantCollection) {
// 							if (err) {
// 								done(err);
// 							}
// 							tenantCollection.insert(
// 								[
// 									{dummy: 'I am a dummmy #1', testOfAggregation: true},
// 									{dummy: 'I am a dummmy #2', testOfAggregation: true},
// 									{dummy: 'I am a dummmy #3', testOfAggregation: true}
// 								],
// 								{safe: true}, getInsertedDocument);
// 						});

// 						function getInsertedDocument(err, insertedObjects) {

// 							getTenantCollectionObject('myTenant', collection, function (err, tenantCollection) {
// 								if (err) {
// 									done(err);
// 								}

// 								aggregateFunc = tenantCollection.aggregate.bind(tenantCollection, [{$match: {testOfAggregation: true}}], {cursor: {}});
// 								done();
// 							});

// 						}
// 					});
// 			});

// 			after(function () {
// 				aggregateFunc = null;
// 			});

// 			it('will fetch like stream and each document will have no _tenant field', function (done) {
// 				aggregateFunc(function (err, cursor) {
// 					if (err) {
// 						return done(err);
// 					}

// 					expect(cursor)
// 						.to.be.an('object')
// 						.to.have.property('stream')
// 						.to.be.a('function');

// 					var stream = cursor.stream();

// 					expect(stream).to.be.a('object');

// 					stream.on('data', function (doc) {
// 						expect(doc._tenant).to.not.exist;
// 					});
// 					stream.on('end', function () {
// 						done();
// 					});
// 				});
// 			});

// 			it('will fetch with [forEach] method and each doc will have no _tenant field', function (done) {
// 				aggregateFunc(function (err, cursor) {
// 					if (err) {
// 						return done(err);
// 					}

// 					expect(cursor).to.be.an('object');

// 					cursor.forEach(function (doc) {
// 						expect(doc._tenant).to.not.exist;
// 					});

// 					done();
// 				});
// 			});

// 			it('will fetch with [next] method and each doc will have no _tenant field', function (done) {
// 				aggregateFunc(function (err, cursor) {
// 					if (err) {
// 						return done(err);
// 					}

// 					expect(cursor).to.be.an('object');

// 					cursor.next().then(function (doc) {
// 						expect(doc._tenant).to.not.exist;
// 						done();
// 					});

// 				});
// 			});

// 			it('will fetch with [toArray] method and each doc will have no _tenant field', function (done) {
// 				aggregateFunc(function (err, cursor) {
// 					if (err) {
// 						return done(err);
// 					}

// 					expect(cursor).to.be.an('object');

// 					cursor.toArray().then(function (docs) {
// 						expect(docs).to.be.an('array');

// 						docs.forEach(function (doc) {
// 							expect(doc._tenant).to.not.exist;
// 						});

// 						done();
// 					});

// 				});
// 			});
// 		});

// 		it('will insert document with tenant', function (done) {

// 			getStandardCollectionObject(collectionName, '',
// 				function (err, collection) {
// 					if (err) {
// 						done(err);
// 					}
// 					getTenantCollectionObject('myTenant', collection, function (err, tenantCollection) {
// 						if (err) {
// 							done(err);
// 						}
// 						tenantCollection.insert({dummy: 'I am a dummmy'}, {safe: true}, getInsertedDocument);
// 					});

// 					function getInsertedDocument(err, insertedObjects) {
// 						getTenantCollectionObject('myTenant', collection, function (err, tenantCollection) {
// 							if (err) {
// 								done(err);
// 							}
// 							var id = new ObjectID(insertedObjects[0]._id.toString());
// 							tenantCollection.findOne({_id: id}, {_tenant: 1}, verify);
// 						});
// 					}
// 				});

// 			function verify(err, doc) {
// 				expect(doc._tenant).to.equal('myTenant');
// 				done();
// 			}
// 		});
// 	});

// 	it('will not return _tenant when insert a document', function (done) {
// 		getStandardCollectionObject(collectionName, '',
// 			function (err, collection) {
// 				if (err) {
// 					return done(err);
// 				}
// 				getTenantCollectionObject('myTenant', collection, function (err, tenantCollection) {
// 					if (err) {
// 						return done(err);
// 					}
// 					tenantCollection.insert({dummy: 'I am a dummmy'}, {safe: true}, verify);
// 				});
// 			});

// 		function verify(err, doc) {
// 			expect(doc._tenant).to.not.be.ok;
// 			done();
// 		}
// 	});

// 	it('will not return _tenant when insert - Array of 3 documents is inserted to the same tenant', function (done) {
// 		getStandardCollectionObject(collectionName, '',
// 			function (err, collection) {
// 				if (err) {
// 					return done(err);
// 				}
// 				getTenantCollectionObject('myTenant', collection, function (err, tenantCollection) {
// 					if (err) {
// 						return done(err);
// 					}
// 					tenantCollection.insert(
// 						[
// 							{dummy: 'I am a dummmy1'},
// 							{dummy: 'I am a dummmy2'},
// 							{dummy: 'I am a dummmy3'}
// 						],
// 						{safe: true}, callback
// 					);
// 				});
// 			});

// 		function callback(err, docs) {
// 			expect(docs[0]._tenant).to.not.be.ok;
// 			expect(docs[1]._tenant).to.not.be.ok;
// 			expect(docs[2]._tenant).to.not.be.ok;
// 			done();
// 		}
// 	});

// 	it('will insert 2 different documents in the same tenant', function (done) {
// 		collection1.insert({dummy: 'I am a dummmy'}, {safe: true}, verify);

// 		function verify(err, doc1) {
// 			if (err) {
// 				done(err);
// 			}

// 			collection2.insert({dummy: 'I am a dummmy'}, {safe: true}, function (err, doc2) {
// 				if (err) {
// 					done(err);
// 				}
// 				expect(doc1).to.not.equal(doc2);
// 				done();
// 			});
// 		}
// 	});

// 	it('will not return _tenant when save', function (done) {
// 		collection1.save({name: 'document to save'}, verify);

// 		function verify(err, doc) {
// 			expect(doc._tenant).to.not.be.ok;
// 			done();
// 		}
// 	});

// 	it('will fail if we try to set the property "_tenant" on the document', function (done) {
// 		collection1.update({}, {$set: {_tenant: 'thisShouldFail'}}, {safe: true}, verify);

// 		function verify(err, doc) {
// 			expect(err).to.be.ok;
// 			done();
// 		}
// 	});

// 	it('will overwrite the tenant if we try to save a document with the property "_tenant"', function (done) {
// 		collection1.remove({}, {safe: true}, function (err) {
// 			if (err) {
// 				done(err);
// 			}
// 			collection1.update({}, {
// 				_tenant: 'thisShouldBeOverwritten', id: 'myTest'
// 			}, {safe: true}, verify);
// 		});

// 		function verify(err, doc) {
// 			expect(doc._tenant).to.not.equal('thisShouldBeOverwritten');
// 			done();
// 		}
// 	});

// 	it('will remove all documents for a tenant', function (done) {
// 		collection1.remove({}, {safe: true}, verify);

// 		function verify(err) {
// 			expect(err).to.be.not.ok;
// 			done();
// 		}
// 	});

// 	it('will find no document with findOne after all documents have been removed', function (done) {
// 		collection1.remove({}, {safe: true}, function (err) {
// 			if (err) {
// 				done(err);
// 			}
// 			collection1.findOne({}, verify);
// 		});

// 		function verify(err, doc) {
// 			expect(err).to.be.not.ok;
// 			expect(doc).to.be.not.ok;
// 			done();
// 		}
// 	});

// 	it('will find a document with findOne after one has been inserted', function (done) {
// 		collection1.remove({}, {safe: true}, function (err) {
// 			if (err) {
// 				done(err);
// 			}
// 			collection1.insert({id: 'findOneTest'}, {safe: true}, function (err) {
// 				if (err) {
// 					done(err);
// 				}
// 				collection1.findOne({id: 'findOneTest'}, verify);
// 			});
// 		});

// 		function verify(err, doc) {
// 			expect(doc.id).to.equal('findOneTest');
// 			done();
// 		}
// 	});

// 	it('will find no document with findOne after all documents have been removed and a document has been inserted for another tenant', function (done) {
// 		collection1.remove({}, {safe: true}, function (err) {
// 			if (err) {
// 				done(err);
// 			}
// 			collection2.insert({id: 'findOneTest'}, {safe: true}, function (err) {
// 				if (err) {
// 					done(err);
// 				}
// 				collection1.findOne({id: 'findOneTest'}, verify);
// 			});
// 		});

// 		function verify(err, doc) {
// 			expect(err).to.be.not.ok;
// 			expect(doc).to.be.not.ok;
// 			done();
// 		}
// 	});

// 	it('will find a document with findOne for tenant1 after a document has been inserted for tenant1 and all documents have been removed for tenant2', function (done) {
// 		collection1.insert({id: 'findOneTest'}, {safe: true}, function (err) {
// 			if (err) {
// 				done(err);
// 			}
// 			collection2.remove({}, {safe: true}, function (err) {
// 				if (err) {
// 					done(err);
// 				}
// 				collection1.findOne({id: 'findOneTest'}, verify);
// 			});
// 		});

// 		function verify(err, doc) {
// 			expect(doc.id).to.equal('findOneTest');
// 			done();
// 		}
// 	});

// 	it('findOne - only callback - return document', function (done) {
// 		collection1.remove({}, {safe: true}, function (err) {
// 			if (err) {
// 				done(err);
// 			}
// 			collection1.insert({id: 'findOneTest', field: 'bar'}, {safe: true}, function (err) {
// 				if (err) {
// 					done(err);
// 				}
// 				collection1.findOne(verify);
// 			});
// 		});

// 		function verify(err, doc) {
// 			expect(err).to.be.not.ok;
// 			expect(doc).to.be.ok;
// 			expect(doc.id).to.be.ok;
// 			expect(doc.field).to.be.ok;
// 			expect(doc._tenant).to.be.not.ok;
// 			done();
// 		}
// 	});

// 	it('findOne - with selector, callback - return document', function (done) {
// 		collection1.remove({}, {safe: true}, function (err) {
// 			if (err) {
// 				done(err);
// 			}
// 			collection1.insert({id: 'findOneTest'}, {safe: true}, function (err) {
// 				if (err) {
// 					done(err);
// 				}
// 				collection1.findOne({id: 'findOneTest'}, verify);
// 			});
// 		});

// 		function verify(err, doc) {
// 			expect(err).to.not.be.ok;
// 			expect(doc).to.be.ok;
// 			done();
// 		}
// 	});

// 	it('findOne - with selector, field, callback - return document', function (done) {
// 		collection1.remove({}, {safe: true}, function (err) {
// 			if (err) {
// 				done(err);
// 			}

// 			collection1.insert({id: 'findOneTest', field: 'bar'}, {safe: true}, function (err) {
// 				if (err) {
// 					done(err);
// 				}

// 				collection1.findOne({id: 'findOneTest'}, {field: 1}, verify);
// 			});
// 		});

// 		function verify(err, doc) {
// 			expect(err).to.be.not.ok;
// 			expect(doc).to.be.ok;
// 			expect(doc.id).to.be.not.ok;
// 			expect(doc.field).to.be.ok;
// 			expect(doc._tenant).to.not.be.ok;
// 			done();
// 		}
// 	});

// 	it('findOne - with selector, option, callback - return document', function (done) {
// 		collection1.remove({}, {safe: true}, function (err) {
// 			if (err) {
// 				done(err);
// 			}

// 			collection1.insert({id: 'findOneTest', field: 'bar'}, {safe: true}, function (err) {
// 				if (err) {
// 					done(err);
// 				}

// 				collection1.findOne({id: 'findOneTest'}, {fields: {field: 1}}, verify);
// 			});
// 		});

// 		function verify(err, doc) {
// 			expect(err).to.be.not.ok;
// 			expect(doc).to.be.ok;
// 			expect(doc.id).to.be.not.ok;
// 			expect(doc.field).to.be.ok;
// 			done();
// 		}
// 	});

// 	it('findAndModify - _tenant is not in result', function (done) {
// 		collection1.remove({}, {safe: true}, function (err) {
// 			if (err) {
// 				done(err);
// 			}

// 			collection1.insert({id: 'findTestToModify', field: 'bar'}, {safe: true}, function (err) {
// 				if (err) {
// 					done(err);
// 				}

// 				collection1.findAndModify({id: 'findTestToModify'}, {}, {id: 'findTestModified'}, verify);
// 			});
// 		});

// 		function verify(err, doc) {
// 			expect(doc._tenant).to.not.be.ok;
// 			done();
// 		}
// 	});

// 	it('findAndRemove - _tenant is not in result', function (done) {
// 		collection1.remove({}, {safe: true}, function (err) {
// 			if (err) {
// 				done(err);
// 			}

// 			collection1.insert({id: 'findTestToRemove', field: 'bar'}, {safe: true}, function (err) {
// 				if (err) {
// 					done(err);
// 				}

// 				collection1.findAndRemove({id: 'findTestToRemove'}, {}, verify);
// 			});
// 		});

// 		function verify(err, doc) {
// 			expect(doc._tenant).to.not.be.ok;
// 			done();
// 		}
// 	});

// 	it('find - _tenant is not in result', function (done) {
// 		collection1.remove({}, {safe: true}, function (err) {
// 			if (err) {
// 				done(err);
// 			}

// 			collection1.insert({id: 'findTest', field: 'bar'}, {safe: true}, function (err) {
// 				if (err) {
// 					done(err);
// 				}

// 				var cursor = collection1.find({id: 'findTest'});
// 				cursor.toArray(function (err, docs) {
// 					expect(docs._tenant).to.not.be.ok;
// 					done();
// 				});
// 			});
// 		});
// 	});
// });