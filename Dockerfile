FROM node:16-alpine AS builder
WORKDIR /server
COPY . .
# RUN npm install
RUN npm ci
RUN npm run build


FROM node:16-alpine AS final
WORKDIR /server
COPY --from=builder ./server/server ./server
COPY package.json package-lock.json config.js index.js ./
RUN npm ci --omit=dev

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

CMD [ "npm", "start" ]
