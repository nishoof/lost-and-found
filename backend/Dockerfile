FROM node:alpine3.23

WORKDIR /backend

COPY package*.json ./

RUN npm ci

COPY src ./src

EXPOSE 8080
CMD ["npm", "start"]
