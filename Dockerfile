# Use Node.js 18 (regular Debian-based image for better compatibility)
FROM node:18

# Set working directory
WORKDIR /app

# Install Python and build tools for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps (skip postinstall initially)
RUN npm install --legacy-peer-deps --ignore-scripts

# Force reinstall LightningCSS to ensure native binaries are properly built
RUN npm install lightningcss --force

# Force reinstall TailwindCSS Oxide native module
RUN npm install @tailwindcss/oxide --force

# Force reinstall esbuild and its platform-specific binaries for tsx runtime
RUN npm install esbuild @esbuild/linux-x64 --force

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