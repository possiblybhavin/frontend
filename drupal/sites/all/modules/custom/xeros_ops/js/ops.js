/**
 * Namespace: FF
 *   Setup namespace if it has not already been setup.
 */
var FF = FF || {};

/**
 * Variable: labels
 *  Contains the labels for this page, so that they can be translated
 */


/**
 * Class: FF.Hud
 *   Encapsulates functionality related to the header
 */
FF.Hud = (function($){

    /**
     * Variable: els
     *   A cache for element references
     * @type {{}}
     */
    var els = {};

    /**
     * Variable: pub
     *   Contains publicly accessible methods
     * @type {{}}
     */
    var pub = {};


    var data = {};

    var tpl = {};

    var services = {};

    var status = {};

    var history = {};

    var machineHistory = {};

    var machineIds = [];

    // Turn refresh on
    var refresh = true;

    var refreshInterval = 5 * 60; // 5 minutes

    var labels = {
        start_time: Drupal.t("Start Time", {}, {context: "Status Board Detail"}),//translate("Start Time"),
        end_time:  Drupal.t("End Time", {}, {context: "Status Board Detail"}),//translate("End Time"), //translate("End Time"),
        status: Drupal.t("Status", {}, {context: "Status Board Detail"}),//translate("Status"),
        not_monitored:  Drupal.t("This machine is currently not actively monitored", {}, {context: "Status Board Detail"}),//translate("This machine is currently not actively monitored"),
        status_log: Drupal.t("View Status Log", {}, {context: "Status Board Detail"}),//translate("View Status Log"),
        machine_details: Drupal.t("Machine Details", {}, {context: "Status Board Detail"}),//translate("Machine Details"),
        company: Drupal.t("Company", {}, {context: "Status Board Detail"}),//translate("Company"),
        location: Drupal.t("Location", {}, {context: "Status Board Detail"}),//translate("Location"),
        serial: Drupal.t("Serial Number", {}, {context: "Status Board Detail"}),//translate("Serial Number"),
        cycles: Drupal.t("Cycles", {}, {context: "Status Board Detail"}),//translate("Cycles"),
        summary: Drupal.t("Summary", {}, {context: "Status Board Detail"}),//translate("Summary"),
        last_cycle: Drupal.t("Last Cycle Ended", {}, {context: "Status Board Detail"}),//translate("Last Cycle Ended"),
        cycles_today: Drupal.t("Cycles Today", {}, {context: "Status Board Detail"}),//translate("Cycles Today"),
        total_run_time: Drupal.t("Total Run Time Today", {}, {context: "Status Board Detail"}),//translate("Total Run Time Today"),
        cold_water: Drupal.t("Cold Water Used", {}, {context: "Status Board Detail"}),//translate("Cold Water Used"),
        hot_water: Drupal.t("Hot Water Used", {}, {context: "Status Board Detail"}),//translate("Hot Water Used"),
        therms: Drupal.t("Therms", {}, {context: "Status Board Detail"}),//translate("Therms"),
        chemicals: Drupal.t("Chemicals", {}, {context: "Status Board Detail"}),//translate("Chemicals"),
        gallons: Drupal.t("gallons", {}, {context: "Status Board Detail"}),//translate("gallons"),
        ounces: Drupal.t("ounces", {}, {context: "Status Board Detail"}),//translate("ounces")

    };

    function translate(label) {
        return Drupal.t(label, {}, {context: "Status Board Detail"});
    }

    function formatData() {
        // Grab the global data object and create a local copy so we can
        // refactor easily later;

        data.machine = {
            'companies' : {}
        };

        //var j = 0;
        var alert = 0;

        //for (i = 0; i < data.machineSource.length; i++) {
        for (var i in data.machineSource) {
            if (data.machineSource.hasOwnProperty(i)) {

                //console.log(data.machineSource[i]);
                var m = data.machineSource[i];

                // If the company is not on the object yet, initialize it
                if ( typeof data.machine.companies[m.company_title] == 'undefined') {
                    data.machine.companies[m.company_title] = {
                        'locations' : {},
                        'company_title' : m.company_title,
                        faultCount: 0,
                        monitoredMachineCount: 0
                    };
                }
                // If the location is not on the object yet, initialize it
                if ( typeof data.machine.companies[m.company_title].locations[m.location_title] == 'undefined') {
                    data.machine.companies[m.company_title].locations[m.location_title] = {
                        'machines' : {},
                        'location_title' : m.location_title
                    };
                }

                // Set the model filter
                if (m.manufacturer == 'Xeros' ) {
                    m.modelFilter = 'xeros';
                } else {
                    m.modelFilter = 'non-xeros';
                }

                // If the machine is not offline, add to the list of monitored servers and check fault count
                if (m.machine_status !== "offline") {
                    data.machine.companies[m.company_title].monitoredMachineCount += 1;
                    if ( !checkNested(m, 'status', 'status_code') ||  m.status.status_code <= 0) {
                       data.machine.companies[m.company_title].faultCount += 1;
                    }
                }

                data.machine.companies[m.company_title].locations[m.location_title].machines[i] = m;
            }
        }

        // Sort the companies
        // TODO: We should probably reformat the whole data object as nested arrays instead of objects to allow
        // easier sorting

        var s = _.pairs(data.machine.companies);

        // Put sites with the fewest monitored machines at the bottom
        s = _.sortBy(s, function(obj) { return -(obj[1].monitoredMachineCount) } );

        // Put machines with the most faults at the top
        s = _.sortBy(s, function(obj) { return -(obj[1].faultCount) } );

        data.machine.companies = _.object(s);

      //  console.log(s);

      //  console.log (data.machine);
    };

    function formatStatus(data) {
        var _status = {};
        for (i=0; i < data.length; i++) {
            var _machineStatus = data[i];
            if ( _machineStatus !== null ) {
                var _machineId = _machineStatus.machineId;
                delete _machineStatus.machineId;
                _status[_machineId] = _machineStatus;
            }
        };
        return _status;
    };

    function formatHistory(data) {
        var _status = [];
        if ( typeof data !== "undefined" ) {
            _status = _.pairs(data);
            // Invert the order
            _status = _.sortBy(_status, function(obj) { return -(obj[0]) });
        }

       // console.log('history', _status);
        return _status;
    };

    //loadStatus = function(callback) {
    //    console.log('machineIds: ', machineIds);
    //    jQuery.ajax({
    //        url: 'ws/status-board/status/' + machineIds.toString(),
    //        //data: '[' + machineIds.toString() + ']',
    //        success: function(d) {
    //            status = formatStatus(d);
    //        },
    //        dataType: 'json',
    //        type: 'GET',
    //        contentType: 'application/json'
    //    });
    //};

    function loadHistory(machineId, callback) {
        //console.log('machineId: ', machineId);
        jQuery.ajax({
            url: 'ws/status-board/history/' + machineId.toString(),
            //data: '[' + machineId.toString() + ']',
            success: function(d) {
                for (var first in d) break;
                //data.details.history = d[first];
                data.details.history= formatHistory(d[first], d.user_timezone);
                data.details.user_timezone = d.user_timezone;
                callback(machineId);
            },
            dataType: 'json',
            type: 'GET',
            contentType: 'application/json'
        });
    };

    function loadCycles(machineId, callback) {
        jQuery.ajax({
            url: 'ws/status-board/cycles/' + machineId.toString(),
            //data: '[' + machineId.toString() + ']',
            success: function(d) {
                for (var first in d) break;
                data.details.cycles = d[first];
                if ($(d).length > 0) {
                    data.details.last_cycle_end_time = d[first][d[first].length - 1].cycle_end_time;
                    data.details.last_cycle_olson_timezone_id = d[first][d[first].length - 1].olson_timezone_id;
                } else {
                    data.details.last_cycle_end_time = 'Not Found';
                    data.details.last_cycle_olson_timezone_id = '';
                }
                callback();
            },
            dataType: 'json',
            type: 'GET',
            contentType: 'application/json'
        });
    }

    function loadData(callback) {
        jQuery.ajax({
           url: 'ws/status-board/machines/NULL',
            success: function(d) {
                data.machineSource = d;
                callback();
            },
            dataType: 'json',
            type: 'GET',
            contentType: 'application/json'
        });
    };


    function loadMachineTemplate(callback) {
        $.ajax({
            //url: Drupal.settings.xeros_ops.modulePath + '/tpl/machine.tpl.html',
            url: Drupal.settings.xeros_ops.modulePath + '/tpl/machine-block.tpl.html',
            success: function(source) {
                tpl.machine = source;
                callback();
            },
            dataType: 'html'
        });
    }
    function loadMachineDetailTemplate() {
        $.ajax({
            url: Drupal.settings.xeros_ops.modulePath + '/tpl/machine-details.tpl.html',
            success: function(source) {
                tpl.machineDetail = source;
            },
            dataType: 'html'
        })
    };

    function renderDetail(machineId) {

        var template = Handlebars.compile(tpl.machineDetail);

        // Reinitialize the details data
        data.details = {};

        // Pass the data for the machine that was clicked
        data.details.machine = data.machineSource[machineId];

      //  console.log(data.details);

        // Load status history
        loadHistory(machineId, function(machineId) {

            loadCycles(machineId, function(d) {

                //console.log(data.details);

                data.details.labels = labels;

                var html = template(data.details);

                jQuery('.machine-detail').html(html);

                bindDetailEvents();
            })

        });


    };

    function renderStatus() {
       // console.log("Ready to render");
        data.machine.labels = labels;
        // Compile Template
        var template = Handlebars.compile(tpl.machine);


        // Render Template
        var html = template(data.machine);
        $('.machine-status').html(html);

        // Update totals in filters

        $('.controls.filter').each(function() {
            var filter = $(this).data('filter');
            var count = $('.machine__wrapper').filter('.' + filter).length;
            $(this).find('.controls__label').each(function () {
                $(this).html(count);
            });
            //console.log(filter, count);
        });

        bindEvents();

    };

    function showMachine(machineId) {

        renderDetail(machineId);

        $('.machine-detail').addClass('show');
    };

    function bindDetailEvents() {
        // Close machine details
        $('.machine-detail__close').on('click', function() {
            $(this).closest('.machine-detail').removeClass('show');
        });

        // Show the log
        $('.log__open-close').on('click', function() {
            $('.log').toggleClass('show');
            $(this).toggleClass('rotate');
        });
    };

    // Only bind once per page view
    function bindPageEvents() {
        // Toggle key display
        $('.page-ops__key').unbind().on('click', function() {
            $(this).toggleClass('show');
        });

        // Filter results
        $('.controls.filter').unbind().on('click', function() {
            var filter = $(this).data('filter');
            $(this).toggleClass('hide');

            var myfilter = [];
            $('.controls.filter.hide').each(function() {
                myfilter.push('.' + $(this).data('filter'));
            });

            //var selector = '.machine__wrapper:not(' + myfilter.toString() + ')';

            //console.log(selector);

            // Remove the hide class
            $('.machine').removeClass('hide');
            // Add the hide class back;
            $('.machine__wrapper').filter(myfilter.toString())
                .parent().addClass('hide');
        });

        // Change Display
        $('.controls.display-type').unbind().on('click', function() {
            var display = $(this).data('display-type');
            $('body')
                .removeClass(function(index, css) {
                    return (css.match (/(^|\s)display-\S+/g) || []).join(' ');
                })
                .addClass('display-' + display);
        });

        // Show Detail
        $('.controls.show-details').unbind().on('click', function() {
            $('body').toggleClass('show-details');
            $(this).toggleClass('active');
        });

        // Show Detail
        $('.controls.show-label').unbind().on('click', function() {
            $('body').toggleClass('show-label');
            $(this).toggleClass('active');
        });

        // Toggle Full Screen
        $('.controls.full-screen').unbind().on('click', function() {

            if (FF.Utils.fullscreenElement() !== null) {
                FF.Utils.exitFullscreen();
            } else {
                FF.Utils.launchFullscreen(document.documentElement);
            }

            $('body').toggleClass('full-screen');
            $(this).toggleClass('active');
        })
    }

    // Bind events on the machines
    function bindEvents() {

        els.alerts =      $('.machine');

        // Show machine details
        els.alerts.unbind().on('click', function() {
            // Rerender with new data
           showMachine($(this).data('machine-id'));
        });


    }

    function screenChangeHandler(){
        //NB the following line requrires the libary from John Dyer
        var fs = window.fullScreenApi.isFullScreen();
       // console.log("f" + (fs ? 'yes' : 'no' ));
        if (fs) {
            $('body').addClass('full-screen');
        }
        else {
            $('body').removeClass('full-screen');
            $('.controls.full-screen').removeClass('active');
        }
    }

    function updateCountdown() {

        $('.refresh-timestamp .refresh-timestamp__data').html(String(Date()));

        //$('.countdown-timer').html('');
        $('.countdown-timer').countdown('destroy');
        $('.countdown-timer').countdown({until: +refreshInterval,
            format: 'MS',
            compact: true,
            layout: 'Data refresh in {mnn}:{snn}'
        });
    }

    function refreshDisplay() {

        //  format an ISO date using Moment.js
        //  http://momentjs.com/
        //  moment syntax example: moment(Date("2011-07-18T15:50:52")).format("MMMM YYYY")
        //  usage: {{dateFormat creation_date format="MMMM YYYY"}}


        loadData(function() {
            formatData();
            renderStatus();
        });

        updateCountdown();

    }
    /**
     * Function: CC.Form.init
     *   Initializes header functionality
     *
     *   Returns:
     *     nothing
     */
    pub.init = function() {

        load = 0;
        // Reference the window object
        win = $(window);
        doc = $(document);
        body = $('body');

        //services = Drupal.settings.services;

        loadMachineDetailTemplate();

        loadMachineTemplate(function() {
            refreshDisplay();
        });


        updateCountdown();

        if ( refresh ) {
            setInterval(function () {
                refreshDisplay();
            }, refreshInterval * 1000);
        }

        bindPageEvents();

        $('html').css('padding-bottom', '0');

        $('body').addClass('display-icon');

        // Add event listener to screenchange
        document.addEventListener("fullscreenchange", screenChangeHandler, false);
        document.addEventListener("webkitfullscreenchange", screenChangeHandler, false);
        document.addEventListener("mozfullscreenchange", screenChangeHandler, false);

    }

    return pub;

})(jQuery);

var windowStatus = {};

var windowHistory = {};

jQuery(document).ready(FF.Hud.init);

