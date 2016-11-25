const express = require('express');
const app = express();
const fs = require('fs');
const async = require('async');
const path = require('path');
const localAssetsDir = __dirname + '/public';

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

/* Endpoints */


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
