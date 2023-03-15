FROM node:16-alpine AS builder
WORKDIR /server
COPY . .
# RUN npm install
RUN npm ci
RUN npm run build


FROM node:16-alpine AS final
WORKDIR /server
EXPOSE 9527
ENV PORT 9527
ENV BIND_IP '0.0.0.0'
ENV LOG_PATH '/server/user/logs'
ENV DATA_PATH '/server/user/data'
ENV CLEAR_DELETE_USER_DATA 'false'
ENV DEFAULT_USER_NAME 'mySyncServer'
ENV DEFAULT_CONNECT_PWD 'mySyncServer'
ENV DEFAULT_MAXS_SNAPSHOT_NUM 10
ENV CONFIG_PATH '/server/user/config.js'
COPY --from=builder ./server/server ./server
COPY package.json package-lock.json config.js index.js ./
RUN npm ci --omit=dev

CMD [ "npm", "start" ]
