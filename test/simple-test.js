var test = require('tape');
var async = require('async');
var followStream = require('../');
var hyperquest = require('hyperquest');

var url = 'http://test:testauth@localhost:5984/testdb';
var docs = {
  testdoc1: {
    _id: 'testdoc1',
    val: 'first'
  },
  testdoc2: {
    _id: 'testdoc2',
    val: 'second'
  },
  testdoc3: {
    _id: 'testdoc3',
    val: 'third'
  }
};
var saw = {};
var count = 0;

test('Ensure that we recieve a change through the stream when we insert a couchDoc', function (t) {
  t.plan(6);

  setup(function () {
    var stream = followStream({ db: url });
    stream.on('readable', function () {
      var change = stream.read();
      t.equal(change.seq, ++count);
      saw[change.id] = true;

      if (count === 3) {
        Object.keys(docs).forEach(function(id) {
          t.ok(saw[id], 'Received document ' + id);
        });
        stream.stop();
        t.end();
      }
    });

    Object.keys(docs).forEach(function(id) {
      createDoc(docs[id]);
    });

  });

  function setup(callback) {
    async.series([
      deleteDb,
      createDb
    ], function (err) {
      if (err) {
        return t.fail(err);
      }
      callback();
    })
  }


  function createDoc(doc) {
    var req = hyperquest.post(url);
    req.setHeader('Content-type', 'application/json');
    req.end(JSON.stringify(doc));
    req.on('response', function (res) {
      if (res.statusCode != 201 && res.statusCode != 200) {
        return t.fail('Bad statusCode when creating document from couch ' + res.statusCode);
      }
    });
  }
  //
  // So PUT works properly with request, and not
  //
  function createDb(callback) {
    var req = hyperquest.put(url, function (err, res) {
      if (err || (res.statusCode != 201 && res.statusCode != 412)) {
        return callback(err || 'Bad statusCode from create ' + res.statusCode);
      }
      callback();
    });
    req.setHeader('Content-type', 'application/json');
    req.end();
  }

  function deleteDb(callback) {
    hyperquest.delete(url, function (err, res) {
      if (err || (res.statusCode != 201 && res.statusCode != 200 && res.statusCode != 404)) {
        return callback(err || 'Bad statusCode from delete ' + res.statusCode)
      }
      callback();
    });
  }
});
