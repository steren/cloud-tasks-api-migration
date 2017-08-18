var express = require('express');
var request = require('request');
var google = require('googleapis');
var router = express.Router();

var PROJECT = "steren-test";
var QUEUE_NAME = "migration-test-pull";

var BASE_URL = "https://www.googleapis.com/taskqueue/v1beta2/projects";
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

function callAPI(url, method, payload, callback) {
  var headers = {
      'Authorization': `Bearer ${accessToken}`
  };
  var options = {
      url: url,
      method: method,
      headers: headers,
  };

  if(payload) {
    options.json = {
      kind: "taskqueues#task",
      queueName: QUEUE_NAME,
      payloadBase64: payload
    };
  };

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
  var url = `${BASE_URL}/${PROJECT}/taskqueues/${QUEUE_NAME}?getStats=true`;
  callAPI(url, 'GET', null, function(error, response, body) {
    if(error) {res.send(error);}
    res.send(body);
  });
});

router.get('/create', function(req, res, next) {
  var url = `${BASE_URL}/s~${PROJECT}/taskqueues/${QUEUE_NAME}/tasks`;

  var payload = "abc";

  callAPI(url, 'POST', payload, function(error, response, body) {
    if(error) {res.send(error);}
    res.send(body);
  });
});

doTheAuthenticationDance();

module.exports = router;
