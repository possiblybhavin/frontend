var FF = FF || {};

/**
 * FF - User
 *
 *
 * Created by jason on 9/21/14
 */
FF.User = (function ($) {

    var pub = {};

    var els = {};

    // Public functions/objects
    pub.init = init;

    /**
     * Public setters
     * @type {setReportCompany}
     */
    pub.setReportCompany = setReportCompany;
    pub.setReportLocation = setReportLocation;
    pub.setReportDateRange = setReportDateRange;
    pub.setReportMetric = setReportMetric;


    /**
     * These are user settings set by the user
     * @type {{dates: Array, timeSelect: string, company: {id: number, title: string}, location: {id: number, title: string}, metric: string}}
     */
    pub.reportSettings = {
        dates: [], // From date and to date
        timeSelect : 'monthToDate', // Default
        company : {
            id: 0,
            title: ''
        },
        location : {
            id: 0,
            title: ''
        },
        metric : ''
    };

    /**
     *
     * @type {{id: number, title: string}}
     */
    pub.location = {
        id: 0,
        title: 'No location assigned'
    };

    /**
     * Array of machines to look at.  Most reports are only one machine at a time
     * @type {Array}
     */
    pub.machines = [];

    /**
     *
     * @type {{id: number, title: string}}
     */
    pub.company = {
        id: 0,
        title: 'No company assigned'
    };

    /**
     * List of properties changed
     * @type [[]]
     */
    var changed = [];

    function setReportCompany(companyId, callback) {
        if ( typeof companyId == "number" && companyId !== 0 ) {
            if (checkNested(context.companies, companyId)) {
                // Get it from context.companies if it exists - Admin users
                pub.reportSettings.company.id = companyId;
                pub.reportSettings.company.title = context.companies[companyId].name;
                //debugger;
                setCookie('sessionCompany', pub.reportSettings.company.id);

                changed = [ 'company' ];

                updateFinish(callback);
            }
        } else {
            FF.Error.set("User.setReportCompany", 'Invalid companyID passed to setReportCompany', null, false);
        }
    }
    function setReportLocation(locationId, callback) {
        if ( typeof locationId == "number" && locationId !== 0 ) {
            if (checkNested(context.companies, pub.reportSettings.company.id, 'location', locationId, 'name')) {
                pub.reportSettings.location.id = locationId;
                pub.reportSettings.location.title = context.companies[pub.reportSettings.company.id].location[locationId].name;
                setCookie('sessionLocation',pub.reportSettings.location.id);

                changed = [ 'location' ] ;

                updateFinish(callback);
            }
        } else {
            FF.Error.set("User.setReportLocation", 'Invalid LocationID passed to setReportLocation', null, false);
        }
    }

    /**
     *
     * custom,fromdate,todate
     * monthtoDate
     * weekly
     *
     * @param dateRange
     */
    function setReportDateRange(dateRange, callback) {
        if ( typeof dateRange == 'string') {
            var dr = dateRange.split(",");
            var dateRange = [];
            pub.reportSettings.timeSelect = dr[0];
            // Custom Date Range
            if ( dr[0] === "custom" ) {
                dateRange[0] = dr[1];
                // If we only selected one value in the date range selector, then set the second param to the first
                if ( typeof(dr[2]) == "undefined" ) {
                    dateRange[1] = dr[1];
                } else {
                    dateRange[1] = dr[2];
                }
                // Time Select
            } else {
                // Bug, app.dateRanges is not initialized at the beginning
                dateRange = FF.Controls.TimeSelect.dateRanges[dr[0]];
            }
            pub.reportSettings.dates = dateRange;
            // Save to cookies
            setCookie('sessionTimeSelect', pub.reportSettings.timeSelect);
            setCookie('sessionDates', pub.reportSettings.dates.toString());

            changed = [ 'dates'] ;

            updateFinish(callback);
        } else {
            FF.Error.set('User.setReportDateRange', 'Invalid dates passed to report date range', dateRange, false);
        }
    }
    function setReportMetric(metric, callback) {
        if ( typeof metric == "string" ) {
            pub.reportSettings.metric = metric;
            setCookie('sessionMetric', pub.reportSettings.metric);

            changed = ['metric'] ;

            updateFinish(callback);
        } else {
            FF.Error.set('User.setReportMetric', 'Invalid metric passed to metric', metric, false);
        }

    }

    function getCookie() {
        var c = document.cookie.split(";");
        for ( var i in c ) {
            var kv = c[i].trim().split("=");
            if ( kv[0] == "sessionDates" ) {
                var dr = kv[1];
                if ( typeof dr == "string" && dr.length > 0 ) {
                    pub.reportSettings.dates = dr.split(',');
                }
            }
            if (kv[0] == "sessionTimeSelect") {
                var timeSelect = kv[1];
                if ( typeof timeSelect == "string" && timeSelect.length > 0) {
                    pub.reportSettings.timeSelect = timeSelect;
                }
            }
            if (kv[0] == "sessionCompany") {
                var companyId = parseInt(kv[1], 10);

            }
            if (kv[0] == "sessionLocation") {
                var locationId = parseInt(kv[1], 10)

            }

        };
        // Company ID needs to be set before locationId
        if ( typeof companyId == "number") {
            pub.setReportCompany(companyId);
            if ( typeof locationId == "number") {
                pub.setReportLocation(locationId);
            };
        };

    };

    function setCookie(name, value, expires, path, domain, secure){
        document.cookie= name + "=" + value +
            ((expires) ? "; expires=" + expires.toGMTString() : "") +
            ("; path=/") +
            ((domain) ? "; domain=" + domain : "") +
            ((secure) ? "; secure" : "");
    }

    function updateFinish(callback) {
        //saveCookie();
        // Create an event and dispatch it any time we successfully run a setter.
        // Create the event.

        $(document).trigger('user:change', [ changed ]);

        if ( typeof callback == "function") {
            callback();
        }
    };

    function init(callback) {
        // See if there is anything in the user's cookies
        getCookie();

        // If the settings in the cookies are blank, then load from the user's settings.
        if (pub.reportSettings.company.id === 0 || pub.reportSettings.company.id === "" || typeof pub.reportSettings.company == "undefined") {
            pub.reportSettings.company = pub.company;
        }
        if (pub.reportSettings.location.id === 0 || pub.reportSettings.location.id === "" ||typeof pub.reportSettings.location == "undefined" ) {
            pub.reportSettings.location = pub.location;
        }
        // If the dates did not get updated by the cookies, then fire off an update based on defaults
        //debugger;
        if (pub.reportSettings.dates.length == 0) {
            pub.setReportDateRange(pub.reportSettings.timeSelect);
        }
        updateFinish(callback);
    }

    return pub;
})(jQuery);

