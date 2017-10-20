#!/bin/bash -e

cp config.yml consumer/config/local.yml
cp config.yml producer/config/local.yml

pushd consumer/
npm install
popd

pushd producer/
npm install
popd

docker-compose build
