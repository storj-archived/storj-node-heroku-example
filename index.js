var express = require('express');
var app = express();
var fs = require('fs');
var async = require('async');
var bodyParser = require('body-parser');
var through = require('through');
var path = require('path');
var localAssetsDir = __dirname + '/public';

// Storj variables
var STORJ_EMAIL = process.env.STORJ_EMAIL;
var STORJ_PASSWORD = process.env.STORJ_PASSWORD;
var storjCredentials = {
  email: STORJ_EMAIL,
  password: STORJ_PASSWORD
};
var storj = require('storj-lib');
var api = 'https://api.storj.io';
var client;
var KEYRING_PASS = 'somepassword';

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* Endpoints */

app.get('/user/retrieve', function(req, res) {
  console.log('Retrieving basic auth credentials');
  res.status(200).send(storjCredentials);
});

app.get('/user/authenticate/user-pass', function(req, res) {
  if (!STORJ_EMAIL || !STORJ_PASSWORD) {
    return res.status(400).send('No credentials. Make sure you have a .env file with KEY=VALUE pairs')
  }
  client = storj.BridgeClient(api, { basicAuth: storjCredentials });
  console.log('Logged in with basic auth');
  res.status(200).send('successful');
});

app.get('/keypair/generate', function(req, res) {
  if (process.env.STORJ_PRIVATE_KEY) {
    console.log('Private key already exists');
    return res.status(400).send('duplicate');
    // You can actually make as many private keys as you want, but we're just
    // going to restrict ourselves to one for simplicity
  }
  // Generate keypair
  var keypair = storj.KeyPair();
  console.log('Generating Storj keypair');

  if (!client) {
    return res.status(400).send('No authentication. Make sure to authenticate with Basic Authentication first.');
  }

  // Add the keypair public key to the user account for Authentication
  client.addPublicKey(keypair.getPublicKey(), function() {
    // Save the private key for using to login later
    fs.appendFileSync('./.env', `STORJ_PRIVATE_KEY=${keypair.getPrivateKey()}`);
    // fs.writeFileSync('./private.key', keypairpair.getPrivateKey());

    // Send back sucess to client
    res.status(200).send(keypair.getPublicKey());
  });
});

app.get('/keypair/retrieve', function(req, res) {
  if (!client) {
    return res.status(400).send('No authentication. Make sure to authenticate with Basic Authentication or Key Pair authentication (if you have already generated a key pair).');
  }

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
    res.status(200).send(keys);
  })
});

app.get('/keypair/authenticate', function(req, res) {
  // Load key pair from saved private key
  var privateKey = process.env.STORJ_PRIVATE_KEY;

  console.log('privateKey: ', privateKey)

  var keypair = storj.KeyPair(privateKey);

  // Login using the keypair
  client = storj.BridgeClient(api, { keyPair: keypair });
  console.log('Logged in with keypair');
  res.status(200).send('successful');
});

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

app.get('/buckets/list', function(req, res) {
  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.log('error', err.message);
    }
    console.log('Retrieved buckets', buckets);
    res.status(200).send(buckets);
  });
});

app.get('/files/upload', function(req, res) {
  console.log('Uploading file');
  // Bucket id
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
    var keyring = storj.KeyRing('./', KEYRING_PASS);

    // Prepare to encrypt file for upload
    var secret = new storj.DataCipherKeyIv();
    var encrypter = new storj.EncryptStream(secret);

    fs.createReadStream(filepath)
      .pipe(encrypter)
      .pipe(fs.createWriteStream(tmppath))
      .on('finish', function() {
        console.log('Finished encrypting');

        // create token for uploading to bucket by bucketId
        client.createToken(bucketId, 'PUSH', function(err, token) {
          if (err) {
            console.log('error', err.message);
          }
          console.log('Created token for file');

          // Store the file
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
              });

              res.status(200).send(file);
            });
        });
      });
  });
});

app.get('/files/list', function(req, res) {
  // Create object to hold all the buckets and files
  var bucketFiles = {};

  // Get buckets
  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.log('error', err.message);
    }

    // Get all the buckets, and tehn return the files in the bucket
    // Assign files to bucketFiles
    async.each(buckets, function(bucket, callback) {
      console.log('bucket', bucket.id);
      client.listFilesInBucket(bucket.id, function(err, files) {
        if (err) {
          return callback(err);
        }
        console.log('files', files);
        // bucketFiles.myPictureBucket = [];
        bucketFiles[bucket.name] = files;
        callback(null);
      })
    }, function(err) {
      if (err) {
        return console.log('error');
      }
      console.log('bucketFiles', bucketFiles);
      res.status(200).send(bucketFiles);
    });
  });
});

app.get('/files/download', function(req, res) {
  console.log('Getting file to download');

  // Bucket id
  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.log('error', err.message);
    }

    // Use the first bucket
    var bucketId = buckets[0].id;
    console.log('Got bucketId', bucketId);

    // Get the fileId of the file we want to download.
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

      // Key ring
      console.log('Getting keyring');
      // storj.keyRings(<keyRingDir>, <passPhrase>)
      var keyring = storj.KeyRing('./', KEYRING_PASS);

      // Where the downloaded file will be saved
      var target = fs.createWriteStream('./public/grumpy-dwnld.jpg');

      // Get key to download file
      console.log('Get key for fileId');
      var secret = keyring.get(fileId);

      // Prepare to decrypt the encrypted fileId
      var decrypter = new storj.DecryptStream(secret);
      var received = 0;

      // Download the fileId
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
      });

      // Handle events emitted from file download stream
      target.on('finish', function() {
        console.log('Finished downloading file');
        res.status(200).send('successful')
      }).on('error', function(err) {
        console.log('error', err.message);
      });
    });
  });
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
