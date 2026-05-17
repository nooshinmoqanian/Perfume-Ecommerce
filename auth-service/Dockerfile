FROM node:20-alpine
WORKDIR /app

# Copy only package files for a fast npm install
COPY auth-service/package*.json ./
RUN npm install

# Copy auth-service sources
COPY auth-service/ ./

# Copy shared libs into image so TypeScript can build
## Place shared libs one level above /app so auth-service/tsconfig.json can resolve "../libs/common"
COPY libs/ ../libs/

RUN npm run build
CMD ["node", "dist/index.js"]
