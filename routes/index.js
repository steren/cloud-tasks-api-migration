var express = require('express');
var request = require('request');
var google = require('googleapis');
var router = express.Router();

var PROJECT = "steren-test";
var QUEUE_NAME = "migration-test-pull";

var BASE_URL = "https://www.googleapis.com/taskqueue/v1beta2";
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
      'https://www.googleapis.com/auth/taskqueue.consumer',
      'https://www.googleapis.com/auth/cloud-taskqueue',
      'https://www.googleapis.com/auth/cloud-taskqueue.consumer',
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

function callAPI(url, method, json, callback) {
  var headers = {
      'Authorization': `Bearer ${accessToken}`
  };
  var options = {
      url: url,
      method: method,
      headers: headers,
  };
  if(json) {
    options.json = json;
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
    res.send(body);
  });
});

router.get('/queue', function(req, res, next) {
  var url = `${BASE_URL}/projects/${PROJECT}/taskqueues/${QUEUE_NAME}?getStats=true`;
  callAPI(url, 'GET', null, function(error, response, body) {
    res.send(body);
  });
});

router.get('/create', function(req, res, next) {
  var url = `${BASE_URL}/projects/s~${PROJECT}/taskqueues/${QUEUE_NAME}/tasks`;

  var payload = new Buffer("abc char:!@#$%ˆ&*()_+").toString('base64');
  var json = {
    kind: "taskqueues#task",
    queueName: QUEUE_NAME,
    payloadBase64: payload
  }

  callAPI(url, 'POST', json, function(error, response, body) {
    console.log('Task created');
    res.send(body);
  });
});

router.get('/leasedelete', function(req, res, next) {
  var url = `${BASE_URL}/projects/s~${PROJECT}/taskqueues/${QUEUE_NAME}/tasks/lease?leaseSecs=10&numTasks=1`;

  callAPI(url, 'POST', {}, function(error, response, body) {
    if(!body.items || body.items.length == 0) {
      console.warn('No task to lease');
      res.send('No task to lease');
    } else {
      //console.log(body.items[0]);
      var taskName = body.items[0].id;
      var decodedPayload = Buffer.from(body.items[0].payloadBase64, 'base64').toString("ascii");
      console.log('Task leased: ' + taskName);
      console.log('decoded payload: ' + decodedPayload);

      var deleteUrl = `${BASE_URL}/projects/s~${PROJECT}/taskqueues/${QUEUE_NAME}/tasks/${taskName}`;
      callAPI(deleteUrl, 'DELETE', null, function(error, response, body) {
        console.log('Task deleted');
        res.send('Task leased and deleted, payload: ' + decodedPayload);
      });
    }
  });
});


doTheAuthenticationDance();

module.exports = router;
