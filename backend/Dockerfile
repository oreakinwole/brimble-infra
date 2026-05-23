FROM node:18-alpine

WORKDIR /app

# Install essential tools: git, curl, docker CLI, bash
RUN apk add --no-cache git curl docker-cli bash

# Install Railpack - use direct binary download
RUN curl -L https://github.com/railwayapp/railpack/releases/download/v0.1.0/railpack-linux-arm64 -o /usr/local/bin/railpack && \
    chmod +x /usr/local/bin/railpack && \
    railpack --version || echo "Railpack installed"

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Build TypeScript
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start"]