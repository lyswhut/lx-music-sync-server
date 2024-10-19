FROM alpine AS base

FROM base AS builder
WORKDIR /source-code
COPY . .

RUN apk add --update \
    g++ \
    make \
    py3-pip \
    nodejs \
    npm \
  && npm ci && npm run build \
  && rm -rf node_modules && npm ci --omit=dev \
  && mkdir build-output \
  && mv server node_modules config.js index.js package.json -t build-output


FROM base AS final
WORKDIR /server

RUN apk add --update --no-cache nodejs

COPY --from=builder ./source-code/build-output ./

VOLUME /server/data
ENV DATA_PATH '/server/data/data'
ENV LOG_PATH '/server/data/logs'

EXPOSE 9527
ENV NODE_ENV 'production'
ENV PORT 9527
ENV BIND_IP '0.0.0.0'
# ENV PROXY_HEADER 'x-real-ip'
# ENV SERVER_NAME 'My Sync Server'
# ENV MAX_SNAPSHOT_NUM '10'
# ENV LIST_ADD_MUSIC_LOCATION_TYPE 'top'
# ENV LX_USER_user1 '123.123'
# ENV LX_USER_user2 '{ "password": "123.456", "maxSnapshotNum": 10, "list.addMusicLocationType": "top" }'
# ENV CONFIG_PATH '/server/config.js'
# ENV LOG_PATH '/server/logs'
# ENV DATA_PATH '/server/data'

CMD [ "node", "index.js" ]
