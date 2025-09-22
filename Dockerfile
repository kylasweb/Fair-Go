# Use Node.js 18 Alpine image for smaller size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps (skip postinstall)
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy application code (including prisma directory)
COPY . .

# Generate Prisma client (now that schema is available)
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]