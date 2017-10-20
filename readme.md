# Example of using Amazon Kinesis in node.js

This is just a small project that has two services. The producer service creates or re-uses a kinesis stream and sends a message to kinesis every so many milliseconds. The consumer service calls get records on each shard in the stream every so many milliseconds and just console logs them out.

I built it in pure node.js using `aws-sdk` library only, no Amazon KCL for Node.js.

# Install

To install you can will need to have docker with docker-compose installed.

Once you have docker-compose installed run the following command to install project dependencies as well as copy the config to each service: `./install.sh`

# Run

To run and see it create and event every 10 seconds and process it by logging out the records it got just run the following command: `./start.sh`.

To stop just hit `ctrl-c`.

# Config

You can play around with the `config.yml` to change how often it does things. If you change any settings in the `config.yml` you will need to run `./install.sh` again.

# Todos

* Add `docker-lambda` and make the producer service just call the lambda just like you can on AWS.
