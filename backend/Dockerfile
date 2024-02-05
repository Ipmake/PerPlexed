# Use the official Node.js 20 image as the base image
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install the app dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Expose the port on which the app will run
EXPOSE 3000

# Start the app
CMD [ "npm", "run", "dev" ]