FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy project source files
COPY server.js ./
COPY public_apk ./public_apk
COPY public ./public

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose app port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
