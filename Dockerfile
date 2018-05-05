FROM kc-docker1.kcell.kz:5000/node1


# Set proxy server settings which will be apllied INSIDE the running container
ENV http_proxy http://192.168.190.168:8080/
ENV https_proxy http://192.168.190.168:8080/


# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY package*.json ./

RUN npm install

# Copy the application source to the working dir inside the container
COPY . .

# Make port 80 available to the world outside this container
EXPOSE 8080

# Run the app when the container launches
CMD [ "npm", "start" ]
