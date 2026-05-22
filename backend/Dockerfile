FROM node:18-alpine

WORKDIR /app

# Install Railpack
RUN apk add --no-cache git curl && \
    curl -sSL https://get.railpack.io | sh && \
    apk add --no-cache docker

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "run", "start"]