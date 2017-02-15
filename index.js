var express = require('express');
var app = express();
var fs = require('fs');
var async = require('async');
var bodyParser = require('body-parser');
var through = require('through');
var path = require('path');
var localAssetsDir = __dirname + '/public';
require('dotenv').config();

var storj = require('storj-lib');
var storj_utils = require('storj-lib/lib/utils');
var api = 'https://api.storj.io';
var client;
var KEYRING_PASS = 'somepassword';
var keyring = storj.KeyRing('./');

// Storj variables
var STORJ_EMAIL = process.env.STORJ_EMAIL;
var STORJ_PASSWORD = process.env.STORJ_PASSWORD;
/*
  Get and/or generate mnemonic for you on load.
  !! Important: you'll need to manually add the contents of the file in the
  key.ring directory to your Heroku config variables either through the GUI or
  the command line:
  `heroku config:set STORJ_MNEMONIC=<VALUE FROM .ENV FILE>`
*/
var STORJ_MNEMONIC = process.env.STORJ_MNEMONIC || generateMnemonic();

var storjCredentials = {
  email: STORJ_EMAIL,
  password: STORJ_PASSWORD
};

// Helps to break up endpoint logs
var separator = function() {
  return console.log('================================');
};

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* Endpoints */

/**
 * Simple endpoint to make sure your STORJ_EMAIL and STORJ_PASSWORD environment
 * variables are on your .env file
 */
app.get('/user/retrieve', function(req, res) {
  separator();
  console.log('Retrieving basic auth credentials...');
  res.status(200).send(storjCredentials);
});

/**
 * Authenticates your user with storj.BridgeClient. The authorized instance
 * is saved into a 'global' variable 'client'. This allows you to use this same
 * authorized instance for future interactions without have to re-authenticate
 * every single time.
 */
app.get('/user/authenticate/user-pass', function(req, res) {
  separator();
  console.log('Attempting to log in with basic auth...');
  if (!STORJ_EMAIL || !STORJ_PASSWORD) {
    return res.status(400).send('No credentials. Make sure you have a .env file with KEY=VALUE pairs')
  }
  client = storj.BridgeClient(api, { basicAuth: storjCredentials });
  console.log('Logged in with basic auth');
  res.status(200).send('successful');
});

/**
 * Generates a keypair and adds the public key to the storj.BridgeClient and
 * stores the private key on your local .env file. You'll want to take this
 * key and save it to your heroku config variables either through the GUI or
 * with:
 * `heroku config:set STORJ_PRIVATE_KEY=<VALUE FROM .ENV FILE>`
 */
app.get('/keypair/generate', function(req, res) {
  separator();
  if (process.env.STORJ_PRIVATE_KEY) {
    console.warn('Private key already exists');
    return res.status(400).send('duplicate');
    // You can actually make as many private keys as you want, but we're just
    // going to restrict ourselves to one for simplicity. This also makes it
    // easier when deploying applications to Heroku. If you want to generate
    // more keypairs, then be sure to store them under unique KEY names in
    // your .env files/heroku config variables
  }

  // Generate keypair
  var keypair = storj.KeyPair();
  console.log('Generating Storj keypair...');

  if (!client) {
    console.warn('User is not authenticated. Authenticate with basic auth, or with keypair auth if you\'ve already generated a keypair');
    return res.status(400).send('No authentication. Make sure to authenticate with Basic Authentication first.');
  }

  // Add the keypair public key to the user account for Authentication
  console.log('Adding public key to storj.BridgeClient...');
  client.addPublicKey(keypair.getPublicKey(), function() {
    // Save the private key for using to login later
    console.log('Public key added to storj.BridgeClient, saving to .env file. Make sure to add this key to your Heroku config variables');

    fs.appendFileSync('./.env', `STORJ_PRIVATE_KEY=${keypair.getPrivateKey()}`);

    // Send back sucess to client
    res.status(200).send(keypair.getPublicKey());
  });
});

/**
 * Retrieves all keypairs registered with storj.bridgeClient
 */
app.get('/keypair/retrieve', function(req, res) {
  separator();
  if (!client) {
    console.warn('User is not authenticated. Authenticate with basic auth, or with keypair auth if you\'ve already generated a keypair');
    return res.status(400).send('No authentication. Make sure to authenticate with Basic Authentication or Key Pair authentication (if you have already generated a key pair).');
  }

  console.log('Getting public keys...');

  client.getPublicKeys(function(err, keys) {
    if (err) {
      return console.log('error', err.message);
    }

    // Print out each key for your enjoyment on the console
    keys.forEach(function(key) {
      console.log('key info', key);
    });

    // Send back key pair info to client
    res.status(200).send(keys);
  })
});

/**
 * Authenticates user with storj.BridgeClient using keypair instead of basic
 * auth
 */
