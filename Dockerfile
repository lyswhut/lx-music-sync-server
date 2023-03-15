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
ENV BIND_IP '127.0.0.1'
ENV CONNECT_PWD ''
ENV CONFIG_PATH '/server/config.js'
ENV LOG_PATH '/server/logs'
ENV DATA_PATH '/server/data'
ENV CLEAR_DELETE_USER_DATA 'false'
COPY --from=builder ./server/server ./server
COPY package.json package-lock.json config.js index.js ./
RUN npm ci --omit=dev

CMD [ "npm", "start" ]
