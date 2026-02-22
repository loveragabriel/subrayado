# Node image
FROM node:18-alpine

# Work directory
WORKDIR /app

# Copy package.json and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Cpy the rest of the application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application with
CMD ["npm", "run", "start:dev"]