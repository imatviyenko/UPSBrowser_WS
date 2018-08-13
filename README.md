# Node.js web service template optimized for running in Docker Swarm environment
The generated application (web service) template has the following features:
- npm scripts for deploying to Docker Swarm and for creating Docker secrets - PowerShell version for Windows and Shell scripts for Unix/Linux;;
- https binding only, uses several techniques available in the helmet npm module for mitigating common web security risk;
- supports http basic authentication scheme via the passport framework out of the box;
- can be run in the development mode on the local node.js instance without Docker;
- uses a verbose custom JSON logging format with Correlation ID tracking and optionally redirects logs from running Docker containers to fluentd forwarders on Docker hosts for further processing in MS Azure Logs Analytics.


## Running in dev mode locally

### Starting application
**npm start**
*This command will run your application in development mode on your computer with your local node.js instance*

### Accessing anonymous path
- To access your application, open this URL in the browser: https://localhost:3000 and make sure you get a JSON response
- Ignore all SSL certificate warnings as the development mode uses a self signed SSL cert 
- Also note that the sample route provided in the generated project is programmed to throw errors for every third request


### Accessing secured path with HTTP basic authentication
Open https://localhost:3000/secured in the browser and you should get an "Unauthorized" error message.
This is because you must provide valid credentials using the HTTP basic authentication scheme to access this path.

Now use some tool like Chrome Postman or Insomnia to send a GET request to this path using HTTP basic authentication.
The valid credentials are as follows:  
**user: user1**  
**password: 111**  


## Deploying to Docker Swarm

### Prerequisites
- You must have a properly configured Docker Swarm.
- A local Docker registry must be available in the Swarm, and its address (e.g., docker.company.com:5000 ) must be provided when you run the generator as the 'Docker registry path ... ' option.
- Your workstation must be configured for accessing Docker Swarm, i.e. all certificates and env variables must be in place. Running 'docker info' in the shell prompt must return information about the remote Docker Swarm manager machine.
- You have to decide which hostname and URL to use for publishing your application. Depending on this choice, you will have to generate or obtain in some other way a SSL certificate issued for the FQDN that the users will use to access your application. This SSL certificate will be made available to your application via the Docker secrets mechanism described below and will be used to create a node.js https binding. This same certificate can also be used by a load balancer (external or deployed on Docker Swarm) to reverse proxy your application. More information about the options for publishing your applications in Docker Swarm environment can be found below.
- You must create Docker Swarm secrets according to the instructions below before you deploy your application to the Docker Swarm.

### Publishing and load balancing
When your application is published to the Docker Swarm, the swarm routing mesh ensures that the application can accessed by connecting to any Docker host in the swarm at the TCP port dedicated for this application (this TCP port is entered as a parameter when you run the generator). So each service/application is assigned a dedicated TCP port and is accessible at this port via any Docker host. For example, two separate applications can be accessed at the following URLs, given that the DNS name 'docker.company.com' maps to the IP address of one or more Docker hosts in the swarm:

| Application | TCP Port | URL                            |
|-------------|----------|--------------------------------|
|App 1        |4021      | https://docker.company.com:4021|
|App 2        |4398      | https://docker.company.com:4398|

So the first option is to always access your application at these automatically provided URLs with separate port numbers for each application. In this case it is however very important to make sure that the FQDN docker.company.com points to at least one of the live Docker hosts.

However, there is also an option to publish your application at a more friendly public 'vanity' URL. This approach is often used when you load balance (reverse proxy) your application via some load balancer, which can be either external or deployed as a service to the Docker Swarm side-by-side with your applications. The DNS record of your 'vanity' URL is pointing to the IP address of the load balancer which is configured to proxy incoming network connections to all live backend IP addresses of the Docker hosts. Remember, that due to the swarm routing mesh your application is accessible through any host, even through those which do not run your application's container. An example of this configuration with a 'vanity' URL is described below:  
**internal backend URL: https://docker.company.com:4021**  
**public (vanity) URL: https://app1.company.com**  

### Docker Swarm secrets
Docker secrets is a mechanism for protecting confidential configuration information, such as passwords and certificate private keys, from unauthorized access. As a part of application deployment process, the developer or admin creates secrets on the Docker Swarm by via Docker command line interface. Each piece of configuration information, e.q., a single password or the  private key for a particular certificate, is created as a separate secret object. In a running Docker container secrets are accessible as files in the  '/run/secrets' folder.
When you create a secret, which is usually done only once during the initial deployment of the application, you have to provide the value for it. This value can be entered directly in the command prompt or some existing file can be used as a source for it. Whichever method is used, you have to ensure that secrets are created in a safe way from a trusted workstation. After secrets are created they are stored in the Docker Swarm in an secure encrypted form.
This project template is configured to use these four secrets:
- sslcert.cert (public part of the SSL certificate used for creating https binding in the application code)
- sslcert.key (private key of the SSL certificate)
- sslcert.pem (the previous two file concatenated - used for swarm-deployed HAProxy load balancer)
- users.json (json file containing logins and clear text passwords for http basic authentication)

The deployment scripts in this template assume that these secrets will be created from source files which must be stored in 'config\prod-secrets' folder in the project. This folder:
- **MUST BE PROTECTED FROM UNAUTHORIZED ACCESS!**
- Is excluded from source control (via .gitignore)
- May best be used in such a way, that the actual source files are only stored in this folder temporary when secrets are created on the Docker Swarm via the provided scripts and are immediately deleted from this folder afterwards

#### Step-by-step instructions for creating Docker Swarm secrets
1. Create/obtain SSL certificate for your application.
2. Store this certificate as two separate file with the exact names **sslcert.cert** and **sslcert.key** in the 'config\prod-secrets' folder. The first file should contain the public certificate in the base64 encoded PEM format (RFC 7468) and the second one if for the **unencrypted** private key in the base64 encoding. You may have to use openssl command line tools and spend some time googling if you got your certificate in a single file PFX format. Then concatenate these two file (**sslcert.cert** first) to get the third file named **sslcert.pem**. This third file can be used by certain services which require certificates to be in combined cert/key PEM  format (for example, HAProxy service deployed to the swarm).
3. Create a json file 'users.json' as per example below, enter data for all logins that should have authenticated access to your web service and save this file the same 'config\prod-secrets' folder.
4. Run **npm run secrets:deploy** command. This npm script will check if all three required source files are present in the 'config\prod-secrets' folder and create Docker Swarm secrets for your application.
5. Remove source files which have been used to create the secrets from 'config\prod-secrets' folder as they are no longer needed. **NEVER LEAVE SUCH CRITICAL DATA SCATTERD AROUND THE FOLDERS ON YOUR MACHINE!**

#### Example of users.json
```javascript
[
  {
    "username": "user1",
    "password": "111"
  },
  {
    "username": "user2",
    "password": "222"
  }
]
```


### Deploy application to Docker Swarm
The overall process for deploying your application to Docker Swarm is outlined below:
1. Make sure that the prerequisites described above in the document are met.
2. Deploy Docker secrets per the instructions in the previous subsection.
3. Run **npm run deploy** command. This npm script will use PowerShell scripts and information from various configuration files to: 
    - build Docker image for your application 
    - deploy the image to local Docker repository on your Swarm
    - create a Docker Swarm stack and service for your application based on the deployed image
4. After the previous step, your application should be accessible via any Docker host in the swarm at the TCP port that you specified when you ran the generator. However, usually the next step would be to publish your application using a nice 'vanity' URL, which will require changes to DNS and some reconfiguration of the load balancer (which can be either standalone or deployed as a part of the swarm infrastructure).
