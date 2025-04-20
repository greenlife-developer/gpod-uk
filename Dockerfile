# Use the official Node.js 18 image as a base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of your code
COPY . .

# Expose the port (App Platform uses the PORT env variable)
EXPOSE 5000

# Use environment variable PORT or default to 5000
ENV PORT=5000

# Start the app
CMD ["npm", "start"]
