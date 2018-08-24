# External users web service for SharePoint UPSBrowser tool

## Overview
- this web service is supposed to be used as an external data source for UPSBrowser tool for SharePoint (https://github.com/imatviyenko/UPSBrowser);
- retrieves users from the configured LDAP directory and sends them to the caller as JSON data;
- designed to be deployed to Docker Swarm environment;
- can be started locally in development mode without Docker;
- requires Docker Swarm secrets and configs to be created to run in the production mode;
- all routes are protected with passport-jwt authentication middleware, calling applications running on client machines must send a singed JWT token in the Authorization header of the HTTP requests they initiate (bearer auth scheme);


## Features
This web service has the following features:
- npm scripts for deploying to Docker Swarm and for creating Docker secrets - PowerShell version for Windows and Shell scripts for Unix/Linux;;
- https binding only, uses several techniques available in the helmet npm module for mitigating common web security risk;
- supports http basic authentication scheme via the passport framework out of the box;
- can be run in the development mode on the local node.js instance without Docker;
- uses a verbose custom JSON logging format with Correlation ID tracking and optionally redirects logs from running Docker containers to fluentd forwarders on Docker hosts for further processing in MS Azure Logs Analytics.


## Running in dev mode locally

### Starting application
**npm start**
*This command will run your application in development mode on your computer with your local node.js instance*

## Deploying to Docker Swarm

### Prerequisites
- You must have a properly configured Docker Swarm.
- A local Docker registry must be available in the Swarm;
- Your workstation must be configured for accessing Docker Swarm, i.e. all certificates and env variables must be in place. Running 'docker info' in the shell prompt must return information about the remote Docker Swarm manager machine.
- You have to decide which hostname and URL to use for publishing your application. Depending on this choice, you will have to generate or obtain in some other way a SSL certificate issued for the FQDN that the users will use to access your application. This SSL certificate will be made available to your application via the Docker secrets mechanism described below and will be used to create a node.js https binding. This same certificate can also be used by a load balancer (external or deployed on Docker Swarm) to reverse proxy your application. More information about the options for publishing your applications in Docker Swarm environment can be found below.
- You must create Docker Swarm secrets according to the instructions below before you deploy your application to the Docker Swarm;
- You must create Docker Swarm configs according to the instructions below before you deploy your application to the Docker Swarm.

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
This project is configured to use these secrets:
- sslcert.cert (public part of the SSL certificate used for creating https binding in the application code)
- sslcert.key (private key of the SSL certificate)
- sslcert.pem (the previous two file concatenated - used for swarm-deployed HAProxy load balancer)
- clent1.cert, clent2.cert, .... (public keys of trusted client certificates, used for passport-jwt authentication)
- ldapUserLogin (text file with login to be used for authentication against LDAP server)
- ldapUserPassword (text file with password to be used for authentication against LDAP server)

The deployment scripts in this template assume that these secrets will be created from source files which must be stored in 'config\PROD-SECRETS-SENSITIVE' folder in the project. This folder:
- **MUST BE PROTECTED FROM UNAUTHORIZED ACCESS!**
- Is excluded from source control (via .gitignore)
- May best be used in such a way, that the actual source files are only stored in this folder temporary when secrets are created on the Docker Swarm via the provided scripts and are immediately deleted from this folder afterwards

#### Step-by-step instructions for creating Docker Swarm secrets
1. Create/obtain SSL certificate for your application.
2. Store this certificate as two separate file with the exact names **sslcert.cert** and **sslcert.key** in the 'config\PROD-SECRETS-SENSITIVE' folder. The first file should contain the public certificate in the base64 encoded PEM format (RFC 7468) and the second one if for the **unencrypted** private key in the base64 encoding. You may have to use openssl command line tools and spend some time googling if you got your certificate in a single file PFX format. Then concatenate these two file (**sslcert.cert** first) to get the third file named **sslcert.pem**. This third file can be used by certain services which require certificates to be in combined cert/key PEM  format (for example, HAProxy service deployed to the swarm).
3. Create text files 'ldapUserLogin' and 'ldapUserPassword' in 'config\PROD-SECRETS-SENSITIVE' folder with login and password to be used for authentication when connecting to LDAP server.
4. Export client certificates which will be used by the calling applications running on client machines to sign JWT tokens. Only public certificates need to be exported in PEM format (BASE64 encoded). Each client certificate must be saved in the 'config\PROD-SECRETS-SENSITIVE' folder in the file named exactly as the the value of the "friendlyName" attribute of JWT tokens generated by this client which will usually be equal to the "Friendly name" attribute of the certificate itself. For example, the supposed scenario is as follows: 
  - we have an application named "app1" running on a trusted client machine "client1.company.com";
  - this application uses a certificate for generating and signing JWT tokens;
  - this certificate is installed locally on the client machine "client1.company.com";
  - this certificate contains a "Friendly Name" attribute with the value of "certificate1";
  - the code of "app1" inserts JWT claim "friendlyName" with the value of "certificate1" in the generated token;
  - before we deploy the secrets to Docker swarm, we export the client certificate from "client1.company.com" machine in PEM format and save it as 'config\PROD-SECRETS-SENSITIVE\certificate1.cert';
5. Run **npm run secrets:deploy** command. This npm script will check if all three required source files are present in the 'config\PROD-SECRETS-SENSITIVE' folder and create Docker Swarm secrets for your application.
6. Remove source files which have been used to create the secrets from 'config\PROD-SECRETS-SENSITIVE' folder as they are no longer needed. **NEVER LEAVE SUCH CRITICAL DATA SCATTERD AROUND THE FOLDERS ON YOUR MACHINE!**

### Docker Swarm configs
Docker Swarm configs is a mechanism for storing configuration information as swarm objects, accessible to all nodes and containerized applications running in the swarm. Configs are very similar to Docker Swarm secrets, the real difference being that they are not as much protected by encryption. This Swarm functionality can be used for storing non-sensitive configuration data for application, such as various .json configuration files.
This project uses on Swarm config object named 'upsbrowser_ws_config' which is mounted as '/run/config.json' file in the running container. This file contains such things as the http port number to node.js instance bind to and non-sensitive LDAP parameters, such as the LDAP server hostname.
There are two 'source' config files used in different ways by the code in 'config.js' module in 'production' and 'development' modes:
- file 'config\dev-config.json' is used in 'development' mode (that is, locally started node.js instance) is directly imported by this module to provide config values appropriate for test/development runs of application;
- file 'config\prod-config.json' is used in 'production' mode (when application is deployed to Docker Swarm) as the source data for creating Swarm config object, which will be later accessible as '/run/config.json' in the running application.

#### Step-by-step instructions for creating Docker Swarm config
1. Edit the existing 'config\prod-config.json' file and fill in configuration parameters you would like to use in production.
2. Run **npm run config:deploy** command. This npm script will create Docker Swarm config object named 'upsbrowser_ws_config', using the file 'config\prod-config.json' as the source for its contents. This config object will be mounted as '/run/config.json' when the application is deployed to the swarm.



### Deploy application to Docker Swarm
The overall process for deploying your application to Docker Swarm is outlined below:
1. Make sure that the prerequisites described above in the document are met.
2. Deploy Docker secrets per the instructions in the previous subsection.
3. Run **npm run deploy** command. This npm script will use PowerShell scripts and information from various configuration files to: 
    - build Docker image for your application 
    - deploy the image to local Docker repository on your Swarm
    - create a Docker Swarm stack and service for your application based on the deployed image
4. After the previous step, your application should be accessible via any Docker host in the swarm at the TCP port that you specified when you ran the generator. However, usually the next step would be to publish your application using a nice 'vanity' URL, which will require changes to DNS and some reconfiguration of the load balancer (which can be either standalone or deployed as a part of the swarm infrastructure).
