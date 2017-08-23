var express = require('express');
var request = require('request');
var google = require('googleapis');
var router = express.Router();

var PROJECT = "steren-test";
var QUEUE_NAME = "migration-test-pull";
var LOCATION = "us-central1";

var BASE_URL = "https://cloudtasks.googleapis.com/v2beta2";
var accessToken;


function doTheAuthenticationDance() {
  var key = require('../key.json');
  var jwtClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/cloud-tasks',
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
  var url = `${BASE_URL}/projects/${PROJECT}/locations/${LOCATION}/queues/${QUEUE_NAME}`;
  callAPI(url, 'GET', null, function(error, response, body) {
    res.send(body);
  });
});

router.get('/create', function(req, res, next) {
  var url = `${BASE_URL}/projects/${PROJECT}/locations/${LOCATION}/queues/${QUEUE_NAME}/tasks`;

  var payload = new Buffer("abc char:!@#$%ˆ&*()_+").toString('base64');
  var json = {
    task: {
      pullTaskTarget: {
        payload: payload
      }
    }
  }

  callAPI(url, 'POST', json, function(error, response, body) {
    console.log('Task created');
    res.send(body);
  });
});

router.get('/leasedelete', function(req, res, next) {
  var url = `${BASE_URL}/projects/${PROJECT}/locations/${LOCATION}/queues/${QUEUE_NAME}/tasks:pull`;

  var leaseBody = {
    maxTasks: 1,
    leaseDuration: "10s",
    responseView: 'FULL'
  }

  callAPI(url, 'POST', leaseBody, function(error, response, body) {
    if(!body.tasks || body.tasks.length == 0) {
      console.warn('No task to lease');
      res.send('No task to lease');
    } else {
      var taskName = body.tasks[0].name;
      var decodedPayload = Buffer.from(body.tasks[0].pullTaskTarget.payload, 'base64').toString("ascii");
      console.log('Task leased: ' + taskName);
      console.log('payload: ' + body.tasks[0].pullTaskTarget.payload);
      console.log('decoded payload: ' + decodedPayload);

      var deleteBody = {
        schedule_time : body.tasks[0].scheduleTime
      }
      var deleteUrl = `${BASE_URL}/${taskName}:acknowledge`;
      callAPI(deleteUrl, 'POST', deleteBody, function(error, response, body) {
        console.log('Task deleted');
        res.send('Task leased and deleted, payload: ' + decodedPayload);
      });
    }
  });
});


doTheAuthenticationDance();

module.exports = router;
