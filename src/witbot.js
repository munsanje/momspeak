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
                return new EndState(name, {
                    text: "Config file empty. Shutting down.",
                    next: 'states_start'
                });
            }
            return new FreeText(name, {
                question: opts.msg == null ? prompt : opts.msg, // jshint ignore:line
                next: function(response) {
                    // console.log("opts: " + opts);
                    return go.utils.converse(self.im, self.im.config.wit.token, response)
                        // log wit's response
                        .then(function (wit_response) {
                            return self.im
                                  .log(wit_response)
                                  .then(function() {
                                      return wit_response;
                                  });
                        })
                        // taking object returned by `converse`
                        .then(function(wit_response) {
                            // console.log(wit_response);
                            if("error" in wit_response) {
                                return new EndState(name, {
                                    text: "Error at Wit server. Shutting down.",
                                    next: 'states_start'
                                });
                            }
                          // sort entities returned by confidence
                            var all_entities = _.sortBy(wit_response.data.entities,
                                                        'confidence');
                            // select only entities that satisfy threshold defined in config
                            // NOTE filter returns array ([a,b,c])
                            var entities = _.filter(all_entities, function(entity) {
                                return entity.confidence > self.im.config.wit.confidence_threshold;
                            });
                            // if no entities satisfy threshold...
                            if(_.isEmpty(entities)) {
                                // return self.states.create('states_start', {
                                //     from_wit: true  // FIXME look into from_wit
                                // });
                                return {
                                    name: 'states_converse',
                                    creator_opts: {
                                        msg: "Sorry, could you say that again?"
                                    }
                                };
                            }
                            return {
                                name: 'states_converse',//wit_response.entities[0],
                                creator_opts: {
                                    msg: wit_response.msg
                                }
                            };
                        });
                }
            });
        });
        self.states.add('user_state', function(name, opts) {
            return {
                name: 'states_converse',
                creator_opts: {
                    msg: opts.msg
                }
            };
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
                name: 'state_converse'
            };
        });

    });

    return {
        MomSpeak: MomSpeak
    };
}();
