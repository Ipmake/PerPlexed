# Use the official Node.js 20 image as the base image
FROM node:20-bookworm-slim as backend_builder

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the container
COPY backend/package*.json ./

# Install the app dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY backend .

RUN npm run build


FROM node:20-bookworm-slim as frontend_builder

WORKDIR /app

COPY frontend/package*.json ./

# Install the app dependencies
RUN npm install

COPY frontend .

RUN npm run build

FROM node:20-bookworm-slim  as runner
# Expose the port on which the app will run

WORKDIR /app

COPY --from=backend_builder /app/build/index.js .
COPY --from=frontend_builder /app/build ./www

EXPOSE 3000
# Start the app
CMD [ "node", "index.js" ]