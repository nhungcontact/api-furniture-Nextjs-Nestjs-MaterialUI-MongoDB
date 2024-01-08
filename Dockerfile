# FROM --platform=linux/amd64 node:19-alpine
FROM node:19-alpine

ENV TZ="Asia/Ho_Chi_Minh"

WORKDIR /home/app

EXPOSE 3000

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

CMD [ "node", "dist/main" ]