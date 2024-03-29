# Overview
This repository contains a full stack application for managing user logins through a kiosk. The 
application consists of the following resources running on an Azure cloud environment:
- Web App running NodeJS
- CosmosDB for NoSQL
- Azure KeyVault

## Infrastructure Overview
### Azure KeyVault
The Azure KeyVault is used to contain any database connection strings required by the application.
Additionally, it also contains the PFX certificate needed to communicate with UW's ID card
reader and person search API services. For additional information, please contact UW ID
as this is out of scope for this documentation.

### CosmosDB for NoSQL
A CosmosDB instance is used for keeping track of application data such as login events
or possible login options. It is not necessary that you use the specific `CosmosDB for NoSQL`
offering, the `CosmosDB for MongoDB` offering may work but it could potentially require 
alterations on the backend.

### Web App running NodeJS
A web app running NodeJS is needed to use this application. It is highly recommended to use
the latest long-term support version of NodeJS offered by Azure as this application does not
have any requirements to be ran on an older NodeJS runtime.

## Dependencies of Application
The main dependencies of this application are the following services provided by UW IT:
- ID Card Reader service
- Person Search API service

These are both out of scope for this documentation and you may want to reach out to UW IT for 
further information.

In order to interact with these services, you will need a valid PFX certificate
granted by UW's certificate authority (known as UWCA). This is also out of scope for
this documentation but more can be found out by contacting UW IT.

# Data Retention Policies
Information stored for this application is [FERPA](https://www2.ed.gov/policy/gen/guid/fpco/ferpa/index.html)
sensitive. As such, there are data retention policies in place to delete data older than
a certain timeframe to limit any possible data leakage if it were to happen. The timeframes
are summarized down below. TTL (time-to-live) in CosmosDB is specified by seconds.

| Environment | Record TTL (time-to-live) |
|-------------|---------------------------|
| Production | 7,776,000 seconds (90 days) |
| Staging | 86,400 seconds (1 day) |
| Development | 3,600 seconds (1 hour) |