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

CMD [ "npm", "start" ]
