// Biosearch Routes
App.BiosearchIndexRoute = Ember.Route.extend({

    setupController: function(controller, model, params) {
        console.log("biosearch index");
    },  
    //if we leave the route then set the params to the defaults
    resetController: function(controller, isExiting, transition) {

        if (isExiting) {
            // isExiting would be false if only the route's model was changing
            controller.set('showProvenance', false);
            controller.set('type', 'freetext');
        }
    },
    actions: {
        queryParamsDidChange: function() {
            this.refresh();
        }
    }
    
});
