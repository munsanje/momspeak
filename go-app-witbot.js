var go = {};
go;

/* jshint -W041*/ // ignore == to compare null warning
var _ = require('lodash');
var vumigo = require('vumigo_v02');
var JsonApi = vumigo.http.api.JsonApi;
// var VERSION = self.im.config.wit.version;

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
                    im.log.debug("Executing merge");
                    return converse_probe(im, token, null);
                }
                // NOTE type is one of 'merge', 'msg', 'action', 'stop', 'error'
                else if (response.data.type == 'msg') {
                    im.log.debug("Received message: " + response.data.msg);
                    converse_probe(im, token, null);  // flush 'stop'
                    return response;

                }
                else if (response.data.type == 'stop') {
                    im.log.debug("Received type: stop");
                    return response;
                }
                // TODO implement action handler

                return response;
            });
};

go.utils = {
    converse: function(im, token, SESSION_ID, content) {
        im.log.debug('utils.sessionid: ' + SESSION_ID);
        return converse_probe(im, token, SESSION_ID, content)
              .then(function (results) {
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
    // TODO make menu state as start state with option to reset, resume, etc

    var MomSpeak = App.extend(function(self) {
        var SESSION_ID = vumigo.utils.uuid();
        App.call(self, 'states_start');

        self.states.add('states_start', function(name, opts) {
            return self.states.create('states_converse', {
                            // session_id: SESSION_ID
                  }
            );
        });
        // converse
        self.states.add('states_converse', function(name, opts) {
            if(_.isEmpty(self.im.config.wit)) {
                return self.states.create('states_noconfig_error');
            }
            self.im.log.debug("Entered `states_converse` with");
            self.im.log.debug("opts.msg: " + opts.msg);
            return new FreeText(name, {
                question: opts.msg === undefined ? "Welcome to MomSpeak" : opts.msg,
                next: function(response) {
                      self.im.log.debug("session_id: " + SESSION_ID);
                      return go.utils.converse(self.im, self.im.config.wit.token, SESSION_ID, response)
                      .then(function(wit_response) {
                          return self.im
                                .log(wit_response)
                                .then(function() {
                                    return wit_response;
                                });
                      })
                      .then(function(wit_response) {
                          if("error" in wit_response) {
                              return {
                                      name: 'states_wit_error'
                                    };
                          }
                          self.im.log.debug("Message: " + wit_response.data.msg);
                          self.im.log.debug("Type of response: " + typeof wit_response.data.msg);
                          opts.msg = wit_response.data.msg;
                          self.im.log.debug("opts.msg: " + opts.msg);
                          self.im.log.debug("Passing to `states_reply`...");
                          return {
                              name: 'states_reply',
                              creator_opts: {
                                  msg: wit_response.data.msg,
                                  // session_id: opts.session_id
                              }
                          };

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
            self.im.log.debug("In `states_reply`\n\topts.msg: " + opts.msg + "\nPassing to `states_converse`..");
            return self.states.create('states_converse', {
                    msg: opts.msg,
                    // session_id: opts.session_id
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
