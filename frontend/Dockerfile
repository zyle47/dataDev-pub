# Use the latest LTS version of Node.js
FROM node:18-alpine

<<<<<<< Updated upstream
# Set the working directory inside the container
WORKDIR /frontend
=======
WORKDIR /app/frontend
>>>>>>> Stashed changes

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install
RUN npm install react-scripts@latest
RUN npm install ajv@latest
RUN npm install axios@latest
RUN npm install cors@latest
RUN npm install babel@latest

<<<<<<< Updated upstream
# Copy the rest of your application files
COPY . .
=======
# COPY . .
>>>>>>> Stashed changes

# Expose the port your app runs on
EXPOSE 3000

# Define the command to run your app
CMD ["npm", "start"]