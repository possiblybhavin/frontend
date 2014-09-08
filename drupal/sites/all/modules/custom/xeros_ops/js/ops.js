/**
 * Namespace: FF
 *   Setup namespace if it has not already been setup.
 */
var FF = FF || {};

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

    var machineIds = [6,7];

    // Turn refresh on
    var refresh = false;


    formatStatus = function(data) {
        var _status = {};
        for (i=0; i < data.length; i++) {
            var _machineStatus = data[i];
            var _machineId = _machineStatus.machineId;
            delete _machineStatus.machineId;
            _status[_machineId] = _machineStatus;
        };
        return _status;
    }

    formatHistory = function(data) {
        var _status = {};
        for (i=0; i < data.length; i++) {
            var _machineStatus = data[i];
            var _machineId = _machineStatus.machineId;
            var _statusId = _machineStatus.id;

            delete _machineStatus.machineId;
            delete _machineStatus.id;

            if ( typeof _status[_machineId] === 'undefined' ) {
                _status[_machineId] = {} ;
            } else {
                _status[_machineId][_statusId] = _machineStatus;
            }

        };
        return _status;
    }

    loadStatus = function(callback) {
        jQuery.ajax({
            url: services.status,
            data: '[' + machineIds.toString() + ']',
            success: function(d) {
                status = formatStatus(d);
            },
            dataType: 'json',
            type: 'POST',
            contentType: 'application/json'
        });
    };
//
    loadHistory = function(machineId, callback) {
        jQuery.ajax({
            url: services.history,
            data: '[' + machineId.toString() + ']',
            success: function(d) {
                history = formatHistory(d);
                callback(d, machineId);
            },
            dataType: 'json',
            type: 'POST',
            contentType: 'application/json'
        });
    };

    loadData = function() {
        // Grab the global data object and create a local copy so we can
        // refactor easily later;
        data.machineSource = {}; //xerosMachines;

        data.machine = {
            'companies' : {}
        };

        var j = 0;
        var alert = 0;

        for (i = 0; i < xerosMachines.length; i++) {
            //console.log(data.machineSource[i]);
            var m = xerosMachines[i];

            data.machineSource[m.machine_id] = m;

            if ( typeof data.machine.companies[m.company_title] == 'undefined') {
                data.machine.companies[m.company_title] = {
                    'locations' : {},
                    'company_title' : m.company_title
                };
            }
            if ( typeof data.machine.companies[m.company_title].locations[m.location_title] == 'undefined') {
                data.machine.companies[m.company_title].locations[m.location_title] = {
                    'machines' : {},
                    'location_title' : m.location_title,
                };
            }

            if (m.manufacturer == 'Xeros' ) {
                m.modelFilter = 'xeros';
            } else {
                m.modelFilter = 'non-xeros';
            }

            m.cycles = Math.floor(Math.random() * 6) + 0;
            if (m.cycles == 0) {
                m.runTime = '0:00';
            } else {
                m.runTime = String(Math.floor(Math.random() * 3) + 1) + ':' + ('0'+ String(Math.floor(Math.random() * 59) + 1)).slice(-2);
            }

            if (m.cycles == 0 ) {
                m.status = 'red';
                if (alert < 4) {
                    m.status += ' alert';
                }
                alert++;
            } else if (m.cycles <= 2) {
                m.status = 'yellow';
            } else {
                m.status = 'green';
            }

            j++;
            data.machine.companies[m.company_title].locations[m.location_title].machines[m.machine_id] = m;


        }
        console.log (data.machine);
    };


    loadMachineTemplate = function(callback) {
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
    loadMachineDetailTemplate = function(callback) {
        $.ajax({
            url: Drupal.settings.xeros_ops.modulePath + '/tpl/machine-details.tpl.html',
            success: function(source) {
                tpl.machineDetail = source;
                callback();
            },
            dataType: 'html'
        })
    };

    renderDetail = function(machineId) {

        var template = Handlebars.compile(tpl.machineDetail);

        var _foo = data.machineSource[machineId];

//        var _d = { history: d, machine: data.machineSource[machineId]};
//
        var machineDetailData = loadHistory(machineId, function(d) {

            _boo = { history: d, machine: foo};

            var html = template();

            jQuery('.machine-detail').html(html);

            bindDetailEvents();
        });


    };

    renderStatus = function() {
        console.log("Ready to render");

        // Compile Template
        var template = Handlebars.compile(tpl.machine);

        // Render Template
        var html = template(data.machine);

        jQuery('.machine-status').html(html);

        bindEvents();

    };

    showMachine = function(machineId) {

        renderDetail(machineId);

        $('.machine-detail').addClass('show');
    };

    bindDetailEvents = function() {
        // Close machine details
        $('.machine-detail__close').on('click', function() {
            $(this).closest('.machine-detail').removeClass('show');
        });
    };

    bindEvents = function() {

        els.alerts =      $('.machine');

        // Show machine details
        els.alerts.on('click', function() {
            // Rerender with new data
           showMachine($(this).data('machine-id'));
        });



        // Toggle key display
        $('.page-ops__key').on('click', function() {
            $(this).toggleClass('show');
        });

        // Filter results
        $('.controls.filter').on('click', function() {
            var filter = $(this).data('filter');
            $(this).toggleClass('hide');
            $('.machine__wrapper.' + filter).parent().toggleClass('hide');
        });

        // Change Display
        $('.controls.display-type').on('click', function() {
            var display = $(this).data('display-type');
            $('body')
                .removeClass(function(index, css) {
                    return (css.match (/(^|\s)display-\S+/g) || []).join(' ');
                })
                .addClass('display-' + display);
        });

        // Show Detail
        $('.controls.show-details').on('click', function() {
            $('body').toggleClass('show-details');
            $(this).toggleClass('active');
        });

        // Show Detail
        $('.controls.show-label').on('click', function() {
            $('body').toggleClass('show-label');
            $(this).toggleClass('active');
        });

        // Toggle Full Screen
        $('.controls.full-screen').on('click', function() {

            if (FF.Utils.fullscreenElement() !== null) {
                FF.Utils.exitFullscreen();
            } else {
                FF.Utils.launchFullscreen(document.documentElement);
            }

            $('body').toggleClass('full-screen');
            $(this).toggleClass('active');
        })
    }

    function updateCountdown() {

        $('.refresh-timestamp .refresh-timestamp__data').html(String(Date()));

        //$('.countdown-timer').html('');
        $('.countdown-timer').countdown('destroy');
        $('.countdown-timer').countdown({until: +10,
            format: 'S',
            compact: true,
            layout: 'Data refresh in {snn} {desc}',
            description: 'seconds'
        });
    }

    function refreshDisplay() {

        loadStatus(function() {});

        loadHistory(function() {});

        loadData();

        // Load the templates
        loadMachineTemplate(renderStatus);

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

        services = Drupal.settings.services;

        updateCountdown();

        loadMachineDetailTemplate(function() {});

        refreshDisplay();

        if ( refresh ) {
            setInterval(function () {
                refreshDisplay();
            }, 10000);
        }

        $('html').css('padding-bottom', '0');

        console.log(els.data);

        $('body').addClass('display-icon');

    }

    return pub;

})(jQuery);

var windowStatus = {};

var windowHistory = {};

jQuery(document).ready(FF.Hud.init);

