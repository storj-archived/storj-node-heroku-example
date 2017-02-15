# A Storj-Node Heroku Application

A Node.js app using [Express 4](http://expressjs.com/), with jQuery on the client. This application starts out ready for you to roll (aside from adding your own [`.env` file](#setup) which you'll populate with your Storj credentials). If you'd like to build everything out step by step, a `barebones` branch is provided for you and you can use the [videos](https://www.youtube.com/playlist?list=PLEr5Xx0gHvFG55T-_kLKlWosSBw32vP9N) and/or [written](#tutorial) tutorials.

## Prerequisites

- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
- [Node.js](http://nodejs.org) > v6.9.1
- [Nodemon](https://github.com/remy/nodemon)

## Contents
1. [Getting Started](#getting-started)
  2. [Clone Repo](#clone-repo)
  3. [Deploy App to Heroku](#deploy-app-to-heroku)
  4. [Add Storj Add-on](#add-storj-add-on)
  5. [Get Storj Credentials](#get-storj-credentials)
  6. [Setup](#setup)
  7. [Running Application Locally](#running-application-locally)
2. [Documentation](#documentation)
3. [Tutorial](#tutorial)
    1. [Deploying Demo Application](#deploying-demo-application)
    2. [Adding Storj Add-on](#adding-storj-add-on)
    3. [Activating Storj Account](#activating-storj-account)
    4. [Exploring Demo Application](#exploring-demo-application)
    5. [Application Setup and Authentication](#application-setup-and-authentication)
    6. [Key Pairs](#key-pairs)
    7. [Create and List Buckets](#create-and-list-buckets)
    8. [Upload File](#upload-file)
    9. [List Files](#list-files)
    10. [Download Files](#download-files)
    11. [Pushing to Heroku](#pushing-to-heroku)
    12. [Summary and Additional Resources](#summary-and-additional-resources)

# Getting Started

This section assumes you just want to get up and running with a working Heroku Application using Storj. You'll be able to authenticate with Storj, create key pairs, create buckets, and upload and download a file. If you want to dive in, head to the [Tutorial](#tutorial) section.

## Clone Repo

```sh
$ git clone https://github.com:Storj/storj-node-heroku-example.git # or fork and clone your own
$ cd storj-node-heroku-example
$ npm install
```

## Deploy App to Heroku

Please pick Option 1 _or_ Option 2. If you do both you will just have two applications :)

### Option 1 - Click This Button

For super duper easy deployment, click this button. It will create a Heroku application based on this repo and deploy it for you.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

Once it's deployed, hook up your repo to Heroku so you can make future changes with:

```sh
$ git remote add heroku https://git.heroku.com/APP-NAME.git
```

(Note: replace `APP-NAME` with the name of your Heroku application)

Now, when you make changes locally and want to push them up, you can use the following command to deploy those changes:

```sh
$ git push heroku master
```

### Option 2 - Use Heroku CLI

If you want to do this manually, it's only a few easy steps. First, you'll need to make sure you have logged into your Heroku account:

```
$ heroku login
```

After logging in, you can create a Heroku application.

```sh
$ heroku create APP-NAME
```

(Note: Replace `APP-NAME` with what you want to call your application)

You'll see output similar to this:

```sh
Creating ⬢ storj-heroku-tutorial-0203... done
https://storj-heroku-tutorial-0203.herokuapp.com/ | https://git.heroku.com/storj-heroku-tutorial-0203.git
```

Now, we'll push this to a heroku branch for deployment (you'll also use this same command to push up any local changes you've made for deployment):

```sh
$ git push heroku master
```

Once that's done building, you can open your app with:

```sh
$ heroku open
```

## Add Storj Add-on

Now that you've deployed the Node application to Heroku, you can add the Storj Add-on so you can start using Storj. Hobbyist is our free plan. You can see other plan options [here](https://elements.heroku.com/addons/storj).

You can do this via the Heroku GUI (instructions [here](#adding-storj-add-on)), or use the Heroku CLI:

```sh
$ heroku addons:create storj:hobbyist --app APP-NAME
```

You should see output similar to this:

 ```sh
Creating storj:hobbyist on ⬢ storj-heroku-tutorial-0203... free
Created storj-lively-57745 as STORJ_EMAIL, STORJ_PASSWORD
Use heroku addons:docs storj to view documentation
```

## Get Storj Credentials

When you add Storj as an Add-on, a Storj account was generated for you. You can retrieve your credentials with:

```sh
$ heroku config:get STORJ_PASSWORD
$ heroku config:get STORJ_EMAIL
```

If you already have a Storj account that you'd like to use instead (or you want to sign up for one [here](https://storj.io and use it), then you can replace these config variables with:

```sh
$ heroku config:set STORJ_PASSWORD=your_password STORJ_EMAIL=your_email
```

## Setup

Now that you've got your application cloned and connected to Heroku, you'll need to create a `.env` file to hold your Storj config variables. This will allow you to easily run the app on your local environment.

1. Create a `.env` file in the root of the project `touch .env`
2. Add `STORJ_EMAIL` and `STORJ_PASSWORD` credentials to it in `KEY=VALUE` format

  ```
  STORJ_EMAIL=email@email.com
  STORJ_PASSWORD=password
  ```

## Running Application Locally

Now that we've got all that setup out of the way, we can run the application locally. There are two ways to run your application - `heroku local web` and `npm start`.

Running `heroku local web` will pull environment variables from the `.env` file. This is why we created the `.env` file in the previous step.

You can also use `npm start`, but you will need to pass in variables at that time:

```sh
$ STORJ_EMAIL=email@email.com STORJ_PASSWORD=password npm start
```

After running one of those commands, your app should now be running on [localhost:5000](http://localhost:5000/). Yay!

Checkout the [Tutorial](#tutorial) for more details on how the application works and what you can do.

## Documentation

For more information about using Storj on Heroku, check out this [article](https://devcenter.heroku.com/articles/storj).

For more information about using Node.js on Heroku, see these Dev Center articles:

- [Getting Started with Node.js on Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
- [Heroku Node.js Support](https://devcenter.heroku.com/articles/nodejs-support)
- [Node.js on Heroku](https://devcenter.heroku.com/categories/nodejs)
- [Best Practices for Node.js Development](https://devcenter.heroku.com/articles/node-best-practices)
- [Using WebSockets on Heroku with Node.js](https://devcenter.heroku.com/articles/node-websockets)

# Tutorial

## Deploying Demo Application

1. [Login](https://id.heroku.com/login) or [Signup](https://signup.heroku.com) for a Heroku account
2. Go to: https://github.com/storj/storj-node-heroku-example
3. Fork repo
3. Click “Deploy to Heroku” badge
4. Type in an _App Name_ if you want (Heroku will generate one for you if left blank)
5. Select country in _Runtime Selection_
6. Click _Deploy_ and wait for all steps to complete successfully
7. Click _Manage App_ and you will be taken to the _Overview_ tab for your newly deployed application (before you can view your app, you’ll need to add *Storj* as an add-on)
    - If you select _View_ before doing this, a window will open up with your application address, but you’ll get an _Application Error_)
8. Click on the _Resources_ tab for your application

## Adding Storj Add-on

1. Search for and select *‘Storj’* in _Add-ons_ section
2. Select _Plan_ name
 - Storj offers a generous free tier to start you out and additional tiers at around half the price of any other cloud storage option on Heroku
3. Click _Provision_
4. You’ll see:
_‘The addon storj has been successfully installed. Check out the documentation in its Dev Center article to get started.’_

## Activating Storj Account

### Storj Config Variables

Provisioning Storj automatically creates an account for you on [Storj.io](https://app.storj.io), and generates two config variables:
`STORJ_EMAIL` and `STORJ_PASSWORD`.

You can see these by going to the _‘Settings’_ tab and clicking on the _‘Reveal Config Vars’_ button in the Config Variables section.

You’ll use these same credentials to log into [storj.io](https://app.storj.io).

### Email Confirmation
You’ll also receive an email from *robot@storj.io*. This email will go to the account that you used when you signed up for your Heroku account.

Confirming the email will open up a tab/window indicating you’ve been activated. It will return some JSON that looks like this:

```json
{
  "activated": true,
  "created": "2016-11-10T17:51:14.793Z",
  "email": "<your STORJ_EMAIL config variable>@heroku.storj.io",
  "id": "<your STORJ_EMAIL config variable>@heroku.storj.io"
}
```

## Exploring Demo Application

### Prerequisites

- Github account
- Heroku account
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-command-line) installed

### Demo Application Overview

Now that we’ve activated our Storj account, we should be able to go back to our demo application and open it up without any problems.

In this demo application, we’ve added some handy links up in the navigation bar. If you’re new to Heroku and/or Node, or just need a refresher, take some time to go to these links and familiarize yourself with how they work.

There is also a link to join the [Storj Community](https://storj.io/community.html) on Rocket.Chat, a link that will take you to Storj’s Dev Center, and a link to our Quickstart Guide.

Our goal with building out this demo application is to get familiar with Storj’s API and get you to a point where you can integrate Storj into other applications. For our example application scenario here, we’re going to upload a grumpy cat image and display it in this box.

If you scroll down, you’ll see all these different sections for Basic Authentication, Key Pairs, Buckets, and Files. Over the next couple videos, we’ll walk through each of these sections and code them out so we can display the grumpy cat image.

### Setting Up Code to Push to Heroku

Heroku makes it pretty easy to work on your code, and then push and deploy those changes.

Make sure you’ve logged into Heroku via the CLI:

```sh
$ heroku login
```

Enter your credentials.

Once you’ve done that, pull the code down and then link it to our existing Heroku application. Note: You can still link the repo with your Heroku application, but you won’t be able to push to it until you log in with the Heroku CLI.

### Fork and Clone Repo

Fork the [example repo](https://github.com/storj/storj-node-heroku-example) if you haven’t done so already.

Navigate to your forked copy of the repo.
Hint: it’s going to be `https://github.com/<your username>/storj-node-heroku-example`

Click on the green `’Clone or download’` button, and copy the appropriate link. If you’re linked to Github via [SSH](https://help.github.com/categories/ssh/), use the SSH link, otherwise, use the HTTPS link.

In your terminal, navigate to where you want to put this file and then clone the project:

If SSH it will look like this:

```sh
$ git clone git@github.com:<your github username>/storj-node-heroku-example.git
```

If HTTPS it will look like this:

```sh
$ git clone https://github.com/<your github username>/storj-node-heroku-example.git
```

Once it’s done cloning, navigate into the project:

```sh
$ cd storj-node-heroku-example
```

### Link Project Repo to Heroku Application

We need to link up our project to Heroku, that way when we push to Heroku it will rebuild the project with all our changes we make locally.

We can check our remote repos with the following command:

```sh
git remote -v
```

You’ll probably see something like this:

```sh
origin	git@github.com:barbaraliau/storj-node-heroku-example.git (fetch)
origin  	git@github.com:barbaraliau/storj-node-heroku-example.git (push)
```

We want to add a remote branch called `heroku`. By default, this is the branch name Heroku will look for so it knows to rebuild when you push changes to it.

Let’s add a remote branch that points to our Heroku application:

```sh
$ git remote add heroku https://git.heroku.com/<project name>.git
```

Make sure to change the code and put your project name there.

Now when we run `git remote -v`, we should see a heroku branch:

```sh
heroku	  https://git.heroku.com/use-storj-tutorial.git (fetch)
heroku	  https://git.heroku.com/use-storj-tutorial.git (push)
origin	  git@github.com:barbaraliau/storj-node-heroku-example.git (fetch)
origin	  git@github.com:barbaraliau/storj-node-heroku-example.git (push)
```

That’s all we need to link our repo to our Heroku application. Now we can work on our code locally, and when we make changes and run `git push heroku master`, Heroku will know that it needs to rebuild and redeploy the application with our changes.

## Application Setup and Authentication

### Boilerplate Code Walkthrough

Since the purpose of this tutorial is to focus on Storj code, we’ve built out the client and started the Express code. On the front-end we’ll be using jQuery, but you can easily take what we’re doing and apply it to React, Angular, Vue, or any other library/framework, since most of the Storj-specific code is going to be done on the backend.

What we’re going to do is use these buttons here as a task list. We’re going to build out the code in this order.

Before we start coding, remember to run `npm i` to install dependencies and then let’s get some setup out of the way.

### Running Heroku Locally

If you remember a `STORJ_EMAIL` and `STORJ_PASSWORD` was created for us when we provisioned the Storj Add-on. This is stored in our Heroku deployment, but we can’t access that locally. So the first thing we’ll want to do is create a `.env` file and then copy those variables over. We can then reference them using `process.env` in our code.

Heroku looks for the values in `KEY=VALUE` format.

Let’s make a `.env` file in the root of our project.

```sh
$ touch .env
```

Copy the Config Vars from our Heroku Settings and paste them in like so:

```
STORJ_EMAIL=0d955385-de1d-4e56-ad92-bfcc8e2a1412@heroku.storj.io
STORJ_PASSWORD=xpnTaqp7U0sMJNrWxeCr7GcLrluLcpojLQRWZxx0nthj
```

Now when we run our code using `heroku local web`, our Config Vars will be read from this file.

Note that this file is in our `.gitignore`. You want to keep this variables private.

### Authentication

#### Show Credentials

Going back to our application, we can see that our first button is ‘Show Credentials’. All this really is is an endpoint that will return our Config Vars. You wouldn’t really do this in an application, but we’re going to do this to make sure our constants are set correctly.

Let’s wire up our button:

`app.js`

```javascript
// Get client info
$('.credentials-btn--show').on('click', function(event) {
  event.preventDefault();
  console.log('Show Credentials button clicked');
  $.ajax({
    method: 'GET',
    url: '/user/retrieve'
  }).done(function(credentials) {
    $('.credentials--username').html(`Username: ${credentials.email}`);
    $('.credentials--password').html(`Password: ${credentials.password}`);
  });
});
```

In `index.js` we’re going to add these two variables:

```javascript
var STORJ_EMAIL = process.env.STORJ_EMAIL;
var STORJ_PASSWORD = process.env.STORJ_PASSWORD;
```

This is going to pull the value from the `.env` file that we created earlier, and then assign it to a variable.

We’re going to be using these two variables as a pair, so let’s go ahead an assign it to an object.

`index.js`

```javascript
var storjCredentials = {
  email: STORJ_EMAIL,
  password: STORJ_PASSWORd
};
```

Make the endpoint:

`index.js`

```javascript
// Retrieve credentials
app.get('/user/retrieve', function(req, res) {
  console.log('Retrieving basic auth credentials');
  res.status(200).send(storjCredentials);
});
```

Now, we should be able to run `heroku local web`, navigate to `localhost:5000`, and then when we click on `’Show Credentials’`, our credentials should display.

#### Basic Authentication

Since we know our credentials are good, we can go ahead and authenticate with Storj. There are two ways to authenticate with Storj: 1) basic authentication using email and password credentials, and 2) using a generated key pair. In order to do #2, we’ll first need to use #1.

Setup our button in `app.js`:

```javascript
// Authenticate client
$('.auth-btn').on('click', function(event) {
  event.preventDefault();
  console.log('Authenticate button clicked');

  $.ajax({
    method: 'GET',
    url: '/user/authenticate/user-pass'
  }).done(function(result) {
    if (result === 'successful') {
      $('.auth-result')
        .html('Authentication with basic auth successful!')
        .css('color', 'green');
    } else {
      $('.auth-result')
        .html('Authentication failed')
        .css('color', 'red');
    }
  });
});
```

We’re going to be using the storj api, so we’ll need to require storj and set the api address. We also need to create a ‘client’ variable to assign our authenticated client to.

`index.js`

```javascript
var storj = require('storj-lib');
var api = 'https://api.storj.io';
var client;
```

Create our endpoint:

```javascript
// Authenticate with username/password
app.get('/user/authenticate/user-pass', function(req, res) {
  client = storj.BridgeClient(api, { basicAuth: storjCredentials });
  console.log('Logged in with basic auth');
  res.status(200).send('successful')
});
```

Now that we’re authenticated, we can do a bunch of stuff, like create key pairs and buckets, and upload and download files.

## Key Pairs

We can continue authenticating with basic authentication, but we can also authenticate with a key pair that we generate. I highly recommend going this route for several reasons. First, sticking with basic authentication means you’re going to be using a password. And, quite frankly, passwords suck and are bad. I’ll let you Google and research that topic more for yourself.

A few reasons why they’re better, though: Key pairs are more secure, aren’t subject to human-memory-errors, and we never have access to your private key. And, specifically to Storj, using key pair authentication is going to allow you to use more of the advanced features in our architecture, such as advanced encryption/decryption and authentication, as well as give you more control over your data.

### Generating Key Pair

That being said, let’s go ahead and generate a key pair and add it to our account.

`app.js`

```javascript
// Generate keypair
$('.keypair-btn--generate').on('click', function(event) {
  event.preventDefault();
  console.log('Generate Key Pair button clicked');

  $.ajax({
    method: 'GET',
    url: '/keypair/generate'
  }).done(function(keypair) {
    console.log('Generated key pair ', keypair);
    $('.keypair-generated')
      .html(`Key Pair generated! ${keypair}`)
      .css('color', 'green');
  }).error(function(err) {
    console.log('Key pair error', err);
    $('.keypair-generated')
      .html(`Key Pair not generated, reason: ${err.responseText}`)
      .css('color', 'red');
  });
});
```

You can have as many keys as you want, but for the purpose of this application, we’re only going to generate one. Once you generate the key pair, add the public key to your user account, and then save the private key so you can use it to login later. Because of the way Heroku works, we want to save our private key as a `.env` variable.

`index.js`

```javascript
// Generate key pair
app.get('/keypair/generate', function(req, res) {
  if (process.env.STORJ_PRIVATE_KEY) {
    console.log('Private key already exists');
    return res.status(400).send('duplicate');
  }
  // Generate keypair
  var keypair = storj.KeyPair();
  console.log('Generating Storj keypair');

  // Add the keypair public key to the user account for authentication
  client.addPublicKey(keypair.getPublicKey(), function(err) {
    if (err) {
      return console.log('error', err.message);
    }

    // Save the private key for using to login later
    fs.appendFileSync('./.env', `\nSTORJ_PRIVATE_KEY=${keypair.getPrivateKey()}`);
    // fs.writeFileSync('./private.key', keypair.getPrivateKey());

    // Send back success to client
    res.status(200).send(keypair.getPublicKey());
  });
});
```

Once you generate the key, go to the `.env` file, and copy the private key value.

Next, go to your Heroku application settings and add this as a Config Vars, with a key of `STORJ_PRIVATE_KEY` so it matches the `.env` value. Now when we deploy our application in the wild web, it will have access to our private key should we want to authenticate with it.

### Retrieve Public Keys

If we want to retrieve our public keys our account, that’s easy peasy.

Set up our button in `app.js`

```javascript
// Retrieve keypair
$('.keypair-btn--retrieve').on('click', function(event) {
  event.preventDefault();
  console.log('Retrieve Key Pair button clicked');

  $.ajax({
    method: 'GET',
    url: '/keypair/retrieve'
  }).done(function(keypairs) {
    console.log('Key pair(s) retrieved', keypairs);
    if (!keypairs.length) {
      $('.keypair-retrieved').html('No keys retrieved');
    } else {
      $('.keypair-retrieved--success')
        .html('Keys Retrieved:')
        .css('color', 'green');

      // Create an li element for each keypair and append to ul
      keypairs.forEach(function(keypair) {
        var keyItem = document.createElement('li');
        $(keyItem).text(keypair.key);
        $('.keypair-public').append(keyItem);
      });
    }
  });
});
```

`index.js`

```javascript
// Retrieve key pairs
app.get('/keypair/retrieve', function(req, res) {
  console.log('Getting public keys');
  client.getPublicKeys(function(err, keys) {
    if (err) {
      return console.log('error', err.message);
    }

    // Print out each key
    keys.forEach(function(key) {
      console.log('key info', key);
    });

    // Send back key pair info to client
    res.status(200).send(keys)
  });
});
```

### Authenticate with Key Pair

Now that we’ve generated a key pair, we can use it instead of our username/password to authenticate

Set up button `app.js`

```javascript
// Authenticate with keypair
$('.keypair-btn--authenticate').on('click', function(event) {
  event.preventDefault();
  console.log('Authenticate (KeyPair) button clicked');

  $.ajax({
    method: 'GET',
    url: '/keypair/authenticate'
  }).done(function(authenticated) {
    if (authenticated === 'successful') {
      $('.keypair-authenticated')
        .html('Authenticated with keypair!')
        .css('color', 'green');
    } else {
      $('.keypair.authenticated')
        .html('Keypair authentication failed')
        .css('color', 'red');
    }
  });
});
```

Set up endpoint in `index.js`

```javascript
// Authenticate with keypair
app.get('/keypair/authenticate', function(req, res) {
  // Load keypair from your saved private key
  console.log('key', process.env.STORJ_PRIVATE_KEY);
  var keypair = storj.KeyPair(process.env.STORJ_PRIVATE_KEY);

  // Login using the keypair
  client = storj.BridgeClient(api, { keyPair: keypair });
  console.log('Logged in with keypair');
  res.status(200).send('successful');
})
```

Now we can authenticate either with our basic authentication, or with our key pair.

## Create and List Buckets

Now that we’ve got authentication down, we’ll want to create a bucket to put our files into.

`app.js`

```javascript
// Create bucket
$('.bucket-btn--create').on('click', function(event) {
  event.preventDefault();
  var newBucketName = $('.new-bucket-name').val()
  if (!newBucketName) {
    return console.log('Need to enter bucket name');
  }

  $.ajax({
    method: 'POST',
    url: '/buckets/create',
    data: { name: newBucketName }
  }).done(function(bucket) {
    console.log('Bucket created', bucket);
    $('.bucket-created').text(`Bucket ${bucket.name} created!`);
    $('.new-bucket-name').val('');
  });
});
```

`index.js`

```javascript
// Create bucket
app.post('/buckets/create', function(req, res) {
  // Settings for bucket
  var bucketInfo = {
    name: req.body.name
  };

  // Create bucket
  client.createBucket(bucketInfo, function(err, bucket) {
    if (err) {
      return console.log('error', err.message);
    }
    console.log('Created bucket', bucket);
    res.status(200).send(bucket);
  });
});
```

In our code we are passing in a ‘name’ property, but if you happen to leave this blank, Storj will generate a bucket name for you.

### Retrieve Buckets

Getting a list of buckets on your account is pretty straightforward.

In `app.js`:

```javascript
// List buckets
$('.bucket-btn--list').on('click', function(event) {
  event.preventDefault();
  console.log('List Buckets button clicked');
  $('.buckets-list')
    .html('Retrieving buckets . . .')
    .css('color', 'orange');

  $.ajax({
    method: 'GET',
    url: '/buckets/list'
  }).done(function(buckets) {
    if (!buckets.length) {
      $('.buckets-list').html('No buckets');
    } else {
      buckets.forEach(function(bucket) {
        $('.buckets-list')
          .html('Buckets: ')
          .css('color', 'black')
        console.log(bucket);
        var bucketList = document.createElement('ul');
        $('.buckets-list').append($(bucketList));
        var bucketItem = document.createElement('li');
        $(bucketItem).html(`Name: ${bucket.name}, id: ${bucket.id}`);
        $(bucketList).append(bucketItem);
      });
    }
  });
});

```

`index.js`

```javascript
// Get buckets
app.get('/buckets/list', function(req, res) {
  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.log('error', err.message);
    }
    console.log('Retrieved buckets', buckets);
    res.status(200).send(buckets);
  });
});
```

## Upload File

In `app.js`

```javascript
// Upload file
$('.files-btn--upload').on('click', function(event) {
  event.preventDefault();
  console.log('Upload file button clicked');
  $('.files-upload')
    .html('File upload in process . . .')
    .css('color', 'orange');

  $.ajax({
    method: 'GET',
    url: '/files/upload'
  }).done(function(file) {
    console.log('upload', file)
    $('.files-upload')
      .html(`File ${file.filename} uploaded to ${file.bucket}!`)
      .css('color', 'green');
  }).error(function(err) {
    $('.files-upload')
      .html(`Error occurred: ${err.statusText}`)
      .css('color', 'red');
  });
});
```

We’re going to be hardcoding the file that we’re uploading, since we know it’s going to be a grumpy cat picture. When you hook this up to your own app, you can dynamically pass in a file path.

You can also set it up on your front end to select a particular bucket to load the file into, or you can hard code the bucketId. For simplicity, and to get more practice using the Storj API, we’re going to get a list of our buckets and store the grumpy.jpg into the first bucket that is returned.

The following code is a little long, but the steps we’re doing are:

    1. Get the bucket id for the bucket we’re going to store the file in
    2. Create a key ring to hold key to interact with file
    3. Create a temporary encrypted version of the file to be uploaded
    4. Create a token to associate with file upload action
    5. Store file in bucket
    6. Save the key to our keyring so we can access the file again
    7. Delete temporary encrypted file

In `index.js`

```javascript
// At the top of index.js, add in a KEYRING_PASS variable and set it to a
// string. Give it whatever value you want.
var KEYRING_PASS = 'somepassword';

// …

// Upload file to bucket
app.get('/files/upload', function(req, res) {
  console.log('Uploading file');

  // Get first bucket that shows up (for demo purposes)
  // If you know what bucket you're going to put the file in, then use
  // that bucketId and skip client.getBuckets()
  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.log('error', err.message);
    }

    // Use the first bucket
    var bucketId = buckets[0].id;
    console.log('Uploading file to', bucketId);

    // Select the file to be uploaded
    var filepath = './public/grumpy.jpg';

    // Path to temporarily store encrypted version of file to be uploaded
    var tmppath = filepath + '.crypt';

    // Key ring to hold key used to interact with uploaded file
    // https://storj.github.io/core/KeyRing.html#KeyRing__anchor
    // storj.keyRing(<keyRingDir>, <passPhrase>)
    var keyring = storj.KeyRing('./', KEYRING_PASS);

    // Prepare to encrypt file for upload
    var secret = new storj.DataCipherKeyIv();
    var encrypter = new storj.EncryptStream(secret);

    // Encrypt the file to be uploaded and store it temporarily
    fs.createReadStream(filepath)
      .pipe(encrypter)
      .pipe(fs.createWriteStream(tmppath))
      .on('finish', function() {
        console.log('Finished encrypting');

        // Create token for uploading to bucket by bucketId
        client.createToken(bucketId, 'PUSH', function(err, token) {
          if (err) {
            console.log('error', err.message);
          }
          console.log('Created token for file');

          // Store the file using the bucketId, token, and encrypted file
          client.storeFileInBucket(bucketId, token.token, tmppath,
            function(err, file) {
              if (err) {
                return console.log('error', err.message);
              }
              console.log('Stored file in bucket');

              // Save key for access to download file
              keyring.set(file.id, secret);

              // Delete tmp file
              fs.unlink(tmppath, function(err) {
                if (err) {
                  return console.log(err);
                }
                console.log('Temporary encrypted file deleted');
              })

              // Send file info to client
              res.status(200).send(file);
            });
        });
      });
  });
});
```

## List Files

Now that we’ve uploaded our file, let’s make it so we can see the contents of our buckets.

In `app.js`:

```javascript
// List files in bucket
$('.files-btn--list').on('click', function(event) {
  event.preventDefault();
  console.log('List Files in Bucket button clicked');
  $('.files-list')
    .html('Retrieving files . . .')
    .css('color', 'orange');

  $.ajax({
    method: 'GET',
    url: '/files/list'
  }).done(function(bucketsWithFiles) {
    console.log(bucketsWithFiles);
    if (!bucketsWithFiles) {
      $('.files-list').html('No files in buckets');
    } else {
      for (var key in bucketsWithFiles) {
        var bucketName = document.createElement('div');
        $(bucketName)
          .html(`Bucket: ${key}`)
          .css('font-weight', '700');
        $('.files-list')
          .html($(bucketName))
          .css('color', 'black');

        var bucketFilesList = document.createElement('ul');
        $(bucketName).append(bucketFilesList);

        bucketsWithFiles[key].forEach(function(bucketFile) {
          console.log('file', bucketFile);
          var file = document.createElement('li');
          $(file)
            .html(bucketFile.filename)
            .css('font-weight', '300');
          $(bucketFilesList).append(file);
        });
      }
    }
  });
});
```

We have to first get our buckets so we can get the bucket id, and then we can get the files contained inside. If you already know the bucket id, you can skip the `client.getBuckets` part.

In `index.js`

```javascript
// List files in buckets
app.get('/files/list', function(req, res) {
  // Create objcet to hold all the buckets + files
  var bucketFiles = {};

  // Get buckets
  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.log('error', err.message);
    }

    // Get all the buckets, and then return the files in the bucket
    // Assign them to bucketFiles
    // When all the files have been retrieved, send the bucketFiles obj
    // to the client
    async.each(buckets, function(bucket, callback) {
      console.log('bucket', bucket.id);
      client.listFilesInBucket(bucket.id, function(err, files) {
        if (err) {
          return callback(err);
        }
        console.log('files', files);
        bucketFiles[bucket.name] = files;
        callback(null);
      })
    }, function(err) {
      if (err) {
        console.log('error');
      } else {
        console.log('bucketFiles', bucketFiles);
        res.status(200).send(bucketFiles);
      }
    });
  });
});
```

## Download Files

We’ve uploaded a file and we’ve listed files inside buckets. All that’s left now is to download the file and display it on our page.

`app.js`

```javascript
// Download file
$('.files-btn--download').on('click', function(event) {
  event.preventDefault();
  console.log('Download Files button clicked');
  $('.files-downloaded')
    .html('Downloading in process . . .')
    .css('color', 'orange');

  $.ajax({
    method: 'GET',
    url: '/files/download'
  }).done(function(download) {
    if (download === 'successful') {
      $('.files-downloaded')
        .html('Download finished! Scroll up and see a grumpy cat!')
        .css('color', 'green');

      // Set grumpy pic
      $('.grumpy-pic').attr('src', './grumpy-dwnld.jpg')
    }
  });
});
```

Similar to the uploading file code, the downloading file code is also quite long. In a nutshell, we’re going to get the key associated with the file from the keyring, and then download and decrypt the file.

`index.js`

```javascript
app.get('/files/download', function(req, res) {
  console.log('Getting file to download');

  // Get first bucket that shows up (for demo purposes)
  // If you know what bucket you're going to put the file in, then just use
  // that bucketId
  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.log('error', err.message);
    }

    // Use the first bucket
    var bucketId = buckets[0].id;
    console.log('Got bucketId', bucketId);

    // Get the fileId. If you already know the fileId you can skip
    // client.listFilesInBucket()
    client.listFilesInBucket(bucketId, function(err, files) {
      if (err) {
        return console.log('error', err.message);
      }

      // Get grumpy file
      var grumpyFile = files.find(function(file) {
        return file.filename.match('grumpy.jpg');
      });
      console.log('grumpy', grumpyFile);

      // Set fileId to grumpyFile id
      var fileId = grumpyFile.id;
      console.log('Got fileId', fileId);

      // Key ring to hold key used to interact with uploaded file
      // https://storj.github.io/core/KeyRing.html#KeyRing__anchor
      // storj.keyRing(<keyRingDir>, <passPhrase>)
      console.log('Getting keyring');
      var keyring = storj.KeyRing('./', KEYRING_PASS);

      // Where the downloaded file will be saved
      var target = fs.createWriteStream('./public/grumpy-dwnld.jpg');

      // Get key to download file
      console.log('Get key for fileId');
      var secret = keyring.get(fileId);

      // Prepare to decrypt the encrypted file
      var decrypter = new storj.DecryptStream(secret);
      var received = 0;

      // Download the file
      console.log('Creating file stream');
      client.createFileStream(bucketId, fileId, { exclude: [] },
      function(err, stream) {
        if (err) {
          return console.log('error', err.message);
        }

        // Handle stream errors
        stream.on('error', function(err) {
          console.log('warn', 'Failed to download shard, reason: %s', [err.message]);
          // Delete the partial file
          fs.unlink(filepath, function(unlinkFailed) {
            if (unlinkFailed) {
              return console.log('error', 'Failed to unlink partial file.');
            }

            if (!err.pointer) {
              return;
            }
          });
        }).pipe(through(function(chunk) {
          received += chunk.length;
          console.log('info', 'Received %s of %s bytes', [received, stream._length]);
          this.queue(chunk);
        })).pipe(decrypter)
           .pipe(target);
      })

      // Handle Events emitted from file download stream
      target.on('finish', function() {
        console.log('Finished downloading file');
        res.status(200).send('successful');
      }).on('error', function(err) {
        console.log('error', err.message);
      });
    });
  });
});
```

Once that’s all hooked up, you should be able to run `heroku local web`, authenticate, and then download the file and see it displayed.

## Pushing to Heroku

Now that we’ve finished our app, let’s push our changes to our Heroku deployment.

First, let’s commit the changes we’ve made. I’m just going to throw them all into one big commit.

```sh
$ git add -A
$ git commit -m "Finished app"
```

Once we’ve committed our changes, we can push to Heroku.

```sh
$ git push heroku master
```

Heroku will now rebuild our deployment with all our local changes.

Once that’s done, we can go to Heroku and click `Open App`.

## Summary and Additional Resources

### Summary

Let’s recap everything that we’ve done:

#### Setup
1. Deployed storj-node-heroku-example to a Heroku deployment
2. Provisioned Storj as an Add-on
3. Activated Storj account
4. Forked and cloned storj-node-heroku-example repo to local machine and linked it to Heroku

#### Storj Specific
1. Authenticated with Storj using basic authentication (username, password)
2. Generated and saved a key pair
3. Authenticated with Storj using key pair
4. Created a bucket
5. Got buckets
6. Uploaded a file to a bucket
7. Listed files in buckets
8. Downloaded file from bucket

#### Deployment
1. Push and deploy local changes to Heroku

### Next Steps

Now that you have the basics down, you can further explore Storj and see all the other things you can do:

#### storj.io
Log into your account on [storj.io](https://storj.io/) and see and edit your buckets and files.

#### storj-sugar
I used the regular Storj Core library so that you could see everything that was going on, but there is a module called [storj-sugar](https://github.com/Storj/storj-sugar) that has a bunch of helper modules and syntactic sugar to simplify interacting with the core library.

#### storj-cli
Interact with storj via the [core-cli](https://github.com/Storj/core-cli).

#### storjshare
If you want to become a farmer and rent out your drive, check out [storjshare-cli](https://github.com/Storj/storjshare-cli) or [storjshare-gui](https://github.com/Storj/storjshare-gui).

#### Documentation

Don’t forget to look at the other documentation and tutorials that I mentioned at the beginning:

- [BridgeClient](https://storj.github.io/core/BridgeClient.html)
- [Storj API](https://storj.io/api.html)
- [Example code](https://github.com/Storj/core/tree/master/example)
