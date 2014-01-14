/*
 * index.js :: Main include for follow-stream
 *
 */

var Readable = require('stream').Readable;
var follow = require('follow');
var util = require('util');

module.exports = FollowStream;

util.inherits(FollowStream, Readable);

function FollowStream (options) {
  if (!(this instanceof FollowStream)) { return new FollowStream(options) };

  this.options = options;

  if(!this.options.db) {
    throw new Error('Follow needs a db parameter');
  }
  this.options.objectMode = true;

  Readable.call(this, this.options);

  this.feed = new follow.Feed(this.options);
  //
  // Setup event listeners to proxy up follow's events through the stream
  //
  this.feed.on('error', this.emit.bind(this, 'error'));
  this.feed.on('catchup', this.emit.bind(this, 'catchup'));

  this.feed.on('change', this._onChange.bind(this));
  //
  // Remark: we want to start buffering changes once we are instatiated
  //
  this.feed.follow();
  this.started = true

}

FollowStream.prototype.stop = function () {
  this.started = false;
  this.feed.stop();
};

FollowStream.prototype._read = function (n) {};

FollowStream.prototype._onChange = function (change) {
  //
  // Remark: just push this bitch onto the internal buffer
  //
  this.push(change);
};




