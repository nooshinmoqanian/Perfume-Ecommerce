FROM node:20-alpine
WORKDIR /app

# Use monorepo root context from docker-compose.
COPY inventory-service/package*.json ./
RUN npm install

# Copy inventory-service sources and shared libs used by TS imports.
COPY inventory-service/ ./
COPY libs/ ../libs/

# TypeScript resolves modules from the shared libs location as well.
RUN ln -s /app/node_modules /libs/node_modules

RUN npm run build
# If libs are TypeScript sources, run with ts-node in the container during development builds
# so runtime can import TS files from ../libs without needing separate transpile step.
CMD ["npx", "ts-node", "src/index.ts"]
