FROM node:slim

# The app runs with the default logging level 'info' when deployed to Docker in production mode.
# Howerver, it is possible to override the logging level by setting the env variable LOG_LEVEL to one of the winston log levels.
# For example, run this command to temporary set the logging level to debug for all the containers making up a Docker service:
# docker service update --env-add LOG_LEVEL=debug <SERVICE_NAME>
ENV NODE_ENV 'production'

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY package*.json ./

# RUN npm install

# Copy the application source to the working dir inside the container
COPY . .

# Make app port  available to the world outside this container
EXPOSE 3000

# Run the app when the container launches
CMD [ "node", "/app/index.js" ]
