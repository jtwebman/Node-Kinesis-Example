# Example of using Kinesis in node.js

# Install

To install you can will need to have docker with docker-compose installed.

Once install run the following command to install project dependencies as well as copy the config to each service.

```bash
./install.sh
```

# Run

To run and see it create and event every 10 seconds and process it by logging out the records it got just run the following command.

```bash
./start.sh
```

# Config

You can play around with the config in the following places to change how often it does things. If you change any settings in the `config.yml` you will need to run `./install.sh` again.
