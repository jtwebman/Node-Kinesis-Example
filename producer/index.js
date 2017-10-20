'use strict';

const AWS = require('aws-sdk');
const config = require('config');

AWS.config.update({region: 'us-east-1', accessKeyId: 'akid', secretAccessKey: 'secret'});
const kinesis = new AWS.Kinesis({endpoint: config.get('kinesis.endpoint')});

let timer;

const {streamName, shardCount, checkActiveInterval} = config.get('kinesis');
const addRecordInterval = config.get('addRecordInterval');

function waitForStreamToBecomeActive(kinesis, name, callback) {
  kinesis.describeStream({StreamName: name}, function(err, data) {
    if (err) {
      return callback(err);
    }

    console.log(`Current status of the ${name} stream is ${data.StreamDescription.StreamStatus}`);
    if (data.StreamDescription.StreamStatus === 'ACTIVE') {
      return callback(null);
    }

    // Not active check back in 5 seconds
    setTimeout(function() {
      waitForStreamToBecomeActive(kinesis, name, callback);
    }, checkActiveInterval);
  });
}

function createStreamIfNotCreated(kinesis, name, shardCount, callback) {
  kinesis.createStream({
    ShardCount: shardCount,
    StreamName: name
  }, function(err) {
    if (err) {
      if (err.code !== 'ResourceInUseException') {
        return callback(err);
      } else {
        console.log(`${name} stream is already created, re-using it.`);
      }
    } else {
      console.log(`${name} stream doesn't exist, created a new stream with that name.` );
    }

    waitForStreamToBecomeActive(kinesis, name, callback);
  });
}

function writeToKinesis(kinesis, name, callback) {
  const currentTime = new Date().getMilliseconds();
  const sensor = 'sensor-' + Math.floor(Math.random() * 100000);
  const reading = Math.floor(Math.random() * 1000000);

  const record = JSON.stringify({
    time: currentTime,
    sensor: sensor,
    reading: reading
  });

  const recordParams = {
    Data: record,
    PartitionKey: sensor,
    StreamName: name
  };

  kinesis.putRecord(recordParams, callback);
}

function getMessageSender(kinesis, streamName) {
  return (err) => {
    if (err) {
      return console.log(`Error starting stream ${streamName}: ${err.message}`);
    }
    console.log(`Adding a record to stream ${streamName} every ${addRecordInterval} milliseconds.`);
    timer = setInterval(() => {
      writeToKinesis(kinesis, streamName, (err) => {
        if (err) {
          console.log(`Error writing to kinesis stream ${streamName}: ${err.message}`);
        } else {
          console.log(`Message sent to kinesis stream ${streamName}`);
        }
      });
    }, addRecordInterval);
  };
}

createStreamIfNotCreated(
  kinesis,
  streamName,
  shardCount,
  getMessageSender(kinesis, streamName)
);

function gracefulShutdown() {
  clearInterval(timer);
}
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
