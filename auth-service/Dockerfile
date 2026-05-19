FROM node:20-alpine
WORKDIR /app

# Copy auth-service files from monorepo root context.
COPY auth-service/ ./

# Install when package.json exists; otherwise rely on committed node_modules.
RUN if [ -f package.json ]; then \
			npm ci --omit=dev || npm install --omit=dev; \
		elif [ ! -d node_modules ]; then \
			echo "Either auth-service/package.json or auth-service/node_modules must exist"; \
			exit 1; \
		fi

# Build only when npm scripts exist. Current repo layout already includes dist.
RUN if [ -f package.json ]; then npm run build; fi

ENV NODE_ENV=production
ENV PORT=3004

EXPOSE 3004

CMD ["node", "dist/index.js"]
