FROM node:20-alpine
WORKDIR /app

# Support both source-based and dist-only service layouts.
COPY . .

# Prefer clean in-container install when package.json exists.
# Fallback to existing node_modules for current dist-only layout.
RUN if [ -f package.json ]; then \
      npm ci --omit=dev || npm install --omit=dev; \
    elif [ ! -d node_modules ]; then \
      echo "Either package.json or node_modules must exist in notification-service"; \
      exit 1; \
    fi

ENV NODE_ENV=production
ENV PORT=3003

EXPOSE 3003

CMD ["node", "dist/index.js"]