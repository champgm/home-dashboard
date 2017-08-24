FROM node
MAINTAINER github.com/champgm

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app
RUN npm install
RUN npm run build

CMD [ "npm", "start" ]

EXPOSE 1981:8888
