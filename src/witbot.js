go.app = function() {
    var vumigo = require('vumigo_v02');
    var _ = require('lodash');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    var EndState = vumigo.states.EndState;
    var FreeText = vumigo.states.FreeText;
    var SESSION_ID = vumigo.utils.uuid();
    // TODO make menu state as start state with option to reset, resume, etc

    var MomSpeak = App.extend(function(self){
        App.call(self, 'states_start');

        self.states.add('states_start', function(name, opts) {
            return self.states.create('states_converse', {
                        session_id: SESSION_ID
                  }
            );
        });
        // converse
        self.states.add('states_converse', function(name, opts) {
            if(_.isEmpty(self.im.config.wit)) {
                return self.states.create('states_noconfig_error');
            }
            self.im.log("Entered `states_converse` with");
            self.im.log("opts.msg: " + opts.msg);
            return new FreeText(name, {
                question: opts.msg === undefined ? "Welcome to MomSpeak" : opts.msg,
                next: function(response) {
                      self.im.log("session_id: " + opts.session_id);
                      return go.utils.converse(self.im, self.im.config.wit.token, opts.session_id, response)
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
                          self.im.log("Message: " + wit_response.data.msg);
                          self.im.log("Type of response: " + typeof wit_response.data.msg);
                          opts.msg = wit_response.data.msg;
                          self.im.log("opts.msg: " + opts.msg);
                          self.im.log("Passing to `states_reply`...");
                          return {
                              name: 'states_reply',
                              creator_opts: {
                                  msg: wit_response.data.msg,
                                  session_id: opts.session_id
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
            self.im.log("In `states_reply`\n\topts.msg: " + opts.msg + "\nPassing to `states_converse`..");
            return self.states.create('states_converse', {
                    msg: opts.msg,
                    session_id: opts.session_id
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
