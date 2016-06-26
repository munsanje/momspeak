var _ = require('lodash');
var vumigo = require('vumigo_v02');
var JsonApi = vumigo.http.api.JsonApi;
var SESSION_ID = vumigo.utils.uuid();
var VERSION = '20160626';

go.utils = {
  //  return {action: 'action', wit_msg: 'wit_msg'}

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
        //     if("error" in resp) {
        //         self.im.log("Error in converse");
        //         return resp;
        //     }
        // }
        return resp;
    },

    converse_probe: function(im, token, content) {
        var http = new JsonApi(im, {
            headers: {
                'Authorization': ['Bearer ' + token],
                'Accept': ['application/vnd.wit.' + VERSION + "+json"],
                'Content-Type': ['application/json']
            }
        });
        return http.post('https://api.wit.ai/converse?', {
            params: {
                v: VERSION, // write method that extracts version
                session_id: SESSION_ID,
                q: content,
            }
        });
    }
};
