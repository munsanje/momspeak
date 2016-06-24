var _ = require('lodash');
var vumigo = require('vumigo_v02');
var JsonApi = vumigo.http.api.JsonApi;
var SESSION_ID = vumigo.utils.uuid();


go.utils = {
  //  return {action: 'action', wit_msg: 'wit_msg'}

    converse: function(im, token, content) {
        resp = {};
        while(resp.type !== "stop") {
            resp = _.union(resp, converse_probe(im, token, content));
            if("error" in resp) {
                return resp;
            }
        }
        return resp;
    },

    converse_probe: function(im, token, content) {
        var http = new JsonApi(im, {
            headers: {
                'Authorization': ['Bearer ' + token],
                'Content-Type': ['application/json'],
                'Accept': ['application/json']
            }
        });
        return http.post('https://api.wit.ai/converse?', {
            params: {
                v: '20160624', // write method that extracts version
                session_id: SESSION_ID,
                q: content,
            }
        });
    }
};
