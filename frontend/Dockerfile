FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY dist ./dist

EXPOSE 5173

# Serve dist on all interfaces
CMD ["npx", "http-server", "dist", "-p", "5173", "-a", "0.0.0.0", "-c-1"]
