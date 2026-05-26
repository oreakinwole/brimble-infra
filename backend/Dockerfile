FROM node:18-alpine

WORKDIR /app

# Install essential tools
RUN apk add --no-cache git curl docker-cli bash ca-certificates

# Download and install Railpack binary directly
RUN mkdir -p /root/.local/bin && \
    cd /tmp && \
    curl -sSL -o railpack.tar.gz https://github.com/railwayapp/railpack/releases/download/v0.23.0/railpack-v0.23.0-arm64-unknown-linux-musl.tar.gz && \
    tar -xzf railpack.tar.gz && \
    mv railpack /root/.local/bin/ && \
    chmod +x /root/.local/bin/railpack && \
    rm railpack.tar.gz && \
    cd /app

# Set PATH
ENV PATH="/root/.local/bin:$PATH"

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Build TypeScript
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start"]