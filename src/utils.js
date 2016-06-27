var _ = require('lodash');
var vumigo = require('vumigo_v02');
var JsonApi = vumigo.http.api.JsonApi;
var SESSION_ID = vumigo.utils.uuid();
// var VERSION = self.im.config.wit.version;

var converse_probe = function(im, token, content) {
  var http = new JsonApi(im, {
    headers: {
      'Authorization': ['Bearer ' + token],
      'Accept': ['application/vnd.wit.' + self.im.config.wit.version + "+json"],
      'Content-Type': ['application/json']
    }
  });
  return http.post('https://api.wit.ai/converse?', {
    params: {
      v: self.im.config.wit.version, // write method that extracts version
      session_id: SESSION_ID,
      q: content,
    }
  });
};

go.utils = {

    converse: function(im, token, content) {
        resp = {};
        // while(resp.type !== "msg") {
        converse_probe(im, token, content)
              .then(function (results) {  // jshint ignore:line
                  return self.im.log(results)
                        .then(function() {
                            return results;
                        });
              });
            resp = converse_probe(im, token, content)
                  .then(function (results) {  // jshint ignore:line
                      return self.im.log(results)
                            .then(function() {
                                return results;
                            });
                  });
        return resp;
    }
};
