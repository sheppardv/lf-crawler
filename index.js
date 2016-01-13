'use strict';

const MongoClient = require('mongodb').MongoClient
    , crawler = require('./crawler.js')
    , ObjectId = require('mongodb').ObjectID
    ;

// Connection URL
let uri = 'mongodb://localhost:27017/lostfilm';
let collection, database;

let onShow = (tvshow) => {
    "use strict";
    console.log(tvshow.name);
    tvshow._id = new ObjectId;
    collection.insertOne(tvshow, (err, r) => {
        err && console.error(err);
    });
};

let noMoreShows = () => {
    "use strict";
    console.info('No mo shows found.');
    database.close();
};


// Use connect method to connect to the Server
MongoClient.connect(uri, function(err, db) {
    database = db;
    collection = db.collection('lostfilm');

    crawler.crawl(onShow, noMoreShows);
});