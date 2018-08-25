const mongoConfig = {
	uri: 'mongodb://localhost:27017/tenantmongo?safe=true&slaveOk=true&journal=true',
	options: {
		native_parser: false,
		reaper: true,
		strict: false
	},
	tenant: {
		tenant: 123,
		collections: ['test1']
	}
};

const mongodb = require('../src/lib');


describe('basic operations', function () {

	let client;
	let database;
	let collection;
	let decCollection;
	let document;
	let result;

	before(function (done) {
		mongodb.MongoClient.connect(mongoConfig.uri, mongoConfig.options, function (err, clnt) {
			if (err) {
				return done(err);
			}
			client = clnt;
			database = client.db();
			collection = database.collection('test1');
			done();
		});
	});

	beforeEach(function (done) {
		collection.remove({}, done);
	});

	// after(function (done) {
	// 	collection.drop(done);
	// });

	after(function () {
		client.close();
	});

	let total;

	function getTotal(done) {
		total = null;
		collection.count(function (err, count) {
			if (err) {
				return done(err);
			}

			total = count;
			done();
		});
	}

	let deleted;

	function getDeleted(done) {
		deleted = null;
		collection.count({ _deleted: { $exists: true } }, function (err, count) {
			if (err) {
				return done(err);
			}
			deleted = count;
			done();
		});
	}

	describe('when softdelete is enabled=true (default)', function () {
		let client;

		before(async function () {
			client = await mongodb.MongoClient(mongoConfig.uri, mongoConfig.options).connect();
			decCollection = client.db().setTenant(mongoConfig.tenant).collection('test1');
		});
		after(function () {
			client.close();
		});

		beforeEach(function (done) {
			collection.insert({ _tenant: 999 }, done);
		});

		beforeEach(function () {
			document = { a: 1, b: [2] };
		});

		describe('when inserting a document', function () {

			beforeEach(function (done) {
				decCollection.insert(document, { safe: true }, function (err, status) {
					if (err) {
						return done(err);
					}
					result = status.ops[0];
					done();
				});
			});

			beforeEach(getTotal);

			beforeEach(getDeleted);

			it('should have total 2', function () {
				expect(total).to.equal(2);
			});

			it('should have deleted 0', function () {
				expect(deleted).to.equal(0);
			});

			it('should insert document', function () {
				expect(result).to.have.property('_id');
			});

			it('should have created date', function () {
				expect(result).to.have.property('createdDate');
			});

			it('should have last modified date', function () {
				expect(result).to.have.property('lastModifiedDate');
			});

			it('should have created date', function () {
				expect(result.createdDate).to.eql(result.lastModifiedDate);
			});

			describe('when delete a document {}', function () {
				let count;

				beforeEach(function (done) {
					setTimeout(function () {
						decCollection.remove({}, function (err, res) {
							if (err) {
								return done(err);
							}
							count = res.result.n;
							done();
						});
					}, 50);
				});

				beforeEach(function (done) {
					collection.findOne({ a: 1, b: [2] }, function (err, doc) {
						if (err) {
							return done(err);
						}
						result = doc;
						done();
					});
				});

				beforeEach(getTotal);

				beforeEach(getDeleted);

				it('should have total 2', function () {
					expect(total).to.equal(2);
				});

				it('should have deleted 1', function () {
					expect(deleted).to.equal(1);
				});

				it('should softdeleted one', function () {
					expect(count).to.equal(1);
				});

				it('should still have the document, but softdeleted', function () {
					expect(result).to.have.property('_deleted');
				});

				it('should have created date', function () {
					expect(result).to.have.property('createdDate');
				});

				it('should have last modified date', function () {
					expect(result).to.have.property('lastModifiedDate');
				});

				it('should have created date', function () {
					expect(result.createdDate).to.not.eql(result.lastModifiedDate);
				});

				describe('when fetch a document', function () {

					beforeEach(function (done) {
						decCollection.findOne(function (err, doc) {
							if (err) {
								return done(err);
							}
							result = doc;
							done();
						});
					});

					it('should not return the document', function () {
						expect(result).to.not.exist;
					});
				});
			});

			describe('when delete a document', function () {
				let count;

				beforeEach(function (done) {
					setTimeout(function () {
						decCollection.remove({}, function (err, res) {
							if (err) {
								return done(err);
							}
							count = res.result.n;
							done();
						});
					}, 50);
				});

				beforeEach(function (done) {
					collection.findOne({ a: 1, b: [2] }, function (err, doc) {
						if (err) {
							return done(err);
						}
						result = doc;
						done();
					});
				});

				beforeEach(getTotal);

				beforeEach(getDeleted);

				it('should have total 2', function () {
					expect(total).to.equal(2);
				});

				it('should have deleted 1', function () {
					expect(deleted).to.equal(1);
				});

				it('should softdeleted one', function () {
					expect(count).to.equal(1);
				});

				it('should still have the document, but softdeleted', function () {
					expect(result).to.have.property('_deleted');
				});

				it('should have created date', function () {
					expect(result).to.have.property('createdDate');
				});

				it('should have last modified date', function () {
					expect(result).to.have.property('lastModifiedDate');
				});

				it('should have created date', function () {
					expect(result.createdDate).to.not.eql(result.lastModifiedDate);
				});

				describe('when fetch a document', function () {

					beforeEach(function (done) {
						decCollection.findOne(function (err, doc) {
							if (err) {
								return done(err);
							}
							result = doc;
							done();
						});
					});

					it('should not return the document', function () {
						expect(result).to.not.exist;
					});
				});
			});
		});
	});

	describe('when softdelete is enabled=false disabled', function () {
		let client;

		before(async function () {
			client = await mongodb.MongoClient(mongoConfig.uri, mongoConfig.options).connect();
			decCollection = client.db().setTenant(mongoConfig.tenant).setDeletionMode('hard').collection('test1');
		});
		after(async function () {
			await client.close();
		});

		beforeEach(function () {
			document = { a: 1, b: [2] };
		});

		describe('when inserting a document', function () {

			beforeEach(function (done) {
				decCollection.insert(document, { safe: true }, function (err, res) {
					if (err) {
						return done(err);
					}
					result = document;
					done();
				});
			});

			it('should insert document', function () {
				expect(result).to.have.property('_id');
			});

			it('should have created date', function () {
				expect(result).to.have.property('createdDate');
			});

			it('should have last modified date', function () {
				expect(result).to.have.property('lastModifiedDate');
			});

			it('should have created date', function () {
				expect(result.createdDate).to.eql(result.lastModifiedDate);
			});

			describe('when delete a document', function () {
				let count;

				beforeEach(function (done) {
					decCollection.remove({}, function (err, res) {
						if (err) {
							return done(err);
						}
						count = res.result.n;
						done();
					});
				});

				beforeEach(function (done) {
					collection.findOne(function (err, doc) {
						if (err) {
							return done(err);
						}
						result = doc;
						done();
					});
				});

				it('should softdeleted one', function () {
					expect(count).to.equal(1);
				});

				it('should not return the document', function () {
					expect(result).to.not.exist;
				});
			});
		});
	});

	describe('when softDelete is false', function () {
		let client;

		before(async function () {
			client = await mongodb.MongoClient(mongoConfig.uri, mongoConfig.options).connect();
			decCollection = client.db().setTenant(mongoConfig.tenant).setDeletionMode('hard').collection('test1');
		});

		after(async function () {
			await client.close();
		});


		describe('when insert document with lock', function () {

			beforeEach(function (done) {
				const doc = { lock: 'abc' };
				decCollection.insert(doc, function (err, docs) {
					if (err) {
						return done(err);
					}

					document = doc;
					done();
				});
			});

			it('should have property lock', function () {
				expect(document).to.have.property('lock', 'abc');
			});

			describe('when $unset lock', function () {

				beforeEach(function (done) {
					decCollection.findAndModify(
						{ _id: document._id },
						[],
						{ $unset: { lock: '' } },
						{ 'new': true },
						function (err, doc) {
							if (err) {
								return done(err);
							}

							document = doc;
							done();
						});
				});

				it('should remove property', function () {
					expect(document).not.to.have.property('lock');
				});
			});
		});
	});

	describe('when softDelete is true', function () {
		let client;

		before(async function () {
			client = await mongodb.MongoClient(mongoConfig.uri, mongoConfig.options).connect();
			decCollection = client.db().setTenant(mongoConfig.tenant).collection('test1');
		});

		after(async function () {
			await client.close();
		});

		describe('when insert document with lock', function () {

			beforeEach(function (done) {
				const doc = { lock: 'abc' };
				decCollection.insert(doc, function (err) {
					if (err) {
						return done(err);
					}

					document = doc;
					done();
				});
			});

			it('should have property lock', function () {
				expect(document).to.have.property('lock', 'abc');
			});

			describe('when $unset lock', function () {

				beforeEach(function (done) {

					decCollection.findAndModify({ _id: document._id }, [], { $unset: { lock: '' } }, { 'new': true }, function (err, doc) {
						if (err) {
							return done(err);
						}

						document = doc;
						done();
					});
				});

				it('should remove property', function () {
					expect(document).not.to.have.property('lock');
				});
			});
		});
	});
});

