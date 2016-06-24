/*jshint -W030*/
var go = {};
go;

var _ = require('lodash');
var vumigo = require('vumigo_v02');
var JsonApi = vumigo.http.api.JsonApi;

// TODO need to generated session_id whenever new user logs on
go.utils = {
  //  return {action: 'action', wit_msg: 'wit_msg'}
    converse: function(im, token, content) {
        var http = new JsonApi(im, {
            headers: {
                'Authorization': ['Bearer ' + token],
                'Content-Type': ['application/json'],
                'Accept': ['application/json']
            }
        });
        return http.get('https://api.wit.ai/converse?', {
            params: {
                v: '20160624', // TODO write method that extracts version
                q: content
            }
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

    var prompt = 'Welcome to MomSpeak! What can I help you with?';

    var MomSpeak = App.extend(function(self){
        App.call(self, 'states_converse');

        // converse
        self.states.add('states_converse', function(name, opts) {
            if(_.isEmpty(self.im.config.wit)) {
                return self.states.create('states_start');
            }
            return new FreeText(name, {
                question: opts.wit_msg === null ? prompt : opts.wit_msg,
                next: function(response) {
                    return go.utils
                        .converse(self.im, self.im.config.wit.token, response)
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
                          // sort entities returned by confidence
                            var all_entities = _.sortBy(wit_response.data.entities,
                                                        'confidence');
                            // select only entities that satisfy threshold defined in config
                            var entities = _.filter(all_entities, function(entity) {
                                return entity.confidence > self.im.config.wit.confidence_threshold;
                            });
                            // if no entities satisfy threshold...
                            if(_.isEmpty(entities)) {
                                return self.states.create('states_start', {
                                    from_wit: true  // FIXME look into from_wit
                                });
                            }
                            return {
                              name: $(wit_response.action),
                              creator_opts: {
                                  wit_msg: wit_response.wit_msg
                              }
                            };
                        });
                }
            });
        });
        self.states.add('states_end', function(name) {
            return new EndState(name, {
                text: 'Thank you for using our service.',
                next: 'start_start'
            });
        });

        self.states.add('states_start', function(name) {
            return self.states.create(states_converse);
        });

    });
};

go.init = function() {
    var vumigo = require('vumigo_v02');
    var InteractionMachine = vumigo.InteractionMachine;
    var MomSpeak = go.app.MomSpeak;


    return {
        im: new InteractionMachine(api, new MomSpeak())
    };
}();
