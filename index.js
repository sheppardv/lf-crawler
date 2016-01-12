const MongoClient = require('mongodb').MongoClient
    , crawler = require('./crawler.js')
    ;

// Connection URL
var uri = 'mongodb://localhost:27017/lostfilm';
// Use connect method to connect to the Server
MongoClient.connect(uri, function(err, db) {
    const collection = db.collection('lostfilm');

    crawler.crawl((tvshow) => {
        "use strict";
        console.log(tvshow.name);
        tvshow._id = tvshow.name;
        collection.insertOne(tvshow, (err, r) => {
            console.error(err);

            !err && console.log(r.insertedCount);
        });
    }, () => {
        "use strict";

        console.log('ON DRAIN');
        db.close();
    });

});
