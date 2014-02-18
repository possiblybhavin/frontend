/**
 * Created by jason on 2/5/14.
 */
var view = {

    // Each report view has a slightly different data structure
    parseData : function(draw) {
        var self = this;
        //app.reportData = app.data.data[app.machine].metrics[app.metric];

        app.reportData = app.data;

        app.reportData.data[0].summaryData.cost = 0;
        app.reportData.data[0].summaryData.cost_xeros = 0;
        app.reportData.data[0].summaryData.value = 0;
        app.reportData.data[0].summaryData.value_xeros = 0;

        for (var i = 1; i < 4; i++) {
            app.reportData.data[0].summaryData.cost += parseInt(app.reportData.data[i].summaryData.cost, 10) ;
            app.reportData.data[0].summaryData.cost_xeros += parseInt(app.reportData.data[i].summaryData.cost_xeros, 10);
            app.reportData.data[0].summaryData.value += parseInt(app.reportData.data[i].summaryData.value, 10) ;
            app.reportData.data[0].summaryData.value_xeros += parseInt(app.reportData.data[i].summaryData.value_xeros, 10) ;
        }


        for ( i in app.reportData.data ) {
            s = app.reportData.data[i].summaryData;
            app.reportData.data[i].summaryData.savings = self.delta(s.cost, s.cost_xeros);
        }

        draw(); // This does the html template draw
        self.drawCharts();
        self.bindNav();
        //exportPDF.init();
    },
    delta : function(base, change) { // TODO: Move to a utility library
        var delta = 0;
        delta = parseInt(((parseInt(base, 10) - parseInt(change, 10)) / parseInt(base, 10)) * 100);
        return delta;
    },
    isValid : function(arr) { // TODO: Move to a utility library
        var isValid = true;

        for ( i in arr ) {
            if ( isNaN(arr[i]) ) {
                isValid = false;
                return isValid;
                // Break out because the whole array is invalid if one value is
            }
        }
        return isValid;
    },
    drawCharts : function() {
        var self = this;
        chart.data = [];
        for ( i in app.data.data ) {
            chart.data = app.data.data[i];
            chart.drawKPI();
        }
    },
    showNews: function() {
      var self = this;

    },
    initialize : function() {
        // Do any initialization unique to this view.
        controls.createTimeSelect();
    },
    bindNav : function() {
        // Bind any navigation that is on an item in a template.
    }
}

// Initialize
view.initialize();