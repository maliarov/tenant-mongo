// const { MongoClient } = require('../src/lib');

// const cfg = {
//     tenant: '123',
//     collections: [
//         'test'
//     ]
// };

// describe('test', () => {
//     let client;
//     let collection;

//     before('init', async () => {
//         client = await new MongoClient('mongodb://localhost/tenantMongoTest', { useNewUrlParser: true }).connect();
//         await client.db().dropDatabase();
//         collection = client.db().setTenant(cfg).collection('test');
//     });

//     after('done', async () => {
//         await client.close();
//     });

//     // it('separated db options', () => {
//     //     const a = Object.assign(client.db(), {_tenantMongo: {test: '1'}});
//     //     const b = client.db(null, {test: '2'});

//     //     console.log(a);
//     //     console.log(b);

//     //     //expects( === client.db()).to.be.true;
//     // });

//     it('sandbox', async () => {
//         // await collection.find();
//         // await collection.findOne();

//         // await collection.count();
//         // await collection.countDocuments();
//         // await collection.estimatedDocumentCount();

//         // await collection.findOneAndDelete({});
//         // await collection.findOneAndReplace({}, { a: 1 });
//         // await collection.findOneAndUpdate({}, { $set: { 'a': 1 }, $unset: { '_tenant': 1, 'b': 1 } });
//         // await collection.findAndModify({}, [], { $set: { 'a': 1 }, $unset: { '_tenant': 1, 'b': 1 } });
//         // await collection.findAndRemove();

//         // await collection.aggregate([{ $match: { _id: ObjectId("5b60362f28071f2d4bed6643") } }]);

//         // await collection.remove();
//         // await collection.removeOne();
//         // await collection.removeMany();
//         // await collection.deleteOne();
//         // await collection.deleteMany();

//         // await collection.save({ a: 'a' });

//         // await collection.updateOne({}, { $set: { a: 'a', '_tenant': '1234' }, $unset: { '_tenant': 1, 'b': 1 } });
//         // await collection.updateMany({}, { $set: { a: 'a', '_tenant': '1234' }, $unset: { '_tenant': 1, 'b': 1 } });

//         // await collection.insert({ a: 1 });
//         // await collection.insertOne({ a: 1 });
//         // await collection.insertMany([{ a: 1 }, { a: 2 }]);
//     });

//     it('test callback', async () => {
//         const objs = [{ a: 1 }, { b: 1 }, { c: 1 }];
//         console.log('new', objs);
//         await collection.insertMany(objs);
//         console.log('save', objs);

//         const find = await collection.find({});
//         console.log('find', await find.toArray());

//         const aggregate = await collection.aggregate([]);
//         console.log('aggregate', await aggregate.toArray());

//     });
// });