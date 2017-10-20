FROM node:8-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ADD . /usr/src/app
RUN npm install

CMD [ "npm", "start" ]
