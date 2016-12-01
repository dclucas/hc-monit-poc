FROM node:6.9-alpine

MAINTAINER Diogo Lucas

RUN mkdir /usr/app
WORKDIR /usr/app

COPY package.json /usr/app
RUN npm install

COPY . /usr/app

CMD npm start