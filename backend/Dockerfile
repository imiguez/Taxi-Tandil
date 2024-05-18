FROM node:16-alpine
WORKDIR /app
COPY package*.json .
COPY . .
RUN npm i
RUN npm run build
EXPOSE 443/tcp
CMD ["npm", "run", "start:prod", "--log-opt", "max-size 20m", "--log-opt", "max-file 20"]