var express = require('express');
var request = require('request');
var google = require('googleapis');
var router = express.Router();

var BASE_URL = "https://www.googleapis.com/taskqueue/v1beta2/projects";
var PROJECT = "steren-test";
//var queueName = "migration-test-queue	";
var queueName = "migration-test-pull";
var accessToken;

function doTheAuthenticationDance() {
  var key = require('../key.json');
  var jwtClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/taskqueue',
      //'https://www.googleapis.com/auth/taskqueue.consumer',
      'https://www.googleapis.com/auth/cloud-taskqueue',
      //'https://www.googleapis.com/auth/cloud-taskqueue.consumer',
    ],
    null
  );

  jwtClient.authorize(function (err, tokens) {
    if (err) {
      console.log(err);
      return;
    }
    console.log(tokens);
    accessToken = tokens.access_token;
  });
}

function callAPI(url, method, form, callback) {
  var headers = {
      'Authorization': `Bearer ${accessToken}`
  }
  var options = {
      url: url,
      method: method,
      headers: headers,
      form: form
  }
  request(options, callback);
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Task Queue' });
});

router.get('/test', function(req, res, next) {
  var url = `https://clouderrorreporting.googleapis.com/v1beta1/projects/${PROJECT}/groupStats`;
  callAPI(url, 'GET', {}, function(error, response, body){
    if(error) {res.send(error);}
    res.send(body);
  });

});

router.get('/detail', function(req, res, next) {
  var url = `${BASE_URL}/${PROJECT}/taskqueues/${queueName}`;
  callAPI(url, 'GET', {}, function(error, response, body){
    if(error) {res.send(error);}
    res.send(body);
  });

});

router.get('/create', function(req, res, next) {
  var url = `${BASE_URL}/${PROJECT}/taskqueues/${queueName}/tasks`;
  // POST

  res.send({});
});

doTheAuthenticationDance();

module.exports = router;
