FROM node:alpine3.23 AS build

WORKDIR /frontend

COPY package*.json ./

RUN npm install

COPY . .

ARG VITE_API_BASE=
ENV VITE_API_BASE=$VITE_API_BASE

RUN npm run build

FROM nginx:1.29.5-alpine

COPY --from=build /frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
