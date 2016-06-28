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
        App.call(self, 'states_converse');

        // converse
        self.states.add('states_converse', function(name, opts) {
        if(_.isEmpty(self.im.config.wit)) {
            return self.states.create('states_noconfig_error');
        }
        return new FreeText(name, {
            question: opts.msg === undefined ? prompt : opts.msg,
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
                    return self.states.create('states_converse', {
                                        msg: wit_response.data.msg
                          });

                        });
              }


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

        self.states.add('states_start', function(name) {
            // return new FreeText(name, {
            //     question: prompt,
            //     next: 'states_converse'
            // });
            return {
                name: 'states_converse',
                creator_opts : {
                    msg: prompt
                }
            };
        });
    });

    return {
        MomSpeak: MomSpeak
    };
}();
