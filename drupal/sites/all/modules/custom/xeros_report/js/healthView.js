/**
 * Created by jason on 2/5/14.
 */
var colors = {
    blueOne : "rgba(0,135,190,1)",
    orange: "rgba(247,146,12,1)",  //old "rgba(255,185,67,.65)",
    yellow : "rgba(251,229,105,1)", //old yellow : color rgba(255,185,67,1)
    brown:"rgba(105,69,30,1)",
    grey:"rgba(172,173,176,1)",
    blueTwo : "rgba(142,178,209,1)" //"rgba(0,135,190,.65)"
};


var view = {
    barColor : {
       xeros : {
           actual : colors.blueOne,
           model : colors.grey,
           modelSimple : colors.grey
       },
        nonXeros : {
            actual : colors.brown,
            model : colors.orange
        }
    },
    // Each report view has a slightly different data structure
    parseData : function(draw) {
        var self = this;

        app.reportData = app.data;

        self.getActionData(function(actionData) {

            for ( i in app.reportData) {

                var cssClass = [];

                var machineId = parseInt(app.reportData[i].info.machine_id, 10);

                var machineType = app.reportData[i].info.machine_type;

                app.reportData[i].water_only = parseInt(app.reportData[i].info.water_only, 10);

                /**
                 * This is the logic to pick the default comparison and to list what comparisons are available.
                 */
                app.reportData[i].delta = {
                    cold_water : {},
                    therms : {}
                }

                // Machine Type Xeros
                if (machineType == 'xeros') {
                    app.reportData[i].actual.barColor = self.barColor.xeros.actual;
                    cssClass.push("xeros");
                    cssClass.push("model-non-xeros");
                    cssClass.push("model-non-xeros-simple");
                    // Compare Xeros machine to non-xeros calculations
                    app.reportData[i].model = app.reportData[i].model_non_xeros_simple;
                    app.reportData[i].model.barColor = self.barColor.nonXeros.model;
                } else {
                    app.reportData[i].actual.barColor = self.barColor.nonXeros.actual;
                    cssClass.push("non-xeros");
                    // Comparison for Non Xeros machines
                    if (app.reportData[i].water_only == 1) {
                        cssClass.push("model-xeros");
                        cssClass.push("model-xeros-simple");
                        // If water only, then use the model_xeros_simple calculations
                        app.reportData[i].model = app.reportData[i].model_xeros_simple;
                        app.reportData[i].model.barColor = self.barColor.xeros.modelSimple;
                    } else {
                        // If we have cycle data, then use the full Xeros model that is based on classifications
                        app.reportData[i].model = app.reportData[i].model_xeros;
                        app.reportData[i].model.barColor = self.barColor.xeros.model;
                        cssClass.push("model-xeros");
                    }
                }

                if ( app.reportData[i].water_only === 1 ) {
                    cssClass.push("water-only");
                    app.reportData[i].cycles = 'water only';
                } else {

                }

                app.reportData[i].delta.cold_water = self.calculateDelta(app.reportData[i].actual.cold_water, app.reportData[i].model.cold_water, app.reportData[i].info.machine_type, Drupal.t('gallons of water',{},{context:'Health Detail'}));

                app.reportData[i].delta.therms = self.calculateDelta(app.reportData[i].actual.therms, app.reportData[i].model.therms, app.reportData[i].info.machine_type, Drupal.t('therms',{},{context:'Health Detail'}));

                app.reportData[i].info.cssClass = cssClass.join(" ");

                // Append the actionData
                app.reportData[i].actionData = actionData[machineId];
            }


            draw(); // This does the html template draw

            self.drawCharts();

            //TODO: Need to set each cell to the same height, and then add padding
            jQuery('.row:not(.first)').each(function() {
               // debugger;
                var rowHeight = jQuery(this).innerHeight();
                var cols = jQuery(this).find('.col .col__wrapper');

                cols.each(function() {
                 ///   debugger;
                    var colHeight = jQuery(this).outerHeight();
                    var paddingtop = (rowHeight - colHeight) / 2 ;

                    jQuery(this).find('.front').css('height', rowHeight - paddingtop);
                    jQuery(this).find('.front').css('padding-top', paddingtop);
                    jQuery(this).find('.back').css('padding-top', paddingtop);
                    jQuery(this).find('.back').css('height', rowHeight - paddingtop);
                    //jQuery('.back').css('height', rowHeight - paddingtop);
                    var offset = 5;
                   // jQuery('.flipper-openbtn').css('top',-(paddingtop/3));
                   // jQuery('.flipper-closebtn').css('top',(paddingtop/3));
                  //  jQuery('.front').css('height', rowHeight - paddingtop);
                    //jQuery('.health').css('height', rowHeight);
                    //jQuery(this).css('padding-bottom', (rowHeight - colHeight) / 2 );
                });
                //jQuery('.flipcontainer').css('height', colHeight);
                //jQuery('.front').css('height', rowHeight );
            });

            self.bindEvents();
        })
    },
    getActionData : function(callback) {
        // Get the action data
        jQuery.ajax({
            url: '/actions/json',
            dataType: 'json',
            success: function (data) {
                // Append the data and finish this function
                if (typeof callback == "function") {
                    callback(data);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                FF.Error.set('healthView.getActionData', "Oops, something happened with the actions service.  Please contact your system administrator.", errorThrown, TRUE);
            }
        });
    },
    isValid : function(arr) {
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
    updateLegend : function() {
        var self = this;

        var legendTemplate = Handlebars.compile(jQuery("#report-health .legend").html());
        var html = legendTemplate(view.barColor);
        jQuery('#report-health .legend').html(html).removeClass("fade");
    },
    calculateDelta : function(actual, model, machineType, metric) {

        var message = '';

        // percent difference
        var delta = 0;

        // absolute difference
        var diff = 0;

        if ( machineType == 'xeros') {
            numerator = parseInt(actual, 10);
            denominator = parseInt(model, 10);
        } else {
            numerator = parseInt(model, 10);
            denominator = parseInt(actual, 10);
        }

        // BUG - Divide by zero throws NaN

        // Divide by 0
        if ( denominator === 0 ) {
            if ( numerator === 0 ) {
                delta = 0;
            } else {
                delta = 100;
            }
        } else {
            delta = parseInt(((denominator - numerator) / denominator) * 100);
        }

        diff = parseInt(denominator - numerator);

        var cssClass = '';
        // TODO: Ron - double check this logic.
        if ( delta > 0 ) {
            cssClass = 'positive'
            if ( machineType == 'xeros') {
                message = 'Because you are using a Xeros machine you used ' + diff + ' less ' + metric;
            } else {
                message = 'If you were using a Xeros machine you would have used ' + diff + ' less ' + metric;
            }
        } else if ( delta < 0 ) {
            cssClass = 'negative'
            if ( machineType == 'xeros') {
                message = 'Because you are using a Xeros machine you used ' + diff + ' more ' + metric;
            } else {
                message = 'If you were using a Xeros machine you would have used ' + diff + ' more ' + metric;
            }
        } else {
            cssClass = 'equal'
            if ( machineType == 'xeros') {
                message = 'You used the same amount of ' + metric + ' in your Xeros machine as the industry average.';
            } else {
                message = 'You used the same amount of ' + metric + ' in your Non-Xeros machine as you would with a Xeros machine.';
            }
        }


        return {
            value : delta,
            cssClass : cssClass,
            message : message
        }
    },
    drawCharts : function() {
        var self = this;
        var total = 0;

        // Get the max value of each metric for each machine so that the charts on the screen
        // are relative to each other

        // TODO: Refactor candidate

        var c = [],
            h = [],
            t = [],
            tm = [],
            ch = [],
            domainMultiple = 1.1; // Use this value to keep the values from maxing out

        // Calculate the domains
        for ( i in app.reportData ) {
            var row = app.reportData[i];


            c.push(parseInt(row.actual.cold_water));
            c.push(parseInt(row.model.cold_water));

            h.push(parseInt(row.actual.therms));
            h.push(parseInt(row.model.therms));

//            tm.push(parseInt(row.actual.time));
//            tm.push(parseInt(row.model.time));
//
//            ch.push(parseInt(row.actual.chemical));
//            ch.push(parseInt(row.model.chemical));
        }


        for ( i in app.reportData ) {
            var row = app.reportData[i];

            chart.data = [];
            chart.selector = "";

            if (row.info.machine_type == 'xeros') {

                chart.colors = [row.actual.barColor, row.model.barColor];
                chart.classes = ["base", "xeros"];

                // Cold Water
                chart.selector = "[chart=cold_water-" + row.info.machine_id + "] .chart";

                chart.data = [parseInt(row.actual.cold_water), parseInt(row.model.cold_water), d3.max(c) * domainMultiple];
                if ( self.isValid(chart.data) ) {
                    chart.drawBar();
                }

                // Hot Water
                chart.selector = "[chart=hot_water-" + row.info.machine_id + "] .chart";
                chart.data = [parseInt(row.actual.therms), parseInt(row.model.therms), d3.max(h) * domainMultiple];
                if ( self.isValid(chart.data) ) {
                    chart.drawBar();
                }

            } else {

                chart.colors = [row.actual.barColor, row.model.barColor];
                chart.classes = ["base", "non-xeros"];

                // Cold Water
                chart.selector = "[chart=cold_water-" + row.info.machine_id + "] .chart";

                chart.data = [parseInt(row.actual.cold_water), parseInt(row.model.cold_water), d3.max(c) * domainMultiple];
                if ( self.isValid(chart.data) ) {
                    chart.drawBar();
                }

                // Hot Water
                chart.selector = "[chart=hot_water-" + row.info.machine_id + "] .chart";
                chart.data = [parseInt(row.actual.therms), parseInt(row.model.therms), d3.max(h) * domainMultiple];
                if ( self.isValid(chart.data) ) {
                    chart.drawBar();
                }
            }
        }
    },
    initialize : function() {
        //createDropDown();
        FF.User.init(function() {
            app.initialize();
            FF.Controls.TimeSelect.create();
            view.updateLegend();
        });



    },
    bindEvents : function() {
        /*
         Controls for the Flipping action for Water Sewer and Therms
         @author Ron Kozlowski
         */
        jQuery(".flipper-openbtn").click(function () {
            jQuery(this).parents('.flip-container').addClass("hover");
            if (FF.Utils.msieVersion() != false && FF.Utils.msieVersion() <= 11) {
                var flipper = jQuery(this).parents('.flipper');
                var back = flipper.find('.back');
                var front = flipper.find('.front');
                back.css({"opacity": "1", "z-index": "2", "backface-visibility": "visible"});
                front.css({"opacity": "0", "z-index": "0", "backface-visibility": "hidden"});
            }

        });

        jQuery(".flipper-closebtn").click(function () {

            jQuery(this).parents('.flip-container').removeClass("hover");
            // console.log(FF.Utils.msieVersion());
            if (FF.Utils.msieVersion() != false && FF.Utils.msieVersion() <= 11) {
                var flipper = jQuery(this).parents('.flipper');
                var back = flipper.find('.back');
                var front = flipper.find('.front');
                front.css({"opacity": "1", "z-index": "2", "backface-visibility": "visible"});
                back.css({"opacity": "0", "z-index": "0", "backface-visibility": "hidden"});

            }
        });

        //Patch for IE 9 where Cards display back instead of fronts. - RNK
        if (FF.Utils.msieVersion() != false && FF.Utils.msieVersion() <= 9) {
            jQuery('.back').css({"opacity": "0", "z-index": "0", "backface-visibility": "hidden"});
            jQuery('.front').css({"opacity": "1", "z-index": "2", "backface-visibility": "visible"});
        }
    }
}



