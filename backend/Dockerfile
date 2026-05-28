FROM node:18-slim

WORKDIR /app

# Install essential tools including gnupg for GPG operations
RUN apt-get update && apt-get install -y \
    git curl bash ca-certificates gnupg && \
    mkdir -m 0755 -p /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && apt-get install -y docker-ce-cli && \
    rm -rf /var/lib/apt/lists/*

# Set PATH early so mise and railpack are available in all subsequent steps
ENV PATH="/root/.local/share/mise/shims:/root/.local/bin:$PATH"
ENV MISE_DATA_DIR="/root/.local/share/mise"

# Install mise first
RUN curl -sSL https://mise.run | sh

# Install railpack via mise and set it as the global default
RUN /root/.local/bin/mise use -g github:railwayapp/railpack@latest

# Verify railpack is accessible
RUN railpack --version || echo "Railpack version check failed"

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Build TypeScript
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start"]
