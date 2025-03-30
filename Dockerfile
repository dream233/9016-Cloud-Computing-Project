# Use official Node.js runtime
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Make sure uploads folder exists
RUN mkdir -p public/uploads

# Expose app port
EXPOSE 3000

# Start the app
CMD ["node", "app.js"]
