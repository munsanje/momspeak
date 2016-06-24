var go = {};
go;

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

go.app = function() {
    var vumigo = require('vumigo_v02');
    var _ = require('lodash');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    var EndState = vumigo.states.EndState;
    var FreeText = vumigo.states.FreeText;

    var prompt = 'Welcome to MomSpeak!';

    var MomSpeak = App.extend(function(self){
        App.call(self, 'states_start');

        // converse
        self.states.add('states_converse', function(name, opts) {
            if(_.isEmpty(self.im.config.wit)) {
                return self.states.create('states_start');
            }
            return new FreeText(name, {
                question: opts.msg === null ? prompt : opts.msg,
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
                            if("error" in wit_response) {
                                return new EndState(name, {
                                    text: "Error occurred. Shutting down.",
                                    next: states_start
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
                                return self.states.create('states_start', {
                                    from_wit: true  // FIXME look into from_wit
                                });
                            }
                            return {
                                name: $(wit_response.entities[0]),
                                creator_opts: {
                                    msg: wit_response.msg
                                }
                            };
                        });
                }
            });
        });
        self.states.add('states_end', function(name) {
            return new EndState(name, {
                text: 'Thank you for using our service.',
                next: 'states_start'
            });
        });

        self.states.add('states_start', function(name) {
            return new FreeText(name, {
                question: $(prompt),
                next: states_converse
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
