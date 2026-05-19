FROM node:20-alpine
WORKDIR /app

# Support both source-based and dist-only service layouts.
COPY . .

# If package.json exists, install production deps in image.
# For current dist-only layout, rely on committed node_modules.
RUN if [ -f package.json ]; then \
      npm ci --omit=dev || npm install --omit=dev; \
    elif [ ! -d node_modules ]; then \
      echo "Either package.json or node_modules must exist in order-service"; \
      exit 1; \
    fi

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/index.js"]