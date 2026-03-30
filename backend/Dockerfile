# - Builder -
FROM node:18-alpine as builder

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
RUN npm run build

# - Runner -
FROM node:20-alpine as runner 

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
RUN apk add --no-cache netcat-openbsd

# Expose t-a port the app runs on
EXPOSE 3000

# Start the application with
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
