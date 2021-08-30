# Overview
This API contains implementation for the the University of Washington's Student Veteran Life log in application.

# API Usage Requirements

## Authorization Header
In order for a client to communicate with this API, an authorization header must be present on the request.
The API uses [HTTP Basic Authorization](https://en.wikipedia.org/wiki/Basic_access_authentication) with
the credentials being encoded in `base64` using the schema `username:password`. A sample request header is
included below.

```js
let username = 'username';
let password = 'password';
let authCredential = username + ':' + password;

// btoa() is the native JavaScript implementation of string to base64 encoding
let encodedData = btoa(authCredential);

// encodedData has a value of dXNlcm5hbWU6cGFzc3dvcmQ=

// Create the set of request headers
let requestHeaders = new Headers();
requestHeaders.append('Authorization', `Basic ${encodedData}`);

// Create a request with our headers
let myRequest = new Request('resource-uri', {
  method: 'GET',
  headers: requestHeaders
});

await fetch(myRequest);
```

The above example uses a username and password then creates a base64 encoded string to submit to the API
as a part of the `Authorization` header.

## Requests
All request parameters are passed in via a JSON body. The API *DOES NOT* use any form data or binary data
to submit data to the API.

## Responses
All responses are returned with an appropriate status code as well as a JSON object attached in the response body. Regardless of wehther or not a request was successful, every response has a JSON object with a `text`
key that can provide more insight if a request fails to go through.

In this case the API returns a 401 (Forbidden) error, you would get a JSON response that looks like:
```JSON
{
  "text": "Authorization credentials are incorrect, please try again."
}
```

If you submit a malformed request, you would see something along the lines of:
```JSON
{
  "text": "Please make sure you include all attributes for this request"
}
```

**Always check the text of a response if you need more context as to why a request may have failed.**

# Logging a User - POST
The `/logUser` endpoint is a post request that logs a user's sign in operation.

Each request must have a body as a follows:
```JSON
{
  "name": "Student name",
  "netid": "Student's net id",
  "sid": 1234567,
  "reason": "Studying"
}
```

Upon a successful request, the server will return a response that looks like:
```JSON
{
  "name": "Student name",
  "netid": "Student's net id",
  "sid": 1234567,
  "reason": "Studying",
  "timestamp": "2021-08-30T00:19:15.882Z",
  "text": "Student name has successfully signed in at Sun Aug 29 2021 17:19:15 GMT-0700 (Pacific Daylight Time)"
}
```