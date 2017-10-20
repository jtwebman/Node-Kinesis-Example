'use strict';

const AWS = require('aws-sdk');
const config = require('config');
const {StringDecoder} = require('string_decoder');


AWS.config.update({region: 'us-east-1', accessKeyId: 'akid', secretAccessKey: 'secret'});
const kinesis = new AWS.Kinesis({endpoint: 'http://kinesis:4567'});

const decoder = new StringDecoder('utf8');

const timers = [];

const getRecordsInterval = config.get('getRecordsInterval');
const maxRecords = config.get('maxRecords');
const {streamName, checkActiveInterval} = config.get('kinesis');

function waitForStreamToBecomeActive(callback) {
  kinesis.describeStream({StreamName: streamName}, (err, data) => {
    if (err || data.StreamDescription.StreamStatus !== 'ACTIVE') {
      console.log(`${streamName} stream not up yet.`);
      return setTimeout(() => waitForStreamToBecomeActive(callback), checkActiveInterval);
    }
    console.log(`${streamName} stream active.`);
    return callback(null, data.StreamDescription);
  });
}

function decodeRecord(record) {
  return JSON.parse(decoder.write(Buffer.from(record.Data)));
}

function getRecordProcessor(shardId, startingShardIterator) {
  let currentShardIterator = startingShardIterator;
  return () => {
    const params = {
      ShardIterator: currentShardIterator,
      Limit: maxRecords
    };
    kinesis.getRecords(params, (err, data) => {
      if (err) {
        console.log(`Error on kinesis.getRecords on shared ${shardId}: ${err.message}`);
        return;
      }
      const decodedRecords = data.Records.map(decodeRecord);
      if (decodedRecords.length > 0) {
        console.log(`Processing records on shard ${shardId}: ${JSON.stringify(decodedRecords, null, 2)}`);
      }
      currentShardIterator = data.NextShardIterator;
    });
  };
}

function getRecords(err, kinesisStream) {
  kinesisStream.Shards.forEach((shard) => {
    const params = {
      ShardId: shard.ShardId,
      ShardIteratorType: 'AT_SEQUENCE_NUMBER',
      StreamName: kinesisStream.StreamName,
      StartingSequenceNumber: shard.SequenceNumberRange.StartingSequenceNumber
    };

    kinesis.getShardIterator(params, function(err, iterator) {
      if (err) {
        console.log(`Error on kinesis.getShardIterator with params ${params}: ${err.message}`);
        return;
      }
      console.log(`Reading records on shard ${shard.ShardId} every ${getRecordsInterval} milliseconds.`);
      const timer = setInterval(
        getRecordProcessor(shard.ShardId, iterator.ShardIterator),
        getRecordsInterval
      );
      timers.push(timer);
    });
  });
}

waitForStreamToBecomeActive(getRecords);

function gracefulShutdown() {
  timers.forEach(clearInterval);
}
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
