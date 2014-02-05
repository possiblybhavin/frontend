<?php
/**
 * @file
 * Returns the HTML for a node.
 *
 * Complete documentation for this file is available online.
 * @see https://drupal.org/node/1728164
 */
?>

<div id="page-2" class="main page">
    <div class="page-container">
        <div id="consumption">
            <div class="consumption-container">
                <div class="legend">
                    <span class="swatch current"></span>
                    <span class="label">Current Consumption</span>
                    <span class="swatch xeros"></span>
                    <span class="label">Potential Consumption with Xeros</span>
                </div>
                <div class="kpis__select">
        <span>
            <span>Timeframe</span>
            <select id="consumption-select" autofocus class="flagvisibility">
                <option value="1">Last 30 days</option>
                <option value="2">Previous Month</option>
                <option value="3" selected>Last 6 Months</option>
                <option value="4">Year to Date</option>
                <option value="5">Last Year</option>
                <option value="6">Custom...</option>
            </select>
        </span>
                </div>

                <div class="consumption__grid-container">
                    <div class="row first">
                        <div class="col col-1">
                            <div class="label">Machine</div>
                        </div>
                        <div class="col col-2">
                            <div class="label">Cold Water</div>
                            <div class="sub-label">(Gallons)</div>
                        </div>
                        <div class="col col-3">
                            <div class="label">Hot Water</div>
                            <div class="sub-label">(Energy/Pound)</div>
                        </div>
                        <div class="col col-4">
                            <div class="label">Total Water</div>
                            <div class="sub-label">(Energy/Pound)</div>
                        </div>
                        <div class="col col-5">
                            <div class="label">Cycle Time</div>
                            <div class="sub-label">(Minutes)</div>
                        </div>
                        <div class="col col-6">
                            <div class="label">Chemical</div>
                            <div class="sub-label">(Ounces/Pound)</div>
                        </div>
                    </div>

                    <div class="template-container">
                        <div id="spinner"></div>
                        <script id="page-tpl" type="text/x-handlebars-template">
                        {{#data}}
                        <div class="row {{meta.cssClass}}">
                            <div class="col col-1" report="total">
                                <div class="bar-chart cold"></div>
                                <div class="bar-chart total"></div>

                                <a href="#" class="consumption__machine {{machine_name}}">
                                    <div class="icon-Washer"></div>
                                    <div class="machine-label">{{machine_name}} <br/> ({{size}})</div>
                                </a>
                            </div>
                            <div class="col col-2 link" classification="cold_water" machine="{{id}}">
                                <img class="bar-chart"
                                     src="/sites/all/themes/xeros_theme/images/barchart_placeholder.png"/>

                                <div class="labels">
                                    <div class="actual">{{cold_water_value}}</div>
                                    <div class="potential">{{cold_water_xeros_value}}</div>
                                </div>
                                <div>{{cold_water_delta_value}}%<img
                                        src="/sites/all/themes/xeros_theme/images/arrow.png"/></div>
                            </div>
                            <div class="col col-3 link" classification="hot_water" machine="{{id}}">
                                <img class="bar-chart"
                                     src="/sites/all/themes/xeros_theme/images/barchart_placeholder.png"/>

                                <div class="labels">
                                    <div class="actual">{{hot_water_value}}</div>
                                    <div class="potential">{{hot_water_xeros_value}}</div>
                                </div>
                                <div>{{hot_water_delta_value}}%<img
                                        src="/sites/all/themes/xeros_theme/images/arrow.png"/></div>
                            </div>
                            <div class="col col-4 link" classification="total_water" machine="{{id}}">
                                <img class="bar-chart"
                                     src="/sites/all/themes/xeros_theme/images/barchart_placeholder.png"/>

                                <div class="labels">
                                    <div class="actual">{{total_water_value}}</div>
                                    <div class="potential">{{total_water_xeros_value}}</div>
                                </div>
                                <div>{{total_water_delta_value}}<img
                                        src="/sites/all/themes/xeros_theme/images/arrow.png"/></div>
                            </div>
                            <div class="col col-5 link" classification="cycle_time" machine="{{id}}">
                                <img src="/sites/all/themes/xeros_theme/images/piechart_placeholder.png"/>

                                <div class="labels">
                                    <div class="actual">{{time_value}}</div>
                                    <div class="potential">{{time_xeros_value}}</div>
                                </div>
                                <div>{{time_delta_value}}<img src="/sites/all/themes/xeros_theme/images/arrow.png"/>
                                </div>
                            </div>
                            <div class="col col-6 link" classification="chemical" machine="{{id}}">
                                <img class="bar-chart"
                                     src="/sites/all/themes/xeros_theme/images/barchart_placeholder.png"/>

                                <div class="labels">
                                    <div class="actual">{{chemical_value}}</div>
                                    <div class="potential">{{chemical_xeros_value}}</div>
                                </div>
                                <div>{{chemical_delta_value}}%<img
                                        src="/sites/all/themes/xeros_theme/images/arrow.png"/></div>
                            </div>
                        </div>
                        {{/data}}
                    </script>
                </div>
            </div>
        </div>
    </div>
</div>

<!--<script>-->
<!--    // Refactor to the view-->
<!--    var reports = [-->
<!--        {-->
<!--            rid: 1,-->
<!--            apiUrl: '/api/report/consumption/2013-11-10/2013-12-20.json',-->
<!--            template: "consumption",-->
<!--            callback: "consumptionCallback"-->
<!--        }-->
<!--    ];-->
<!---->

<!--    jQuery(document).ready(function () {-->
<!--        console.log("ready!");-->
<!--//-->
<!--//        // Load the templates for each report on the page-->
<!--//        for (var i = 0; i < reports.length; i++) {-->
<!--//            var r = reports[i];-->
<!--//            loadTemplate(r.template, r.apiUrl, window[r.callback])-->
<!--//        }-->
<!---->
<!--    });-->
<!--</script>-->

<script>
    var apiUrl = '/api/report/consumption/2013-11-10/2013-12-20.json';
</script>

<script src="/sites/all/themes/xeros_theme/js/spin.min.js"></script>
<script src="/sites/all/themes/xeros_theme/js/scripts.js"></script>
<script src="/sites/all/themes/xeros_theme/js/app.js"></script>
<script src="/sites/all/themes/xeros_theme/js/controls.js"></script>
<script src="/sites/all/themes/xeros_theme/js/ConsumptionView.js" ></script>