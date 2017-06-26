App.BiosearchIndexController = Ember.Controller.extend({

    searchTypes: [{
        type: 'Freetext',
        value: 'freetext'
    }, {
        type: 'ByWikiPathwaysId',
        value: 'wpid'
    }],    
    bioSearchType: "freetext",
    isFreeTextSearch: function() {
        //alert(this.get('bioSearchType') === 'freetext');
        return this.get('bioSearchType') === 'freetext';
    }.property('bioSearchType'),
    isIdSearch: function() {
        //alert(this.get('bioSearchType') === 'wpid');
        return this.get('bioSearchType') === 'wpid';
    }.property('bioSearchType'),
    
});