const express = require('express');
const app = express();
const fs = require('fs');
const async = require('async');
const path = require('path');
const localAssetsDir = __dirname + '/public';

// Storj specific
const storj = require('storj-lib');
const STORJ_EMAIL = process.env.STORJ_EMAIL;
const STORJ_PASSWORD = process.env.STORJ_PASSWORD;
const api = 'https://api.storj.io';
const storjCredentials = {
  email: STORJ_EMAIL,
  password: STORJ_PASSWORD
};
const client = storj.BridgeClient(api, { basicAuth: storjCredentials });

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

/* Endpoints */

app.get('/keypair/generate', function(req, res) {
  // Generate keypair
  const keypair = storj.KeyPair();
  console.log('Generating Storj keypair', keypair);
  // Add the keypair public key to the user account for authentication
  client.addPublicKey(keypair.getPublicKey(), function(err) {
    if (err) {
      return console.log('error', err.message);
    }
    // Save the private key for using to login later
    fs.appendFileSync('./.env', `PRIVATE_KEY=${keypair.getPrivateKey()}`);
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
