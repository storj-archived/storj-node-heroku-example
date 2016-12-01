var express = require('express');
var app = express();
var fs = require('fs');
var async = require('async');
var bodyParser = require('body-parser');
var through = require('through');
var path = require('path');
var localAssetsDir = __dirname + '/public';

// Storj specific
var storj = require('storj-lib');
var STORJ_EMAIL = process.env.STORJ_EMAIL;
var STORJ_PASSWORD = process.env.STORJ_PASSWORD;
var STORJ_PRIVATE_KEY = process.env.STORJ_PRIVATE_KEY;
var KEYRING_PASS = 'somepassword';
var api = 'https://api.storj.io';
var storjCredentials = {
  email: STORJ_EMAIL,
  password: STORJ_PASSWORD
};
var client;

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* Endpoints */

// Retrieve credentials
app.get('/user/retrieve', function(req, res) {
  console.log('Retrieving basic auth credentials');
  res.status(200).send(storjCredentials);
});

// Authenticate with username/password
app.get('/user/authenticate/user-pass', function(req, res) {
  client = storj.BridgeClient(api, { basicAuth: storjCredentials });
  console.log('Logged in with basic auth');
  res.status(200).send('successful')
});

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

// Get buckets
app.get('/buckets/list', function(req, res) {
  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.log('error', err.message);
    }
    console.log('Buckets: ', buckets);
    res.status(200).send(buckets);
  });
});

// Upload file to bucket
app.get('/files/upload', function(req, res) {
  console.log('Uploading file');

  // Get first bucket that shows up (for demo purposes)
  // If you know what bucket you're gonig to put the file in, then use
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

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
