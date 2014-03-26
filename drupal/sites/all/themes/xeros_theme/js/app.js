// The main router of the report app

var app = {

    defaults : {
        timeSelect : "monthToDate"
    },
    apiUrlBase: "",
    apiUrl: "",
    machine: 0, // Initial machine when there is no hash
    metric: "", // Initial metric when there is no hash
    tpl: {}, // Our page template
    dataRefresh: 1,
    reportData: {},
    data: {}, // Any event that wants new data should flag dataRefresh to be 1

    date : new Date(), // The current date
    dateRange : ["", ""], // SQL formatted date ranges "2013-11-01", "2013-12-02"
    dateRanges : {
        weekToDate : this.dateRange,
        monthToDate : this.dateRange,
        yearToDate : this.dateRange,
        custom : this.dateRange
    }, // Available date ranges
    location : "",
    sessionDateRange : [], // The apps current date range
    sessionTimeSelect : "",
    sessionMetric : "",
    err : jQuery(".error-messages"),

    sqlDate : function(d) {
        // date needs to be a native js date object (new Date())
        var sqlDate = "";
        sqlDate = "" + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
        return sqlDate;
    },

    createDateRanges : function() {
        self = this;

        var fromDate = new Date();
        var toDate = new Date();

        // Year to date
        fromDate.setMonth(0);
        fromDate.setDate(1);
        self.dateRanges.yearToDate = [
            self.sqlDate(fromDate),
            self.sqlDate(toDate)
        ];

        // Month to date
        fromDate = new Date();
        fromDate.setDate(1);
        self.dateRanges.monthToDate = [
            self.sqlDate(fromDate),
            self.sqlDate(toDate)
        ]

        // Week to date
        fromDate = new Date();
        fromDate.setDate(toDate.getDate() - (toDate.getDay() - 1))
        self.dateRanges.weekToDate = [
            self.sqlDate(fromDate),
            self.sqlDate(toDate)
        ]
    },

    saveCookie : function() {
        self = this;
        document.cookie = 'sessionDateRange=' + self.sessionDateRange;
        document.cookie = 'sessionTimeSelect=' + self.sessionTimeSelect;
    },

    getCookie : function() {
        self = this;
        var c = document.cookie.split(";");
        for ( i in c ) {
            var kv = c[i].trim().split("=");
            if ( kv[0] == "sessionDateRange" ) {
                self.sessionDateRange = kv[1].split(",");
            }
            if (kv[0] == "sessionTimeSelect") {
                self.sessionTimeSelect = kv[1];
            }
            console.log(kv);
        };
        console.log(c);
    },

    registerEvents: function () {
        var self = this;
        // Register routing listener
        jQuery(window).on('hashchange', jQuery.proxy(this.route, this));
    },

    setApiUrl: function () {
        self = this;
        self.apiUrl = "/api/report/" + self.reportName + "/" + self.sessionDateRange[0] + "/" + self.sessionDateRange[1];
        if ( self.location !== "" ) {
            self.apiUrl += "/" + self.location;
        }
        self.apiUrl += ".json";
    },

    route: function () {
        var self = this;
        var hash = window.location.hash;
        var hashArray = hash.substr(1).split("+");

        // See if there are setting in the session cookie.
        self.getCookie();

        // Remove any error messages from the page
        jQuery(app.err).removeClass("active");

        // If no hash
        if (!hash) {

            // If there is no value in the session, then use the app default.
            if ( self.sessionDateRange.length === 0 ) {
                self.sessionDateRange = self.dateRanges[self.defaults.timeSelect];
                self.sessionTimeSelect = self.defaults.timeSelect;
            }
            // Build the apiUrl
            self.setApiUrl();
        // If there is a hash
        } else {
            hashArray = hash.substr(1).split("+");
            if (hashArray.length > 1) {
                self.machine = hashArray[0];
                if ( hashArray[1].length > 1 ) {
                    self.metric = hashArray[1];
                    self.sessionMetric = hashArray[1];
                }
                if ( hashArray[2].length > 1 ) {
                    // If this is a custom date range, then we take the date range out of the URL and store
                    // sessionTimeSelect as custom
                    if ( hashArray[2].substr(0,6) === "custom" ) {
                        var dr = hashArray[2].split(",");
                        self.sessionDateRange[0] = dr[1];
                        // If we only selected one value in the date range selector, then set the second param to the first
                        if ( typeof(dr[2]) == "undefined" ) {
                            self.sessionDateRange[1] = dr[1];
                        } else {
                            self.sessionDateRange[1] = dr[2];
                        }

                        self.sessionTimeSelect = dr[0];
                        console.log(dr);
                    } else {
                        self.sessionDateRange = self.dateRanges[hashArray[2]];
                        self.sessionTimeSelect = hashArray[2];
                    }
                }
                if ( typeof(hashArray[3]) !== 'undefined' && hashArray[3].length > 1 )  {
                    self.location = hashArray[3];
                }
            }
        }
        controls.setCsvLink();
        controls.setDateRangeDisplay();
        // This is a little funky, but we are going to let the view inherit our showReport method
        self.saveCookie();
        // if dataRefresh equals 1, then go to the web service again and get new data
        if ( app.dataRefresh == 1 ) {
            self.setApiUrl();
            app.fadeReport();
            app.getData();
        } else {
            view.parseData(self.showReport);
        }
    },

    // This is going to be passed as a function to the view
    showReport: function () {
        controls.hideSpinner();
        var html = app.tpl(app.reportData);
        jQuery('.template-container').html(html).removeClass("fade");
        controls.createMachineNav();
    },

    fadeReport: function () {
        jQuery('.template-container').addClass("fade");
        jQuery('#spinner').show();
    },

    getData: function () {
        var self = this;
        // Get the data then go to routing
        jQuery.ajax({
            url: self.apiUrl,
            dataType: 'json',
            success: function (data) {
                console.log("data retrieved");
                console.log(app.apiUrl);
                console.log(data);
                self.data = data;
                self.dataRefresh = 0;
                self.route();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("Ajax Error: " + textStatus + " -- " + errorThrown + "--" + jqXHR);
                jQuery(app.err).addClass("active");
                jQuery(app.err).html("Oops, something happened with the data service.  Please contact your system administrator.");
            }
        })
    },

    initialize: function () {
        var self = this;

        self.reportName = window.reportName;
        // Sometimes the summary data comes back empty when we don't have readings yet.

        Handlebars.registerHelper("formatMoney", function(value, decPlaces, thouSeparator, decSeparator) {
            if ( typeof(value) === "undefined" )  {
                return 0
            } else {
                var n = value,
                decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 0 : decPlaces,
                decSeparator = decSeparator == undefined ? "." : decSeparator,
                thouSeparator = thouSeparator == undefined ? "," : thouSeparator,
                sign = n < 0 ? "-" : "",
                i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "",
                j = (j = i.length) > 3 ? j % 3 : 0;
                return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
            }
        });

        Handlebars.registerHelper("isBlank", function(value) {
            if ( typeof(value) === "undefined" )  {
                return 0
            } else {
                return value;
            }
        });

        Handlebars.registerHelper("toLocaleString", function(value, dec) {
            if ( typeof(value) === "undefined" )  {
                return 0
            } else {
                var d = parseInt(dec);
                if ( typeof(d) !== "number" ) {
                    dec = 0;
                }
                var t = parseFloat(value);
                t = t.toFixed(dec);
                t = parseFloat(t);
                t = t.toLocaleString({style: "decimal"});
                return t;
            }
        })

        self.tpl = Handlebars.compile(jQuery("#page-tpl").html());

        self.createDateRanges();

        self.registerEvents();
        // Do the things that get values from the template (window)
        self.apiUrlBase = window.apiUrlBase;
        self.fromDate = self.sessionDateRange[0];
        self.toDate = self.sessionDateRange[1];
        self.route();

    }
}

//app.initialize();