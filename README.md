tenant-mongo (next [tenantmongo](https://github.com/debitoor/tenantmongo))
===========

```tenant-mongo```, is a small layer on top of the mongodb native driver for node.js. It adds the following features

* All documents stored will get a ```created``` timestamp
* All documents modified will get a ```lastModified``` timestamp
* Multi tenancy: One collection can be split up into completely isolated documents for each tenant, while still
only having one underlying physical MongoDB collection
* Safe deletion of documents (adding _deleted property instead of phisically remove document from collection)

Usage
=====

Just include ```tenant-mongo``` package instead of ```mongodb```

```javascript
const { MongoClient, ObjectID } = require("tenant-mongo");
```

Configuration
=====

You can specify current tenant options for db globaly or localy per collection

```javascript
    const client = await MongoClient('mongodb://localhost:27017/my-tenant-db').connect();
    const dataBase = client.db().setTenant({ tenant: 'myGlobalTenant', collections: ['collection1', 'collection2'] });

    const collection1 = dataBase.collection('collection1'); // collection with global tenant
    const collection2 = dataBase.collection('collection2').setTenant('myLocalTenant'); // collection with overrided tenant
    const collection3 = dataBase.collection('collection3'); // regular mongodb collection
```

Soft delete
---------------------------
```tenant-mongo``` soft deletes all documents. It just sets `_deleted: new Date()` instead of deleting. And it adds `_deleted: {$exists: false}` to all queries.

To bypass the softDelete on deleting or quering data you can do like this:

```javascript
    const client = await MongoClient('mongodb://localhost:27017/my-tenant-db').connect();
    const dataBase = client.db().setTenant({ tenant: 'myGlobalTenant', collections: ['collection1', 'collection2'] });

    const collection1 = dataBase.collection('collection1').setDeletionMode('hard'); // collection with 'hard' deletion mode

    collection1.remove({ }, callback); //will find all documents including soft-deleted documents
```

Warning
---------------------------

Currently not supported default arguments for following collection method:

* find
* remove
* aggregate

so, if you going to skip query|selector or pipeline params it will not work correctly.
