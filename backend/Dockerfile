FROM node:16-alpine
WORKDIR /app
COPY package*.json .
COPY . .
RUN npm i
RUN npm run build
EXPOSE 80/tcp
EXPOSE 2000/tcp
CMD ["npm", "run", "start:prod"]