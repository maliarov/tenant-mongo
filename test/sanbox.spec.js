const {MongoClient, ObjectId} = require('../src/lib');

describe('test', () => {
    let client;

    before('init connection', async () => {
        client = await new MongoClient('mongodb://localhost/tenantMongoTest', { useNewUrlParser: true }).connect();
    });
    
    after('close connection', async () => {
        await client.close();
    });

    // it('separated db options', () => {
    //     const a = Object.assign(client.db(), {_tenantMongo: {test: '1'}});
    //     const b = client.db(null, {test: '2'});

    //     console.log(a);
    //     console.log(b);

    //     //expects( === client.db()).to.be.true;
    // });

    it('sandbox', async () => {
        const tenantConfig = {
            tenant: '123',
            collections: [
                'test1'
            ]
        };

        const db = client.db();
        
        Object.assign(db.s.options, {tenant: tenantConfig});

        const collection = db.collection('test1');

        // const invoice1 = await collection.findOne({ _id: ObjectId("5b60362f28071f2d4bed6642") });

        // await collection.findOneAndDelete(
        //     { _id: ObjectId("5b60362f28071f2d4bed6643") }
        // );
        // await collection.findOneAndReplace(
        //     { _id: ObjectId("5b60362f28071f2d4bed6643") },
        //     { a: 1 }
        // );
        // await collection.findOneAndUpdate(
        //     { _id: ObjectId("5b60362f28071f2d4bed6643") },
        //     {
        //         $set: { 'a': 1 },
        //         $unset: { '_tenant': 1, 'b': 1 }
        //     }
        // );
        // await collection.findAndModify(
        //     { _id: ObjectId("5b60362f28071f2d4bed6643") },
        //     [],
        //     {
        //         $set: { 'a': 1 },
        //         $unset: { '_tenant': 1, 'b': 1 }
        //     }
        // );
        // await collection.findAndRemove(
        //     { _id: ObjectId("5b60362f28071f2d4bed6643") }
        // );

        // await collection.aggregate([
        //     { $match: { _id: ObjectId("5b60362f28071f2d4bed6643") } }
        // ]);


        // await collection.remove(
        //     { _id: ObjectId("5b60362f28071f2d4bed6643") }
        // );
        // await collection.removeOne(
        //     { _id: ObjectId("5b60362f28071f2d4bed6643") }
        // );
        // await collection.removeMany(
        //     { _id: ObjectId("5b60362f28071f2d4bed6643") }
        // );
        // await collection.deleteOne(
        //     { _id: ObjectId("5b60362f28071f2d4bed6643") }
        // );
        // await collection.deleteMany(
        //     { _id: ObjectId("5b60362f28071f2d4bed6643") }
        // );

        await collection.insert({ a: 1 });

        await collection.insertOne({ a: 1 });

        await collection.insertMany([
            { a: 1 },
            { a: 2 }
        ]);

    });
});