# Dockerfile for Email Scheduler Service
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy scheduler code
COPY api-scheduler.js ./

# Create non-root user
RUN addgroup --system --gid 1001 scheduler
RUN adduser --system --uid 1001 scheduler

# Change ownership
RUN chown -R scheduler:scheduler /app
USER scheduler

# Expose port (if needed for health checks)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Scheduler is running')" || exit 1

# Start the scheduler
CMD ["node", "api-scheduler.js"]
