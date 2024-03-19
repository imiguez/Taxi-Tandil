FROM node:16-alpine
WORKDIR /app
COPY package*.json .
COPY . .
RUN npm i
RUN npm run build
EXPOSE 443/tcp
CMD ["npm", "run", "start:prod"]