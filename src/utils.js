/* jshint -W041*/ // ignore == to compare null warning
var _ = require('lodash');
var vumigo = require('vumigo_v02');
var JsonApi = vumigo.http.api.JsonApi;
var SESSION_ID = vumigo.utils.uuid();
// var VERSION = self.im.config.wit.version;

var converse_probe = function(im, token, content) {
  var http = new JsonApi(im, {
    headers: {
      'Authorization': ['Bearer ' + token],
      'Accept': ['application/vnd.wit.' + im.config.wit.version + "+json"],
      'Content-Type': ['application/json']
    }
  });
    var resp = http.post('https://api.wit.ai/converse?', content == null ?
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
                      q: content // jshint ignore:line
                    }
                }

        )
        .then(function(response) {
            if(response.type == 'merge') {
                return converse_probe(im, token, null);
            }
            // else if (response.type == 'msg') {
            //     //converse_probe(im, token, null);
            //     return response;
            // }
            return response;
        });
    return resp;
};

go.utils = {
    converse: function(im, token, content) {
        return converse_probe(im, token, content)
              .then(function (results) {  // jshint ignore:line
                  return im.log(results)
                        .then(function() {
                            return results;
                        });
              });
    }
};
