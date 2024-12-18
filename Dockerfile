# Base Image
FROM node:lts-alpine AS base
LABEL maintainer "Sagar Khole<kholesagar4@gmail.com>"

# couchbase sdk requirements
RUN apk add --no-cache yarn curl bash g++ make && rm -rf /var/cache/apk/*

# install node-prune (https://github.com/tj/node-prune)
RUN curl -sfL https://install.goreleaser.com/github.com/tj/node-prune.sh | bash -s -- -b /usr/local/bin

WORKDIR /usr/src/app

COPY package.json ./

# install dependencies
RUN yarn --frozen-lockfile

COPY . .

# lint & test
# RUN yarn lint & yarn test

# build application
RUN yarn build

# remove development dependencies
RUN npm prune --production

# run node prune
RUN /usr/local/bin/node-prune

# remove unused dependencies
RUN rm -rf node_modules/rxjs/src/
RUN rm -rf node_modules/rxjs/bundles/
RUN rm -rf node_modules/rxjs/_esm5/
RUN rm -rf node_modules/rxjs/_esm2015/
RUN rm -rf node_modules/swagger-ui-dist/*.map
# RUN rm -rf node_modules/couchbase/src/

FROM node:lts-alpine

WORKDIR /usr/src/app

# copy from build image
COPY --from=base /usr/src/app/dist ./dist
COPY --from=base /usr/src/app/node_modules ./node_modules

EXPOSE 4000

CMD [ "node", "./dist/src/main.js" ]