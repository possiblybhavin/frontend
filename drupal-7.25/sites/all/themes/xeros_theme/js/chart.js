////// Constants
//var KPI_COST = "KPI_COST",
//    KPI_COLD = "KPI_COLD",
//    KPI_HOT = "KPI_HOT",
//    KPI_TIME = "KPI_TIME",
//    KPI_CHEMICAL = "KPI_CHEMICAL";


//// Defined Chart types
//var CHART_KPI = "CHART_KPI",
//    CHART_BAR_H = "CHART_BAR_H",
//    CHART_DONUT = "CHART_DONUT";


//// --------------- Helper Functions ----------- //
//function getData(kpiType) {
//
//    var data = dummyData();
//    switch (kpiType) {
//        case KPI_COST:
//            data = data.slice(0,30);
//            break;
//        case KPI_COLD:
//            data = data.slice(30,60);
//            break;
//        case KPI_HOT:
//            data = data.slice(0,180);
//            break;
//        case KPI_TIME:
//            data = data.slice(180);
//            break;
//        case KPI_CHEMICAL:
//            data = data;
//            break;
//
//    }




//}

//function dummyData() {
//
////    converts date string to date object
//    var parseDate = d3.time.format("%x").parse;
//    var data = [];
//
//    var len = Math.min(dataA.length, dataB.length);
//    for (var i = 0; i < len; i++) {
//        var row = [];
//        row[0] = parseDate(dataA[i]["date"]);
//        row[1] = dataA[i]["value"];
//        row[2] = dataB[i]["value"];
//
//        data.push(row);
//        console.log(row);
//    }
//    return data;
//}

// ------------ charts ---------------- //

var kpiChart = function(data) {

    var name = data["name"];



    var data = data["chartData"];

//    sets up the page
    var margin = {top: 1, right: 10, bottom: 16, left: 26},
        width = 316 - margin.left - margin.right,
        height = 130 - margin.top - margin.bottom;

//    var chartMargins = [4, 50, 18, 16];
//    var axisMargins = [4, 20, 0, 0];

//    // sets up the page
//    var width = 292,
//        height = 130;

////    converts date string to date object
//    var parseDate = d3.time.format("%x").parse;

//    translate the actual x data into the pixel space of the DOM
    var x = d3.time.scale()
        .range([0, width]);

// translate the actual y data into the pixel space of the DOM
    var y = d3.scale.linear()
        .range([height, 0]);

// setup the x-axis notation
    var xAxis = d3.svg.axis()
        .scale(x)
        .ticks(d3.time.months, 2)
        .tickFormat(d3.time.format("%b"))
        .tickSize(0)
        .orient("bottom");


//    .ticks(d3.time.days, 1)

        // use this based on chart date range
//    .tickFormat(d3.time.format('%a %d'))

// setup the y-axis notation
    var yAxis = d3.svg.axis()
        .scale(y)
        .tickSize(-width)
        .ticks(8)
        .orient("left");

// create the individual points for the line
    var lineA = d3.svg.line()
        .x(function (d) {
            x(d["date"]);
            return x(d["date"]);// date
        })
        .y(function (d) {
            return y(d["value"]); // value 1
        });

    var lineB = d3.svg.line()
        .x(function (d) {
            return x(d["date"]);// date
        })
        .y(function (d) {
            return y(d["value_xeros"]); // value 1
        });

// adds SVG element to DOM, positioning properly
    var svg = d3.selectAll(".kpis .kpi-chart ." + name).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// find the extent (min / max) of the values
    x.domain(d3.extent(data, function (d) {
        return d[0]; // date
    }));
//    y.domain(d3.extent(data, function (d) {
//        return d[1]; // value 1
//    }));
//    y.domain([0,800]);
    var extentA = d3.extent(data, function (d) {
        return d[1]; // value 1
    });
    var extentB = d3.extent(data, function (d) {
        return d[2]; // value 2
    });
    y.domain([d3.min([extentA[0], extentB[0]]), d3.max([extentA[1], extentB[1]])]);

// append the notation for x-axis to the DOM and position
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

// append the notation for y-axis to the DOM and position
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
//        .append("text")
//        .attr("transform", "rotate(-90)")
//        .attr("y", 6)
//        .attr("dy", ".71em")
//        .style("text-anchor", "end")
//        .text("Price ($)");

// append the line itself
    svg.append("path")
        .datum(data)
        .attr("class", "line-a")
        .attr("d", lineA);

    svg.append("path")
        .datum(data)
        .attr("class", "line-b")
        .attr("d", lineB);

};


var barChart = function(data) {

//    var data = [1, 0.5];
    var colors = ["black", "blue"];

    var margin = {top: 0, right: 0, bottom: 0, left: 0},
        width = 50 - margin.left - margin.right,
        height = 50 - margin.top - margin.bottom;


    var x = d3.scale.ordinal()
        .domain([0, 1])
        .range([0, width / data.length]);

    var y = d3.scale.linear()
        .domain([0, d3.max(data)])
        .range([height, 0]);


//Create SVG element
    // TODO
    var svg = d3.select("body .bar-chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d, i) { return x(i); })
        .attr("width", width / data.length)
        .attr("y", function(d) { return y(d); })
        .attr("height", function(d) { return height - y(d); })
        .attr("fill", function(d, i) { return colors[i]; });

}

var donutChart = function(data) {
    // data range 0 - 60 minutes

    var total = 60; //diameter
    var outer = 10;
    var inner = 15;
    var donutWidth = 5;

    var dataOuter = [outer, total - outer];
    var dataInner = [inner, total - inner];

    var margin = {top: 0, right: 0, bottom: 0, left: 0},
        width = 50 - margin.left - margin.right,
        height = 50 - margin.top - margin.bottom,
        radius = Math.min(width, height) / 2;


    var colorOuter = d3.scale.ordinal()
        .range(["#0000FF", "#FFFFFF"]);

    var colorInner = d3.scale.ordinal()
        .range(["#666", "#AAA"]);

    var outerArc = d3.svg.arc()
        .outerRadius(radius)
        .innerRadius(radius - donutWidth);

    var innerArc = d3.svg.arc()
        .outerRadius(radius - donutWidth)
        .innerRadius(radius - 2 * donutWidth);

    var pie = d3.layout.pie()
        .sort(null)
        .value(function(d,i) { return d; });

    var svg = d3.select("body .donut-chart").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width/2 + "," + height/2 + ")");

    var g = svg.selectAll(".arc")
        .data(pie(dataOuter))
        .enter().append("g")
        .attr("class", "arc");

    g.append("path")
        .attr("d", outerArc)
        .style("fill", function(d,i) { return colorOuter(i); });

    g.data(pie(dataInner))
        .append("path")
        .attr("d", innerArc)
        .style("fill", function(d,i) { return colorInner(i); });
};
