FROM node:10

WORKDIR /usr/src/app
COPY package*.json yarn.* ./

RUN yarn
COPY . .
ENV PORT 8888
EXPOSE 8888
CMD [ "node_modules/.bin/probot", "run", "index.js" ]
