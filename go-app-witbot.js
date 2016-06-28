var go = {};
go;

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
                      q: content // jshint ignore:line
                    }
                }

                )
                .then(function(response) {
                    if(response.data.type == 'merge') {
                        im.log("Executing merge");
                        return converse_probe(im, token, null);
                    }
                    // else if (response.type == 'msg') {
                    //     //converse_probe(im, token, null);
                    //     return response;
                    // }
                    else if (response.data.type == 'msg') {
                        im.log("Received message: " + response.data.msg);
                        converse_probe(im, token, null);  // flush 'stop'
                        return response;

                    }
                    return response;
                });
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

go.app = function() {
    var vumigo = require('vumigo_v02');
    var _ = require('lodash');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    var EndState = vumigo.states.EndState;
    var FreeText = vumigo.states.FreeText;

    var prompt = 'Welcome to MomSpeak!';
    // var TOKEN = self.im.config.wit.token; //'CS5JSQLP3OO5MRLTYX3EVBEIJYRY3YPS';
    // var THRESHOLD = self.im.config.wit.confidence_threshold; //0.8;

    var MomSpeak = App.extend(function(self){
        App.call(self, 'states_start');

        self.states.add('states_start', function(name, opts) {
          return self.states.create('states_converse', {
            msg: prompt
          });
        });
        // converse
        self.states.add('states_converse', function(name, opts) {
            if(_.isEmpty(self.im.config.wit)) {
                return self.states.create('states_noconfig_error');
            }
            self.im.log("opts.msg: " + opts.msg);
            return new FreeText(name, {
                question: opts.msg,
                next: function(response) {
                      return go.utils.converse(self.im, self.im.config.wit.token, response)
                      .then(function(wit_response) {
                          return self.im
                                .log(wit_response)
                                .then(function() {
                                    return wit_response;
                                });
                      })
                      .then(function(wit_response) {
                          if("error" in wit_response) {
                              return self.states.create('states_wit_error');
                          }
                          self.im.log("Message: " + wit_response.data.msg);
                          self.im.log("Type of response: " + typeof wit_response.data.msg);
                          return self.states.create('states_reply', {
                                              msg: wit_response.data.msg
                                });

                      });
                  }


              });
        });

        self.states.add('states_noconfig_error', function(name) {
            return new EndState(name, {
                text: "Config file empty. Shutting down.",
                next: 'states_start'
            });
        });

        self.states.add('states_wit_error', function(name) {
            return new EndState(name, {
                text: "Error at Wit server. Shutting down.",
                next: 'states_start'
            });
        });

        self.states.add('states_reply', function(name, opts) {
            return self.states.create('states_converse', {
                msg: opts.msg
            });
        });

        self.states.add('states_end', function(name) {
            return new EndState(name, {
                text: 'Thank you for using our service.',
                next: 'states_start'
            });
        });


    });

    return {
        MomSpeak: MomSpeak
    };
}();

go.init = function() {
    var vumigo = require('vumigo_v02');
    var InteractionMachine = vumigo.InteractionMachine;
    var MomSpeak = go.app.MomSpeak;


    return {
        im: new InteractionMachine(api, new MomSpeak())
    };
}();
