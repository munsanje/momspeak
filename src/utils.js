/* jshint -W041*/ // ignore == to compare null warning
var _ = require('lodash');
var vumigo = require('vumigo_v02');
var JsonApi = vumigo.http.api.JsonApi;

// var SESSION_ID = vumigo.utils.uuid();

var converse_probe = function(im, token, SESSION_ID, content) {
    var http = new JsonApi(im, {
        headers: {
          'Authorization': ['Bearer ' + token],
          'Accept': ['application/vnd.wit.' + im.config.wit.version + "+json"],
          'Content-Type': ['application/json']
        }
    });
    // FIXME add action support
    return http.post('https://api.wit.ai/converse?', content == null ?
                      {
                          params: {
                            v: im.config.wit.version, // write method that extracts version
                            session_id: SESSION_ID
                          }
                      } :
                      {
                        params: {
                          v: im.config.wit.version, // write method that extracts version
                          session_id: SESSION_ID,
                          q: content
                        }
                    }
                )
                .then(function(response) {
                    if(response.data.type == 'merge') {
                        im.log("Executing merge");
                        return converse_probe(im, token, null);
                    }
                    // NOTE type is one of 'merge', 'msg', 'action', 'stop', 'error'
                    else if (response.data.type == 'msg') {
                        im.log("Received message: " + response.data.msg);
                        converse_probe(im, token, null);  // flush 'stop'
                        return response;

                    }
                    else if (response.data.type == 'stop') {
                        im.log("Received type: stop");
                        return response;
                    }
                    // TODO implement action handler

                    return response;
                });
};

go.utils = {
    converse: function(im, token, SESSION_ID, content) {
        im.log('utils.sessionid: ' + SESSION_ID);
        return converse_probe(im, token, SESSION_ID, content)
              .then(function (results) {
                  return im.log(results)
                        .then(function() {
                            return results;
                        });
              });
    }
};