app.get('/keypair/authenticate', function(req, res) {
  separator();
  // Load saved private key
  var privateKey = process.env.STORJ_PRIVATE_KEY;

  console.log('Retrieved privateKey: ', privateKey)
  console.log('Matching privateKey with public key registered with storj');
  var keypair = storj.KeyPair(privateKey);

  // Login using the keypair
  console.log('Logging in with keypair...')
  client = storj.BridgeClient(api, { keyPair: keypair });
  console.log('Logged in with keypair');
  res.status(200).send('successful');
});

/**
 * Creates a bucket on your Storj account
 */
app.post('/buckets/create', function(req, res) {
  separator();
  // Settings for bucket
  var bucketInfo = {
    name: req.body.name
  };

  // Create bucket
  console.log('Creating bucket ', req.body.name, '...');
  client.createBucket(bucketInfo, function(err, bucket) {
    if (err) {
      return console.log('error', err.message);
    }
    console.log(bucket, ' created!');
    res.status(200).send(bucket);
  });
});

/**
 * Lists all buckets on your account
 */
app.get('/buckets/list', function(req, res) {
  separator();
  console.log('Getting buckets...')
  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.log('error', err.message);
    }
    console.log('Retrieved buckets', buckets);
    res.status(200).send(buckets);
  });
});

/**
 * Uploads a file to a bucket. For simplicity, the file and bucket are
 * predetermined and hardcoded. The basic steps of uploading a file are:
 * 1. Decide what bucket and file you're going to upload.
 *   a. Retrieve ID of bucket
 *   b. Retrieve path to file
 *   c. Retrieve name of file
 * 2. Create a filekey based on your user name, bucketId, and filename - these
 *    variables are then taken and combined with your keyring mnemonic to
 *    generate a deterministic key to encrypt the file.
 * 3. Create a temporary path to store the encrypted file (remember, files
 *    should be encrypted before they are uploaded)
 * 4. Instantiate encrypter
 * 5. Encrypt the file by creating a stream, piping the contents of the stream
 *    through your encrypter, and then taking the result and writing it to
 *    the temporary path determined in step 3
 * 6. Create a token for uploading the file to the bucket
 * 7. Store file in bucket
 * 8. Bonus points: Clean up your encrypted file that you made
 *
 * Note: We didn't do this check here, but you could also check to make sure
 * that the file name doesn't already exist in the bucket. Currently this will
 * just overwrite any file with the same name.
 */
app.get('/files/upload', function(req, res) {
  separator();
  console.log('Retrieving buckets...')
  // Step 1
  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.error(err.message);
    }

    // Step 1a) Use the first bucket
    var bucketId = buckets[0].id;
    console.log('Uploading file to: ', bucketId);

    // Step 1b) Path of file

    var filepath = './public/grumpy.jpg';
    console.log('Path of file: ', filepath);

    // Step 1c) Name of file
    var filename = 'grumpy.jpg';
    console.log('Name of file: ', filename);

    // Step 2) Create a filekey with username, bucketId, and filename
    var filekey = getFileKey(STORJ_EMAIL, bucketId, filename);

    // Step 3) Create a temporary path to store the encrypted file
    var tmppath = filepath + '.crypt';

    // Step 4) Instantiate encrypter
    var encrypter = new storj.EncryptStream(filekey);

    // Step 5) Encrypt file
    fs.createReadStream(filepath)
      .pipe(encrypter)
      .pipe(fs.createWriteStream(tmppath))
      .on('finish', function() {
        console.log('Finished encrypting');

        // Step 6) Create token for uploading to bucket by bucketId
        client.createToken(bucketId, 'PUSH', function(err, token) {
          if (err) {
            console.log('error', err.message);
          }
          console.log('Created token', token.token);

          // Step 7) Store the file
          console.log('Storing file in bucket...');
          client.storeFileInBucket(bucketId, token.token, tmppath,
            function(err, file) {
              if (err) {
                return console.log('error', err.message);
              }
              console.log('Stored file in bucket');
              // Step 8) Clean up and delete tmp encrypted file
              console.log('Cleaning up and deleting temporary encrypted file...');
              fs.unlink(tmppath, function(err) {
                if (err) {
                  return console.log(err);
                }
                console.log('Temporary encrypted file deleted');
              });

              console.log(`File ${filename} successfully uploaded to ${bucketId}`);
              res.status(200).send(file);
            });
        });
      });
  });
});

/**
 * Lists all files in buckets
 */
app.get('/files/list', function(req, res) {
  separator();
  // Create object to hold all the buckets and files
  var bucketFiles = {};

  // Get buckets
  console.log('Getting buckets...')
  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.log('error', err.message);
    }

    // Get all the buckets, and then return the files in the bucket
    // Assign files to bucketFiles
    async.each(buckets, function(bucket, callback) {
      console.log('bucket', bucket.id);
      client.listFilesInBucket(bucket.id, function(err, files) {
        if (err) {
          return callback(err);
        }
        // bucketFiles.myPictureBucket = [];
        bucketFiles[bucket.name] = files;
        callback(null);
      })
    }, function(err) {
      if (err) {
        return console.log('error');
      }
      console.log('bucketFiles retrieved: ', bucketFiles);
      res.status(200).send(bucketFiles);
    });
  });
});

