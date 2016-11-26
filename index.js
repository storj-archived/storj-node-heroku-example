const express = require('express');
const app = express();
const fs = require('fs');
const async = require('async');
const bodyParser = require('body-parser');
const path = require('path');
const localAssetsDir = __dirname + '/public';

// Storj specific
const storj = require('storj-lib');
const STORJ_EMAIL = process.env.STORJ_EMAIL;
const STORJ_PASSWORD = process.env.STORJ_PASSWORD;
const STORJ_PRIVATE_KEY = process.env.STORJ_PRIVATE_KEY;
const api = 'https://api.storj.io';
const storjCredentials = {
  email: STORJ_EMAIL,
  password: STORJ_PASSWORD
};
let client;

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* Endpoints */

// Generate key pair
app.get('/keypair/generate', function(req, res) {

  // Generate keypair
  const keypair = storj.KeyPair();
  console.log('Generating Storj keypair');

  // Add the keypair public key to the user account for authentication
  client.addPublicKey(keypair.getPublicKey(), function(err) {
    if (err) {
      return console.log('error', err.message);
    }

    // Save the private key for using to login later
    // fs.appendFileSync('./.env', `STORJ_PRIVATE_KEY=${keypair.getPrivateKey()}`);
    fs.writeFileSync('./private.key', keypair.getPrivateKey());

    // Send back success to client
    res.status(200).send(keypair.getPublicKey());
  });
});

// Retrieve key pairs
app.get('/keypair/retrieve', function(req, res) {
  client.getPublicKeys(function(err, keys) {
    if (err) {
      return console.log('error', err.message);
    }

    // Print out each key
    keys.forEach(function(key) {
      console.log('info', key);
    });

    // Send back key pair info to client
    res.status(200).send(keys)
  });
})

// Retrieve credentials
app.get('/user/retrieve', function(req, res) {
  res.status(200).send(storjCredentials);
})

// Authenticate with username/password
app.get('/user/authenticate/user-pass', function(req, res) {
  client = storj.BridgeClient(api, { basicAuth: storjCredentials });
  if (client) res.status(200).send('successful')
})

// Get buckets
app.get('/buckets/retrieve', function(req, res) {
  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.log('error', err.message);
    }
    res.status(200).send(buckets);
  })
})

// Create bucket
app.post('/buckets/create', function(req, res) {
  console.log(req.body)
  const bucketInfo = {
    name: req.body.name,
    storage: 30,
    transfer: 10
  };
  client.createBucket(bucketInfo, function(err, bucket) {
    if (err) {
      return console.log('error', err.message);
    }
    res.status(200).send(bucket);
  })
})

// List files in buckets
app.get('/files/retrieve', function(req, res) {
  const bucketFiles = {};

  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.log('error', err.message);
    }

    async.each(buckets, function(bucket, callback) {
      console.log('bucket', bucket.id)
      client.listFilesInBucket(bucket.id, function(err, files) {
        if (err) {
          return callback(err);
        }
        console.log('files', files)

        bucketFiles[bucket.name] = files;
        callback(null);
      })
    }, function(err) {
      if (err) {
        console.log('error')
      } else {
        console.log('bucketFiles', bucketFiles);
        res.status(200).send(bucketFiles);
      }
    })

  })
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