/**
 * Downloads a file from bucket. For simplicity, file and bucket are
 * predetermined and hardcoded. The steps to download a bucket are more or less
 * the inverse of uploading a file
 * 1. Decide what bucket and file you're going to download
 *    a. Retrieve ID of bucket
 *    b. Retrieve ID of file
 * 2. Create a filekey based on the user name, bucketId, and filename. As long
 *    as your followed this same process when uploading the file, you'll be
 *    able to download the file the same way. What you're doing is recreating
 *    the deterministic key that will allow you to decrypt the file. The reason
 *    why someone else can't generate this file key is because of the mnemonic *    on your key ring. As long as you keep this secure, your file is secure.
 *    If you wanted to be able to allow this file to be downloaded by multiple
 *    devices or people, you can export the mnemonic and import it onto another
 *    keyring
 * 3. Decide where you want to download the file
 * 4. Instantiate decrypter
 * 5. Download the file: Create file stream to get all your file shards, take
 *    those chunks as they come in and pipe them through the decrypter and then
 *    to your target file
 */
app.get('/files/download', function(req, res) {
  separator();
  // Step 1) Decide what file you're download
  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.log('error', err.message);
    }

    // Step 1a) Retrieve ID of bucket
    var bucketId = buckets[0].id;
    console.log('Got bucketId', bucketId);

    // Step 1b) Get the fileId of the file we want to download.
    client.listFilesInBucket(bucketId, function(err, files) {
      if (err) {
        return console.log('error', err.message);
      }

      // Get grumpy file
      var grumpyFile = files.find(function(file) {
        return file.filename.match(filename);
      });
      // Step 1b)
      var fileId = grumpyFile.id;
      var filename = 'grumpy.jpg'
      // Note: make sure the filename here is the same as when you generated
      // the filename when you uploaded. Because the filekey was generated
      // using the filename, they MUST match, otherwise the key will not be
      // the same and you cannot download the file

      // Step 2) Create filekey
      var filekey = getFileKey(STORJ_EMAIL, bucketId, filename);

      // Step 3) Decide where the downloaded file will be saved
      var target = fs.createWriteStream('./public/grumpy-dwnld.jpg');

      // Step 4) Instantiate decrypter
      var decrypter = new storj.DecryptStream(filekey);

      var received = 0;

      // Step 5) Download the file
      console.log('Creating file stream...');
      client.createFileStream(bucketId, fileId, { exclude: [] },
      function(err, stream) {
        if (err) {
          return console.log('error', err.message);
        }

        // Handle stream errors
        stream.on('error', function(err) {
          console.log('warn', 'Failed to download shard, reason: %s', [err.message]);
          // Delete the partial file if there's a failure
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
        console.log('Finished downloading file!');
        res.status(200).send('successful')
      }).on('error', function(err) {
        console.log('error', err.message);
      });
    });
  });
});


app.listen(app.get('port'), function() {
  separator();
  console.log('Node app is running on port', app.get('port'));
});

/**
 * Deterministically generates filekey to upload/download file based on
 * mnemonic stored on keyring. This means you only need to have the mnemonic
 * in order to upload/download on different devices. Think of the mnemonic like
 * an API key i.e. keep it secret! keep it safe!
 */
function getFileKey(user, bucketId, filename) {
  console.log('Generating filekey...')
  console.log('menemoenefejfdsa', keyring.exportMnemonic());
  generateMnemonic();
  var realBucketId = storj_utils.calculateBucketId(user, bucketId);
  var realFileId = storj_utils.calculateFileId(bucketId, filename);
  var filekey = keyring.generateFileKey(realBucketId, realFileId);
  console.log('Filekey generated', filekey)
  return filekey;
}

/**
 * This generates a mnemonic that is used to create deterministic keys to
 * upload and download buckets and files.
 * This puts the mnemonic on your keyring (only one mnemonic is held per
 * keyring) and also writes the mnemonic to your local .env file.
 */
function generateMnemonic() {
  console.log('Attempting to retrieve mnemonic');
  var mnemonic = keyring.exportMnemonic();
  if (mnemonic) {
    console.log('Mnemonic already exists');
  } else {
    console.log('Mnemonic doesn\'t exist or new keyring');
    var newMnemonic = process.env.STORJ_MNEMONIC || keyring.generateDeterministicKey();
    keyring.importMnemonic(newMnemonic);
    console.log('Mnemonic successfully retrieved/generated and imported');
  }

  if (!process.env.STORJ_MNEMONIC) {
    console.log('Mnemonic not saved to env vars. Saving...');
    // Write mnemonic to .env file
    fs.appendFileSync('./.env', `STORJ_MNEMONIC="${mnemonic || newMnemonic}"`);
    console.log('Mnemonic written to .env file. Make sure to add this to heroku config variables with \'heroku config:set STORJ_MNEMONIC="<VALUE FROM .ENV FILE>\'');
    return;
  }
}
