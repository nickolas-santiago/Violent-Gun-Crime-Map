"use script";
var svg;
var svg_width = 700;
var svg_height = 600;
var projection = d3.geoAlbersUsa()
    .translate([(svg_width/2), (svg_height/2)]) //---translate to center of svg
    .scale([800]); //---scale things down so see entire US
var path = d3.geoPath() // path generator that will convert GeoJSON to SVG paths
    .projection(projection); // tell path generator to use albersUsa projection

var chosen_state = "";
var first_year = 2014;
var last_year = 2017;
var current_month = 11;
var current_year = 2015;
var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec" ]

$(document).ready(function()
{
    console.log("yerrr world");
    d3.json("us-states.json").then(function(json)
    {
        svg = d3.select("body")
            .append("svg")
            .attr("width", svg_width)
            .attr("height", svg_height);
        renderMap(json);
        d3.csv("gun-violence-data_01-2013_03-2018.csv").then(function(data)
        {
            var timeline_data_set = [];
            for(var incident = 0; incident < data.length; incident++)
            {
                var date_ = data[incident].date.split("-");
                if((date_[0] >= first_year) && (date_[0] <= last_year))
                {
                    if(data[incident].latitude && data[incident].longitude)
                    {
                        projection_ = (projection([data[incident].longitude, data[incident].latitude]) == null);
                        if(projection_ == false)
                        {
                            var timeline_data_set_index = (12 * (date_[0] - first_year)) + (date_[1] - 1);
                            if(timeline_data_set[timeline_data_set_index])
                            {
                                timeline_data_set[timeline_data_set_index].total_incidents++;
                                if(data[incident].n_killed > 0)
                                {
                                    if(timeline_data_set[timeline_data_set_index].total_killed)
                                    {
                                        timeline_data_set[timeline_data_set_index].total_killed += Number(data[incident].n_killed);
                                    }
                                    else
                                    {
                                        timeline_data_set[timeline_data_set_index].total_killed = Number(data[incident].n_killed);
                                    }
                                }
                                if(data[incident].n_injured > 0)
                                {
                                    if(timeline_data_set[timeline_data_set_index].total_injured)
                                    {
                                        timeline_data_set[timeline_data_set_index].total_injured += Number(data[incident].n_injured);
                                    }
                                    else
                                    {
                                        timeline_data_set[timeline_data_set_index].total_injured = Number(data[incident].n_injured);
                                    }
                                }
                            }
                            else
                            {
                                var timeline_data_set_point = {};
                                timeline_data_set_point.total_incidents = 1;
                                if(data[incident].n_killed > 0)
                                {
                                    timeline_data_set_point.total_killed = Number(data[incident].n_killed);
                                }
                                if(data[incident].n_injured > 0)
                                {
                                    timeline_data_set_point.total_injured = Number(data[incident].n_injured);
                                }
                                timeline_data_set.push(timeline_data_set_point);
                            }
                        }
                        
                    }
                }
            }
            renderTimeline(timeline_data_set, data);
            renderIncidentLocations(data);
        });
    });
});

function renderMap(json)
{
    var default_color = "#fff";
    var hover_color = "#A8D156";
    var chosen_state_color = "#6C9619";
    
    svg.selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "state")
        .attr("id", function(d)
        {
            var id = d.properties.name.split(" ").join("");
            return id;
        })
        .style("stroke", "#000")
        .style("stroke-width", 1.5)
        .style("fill", default_color)
        .on("mouseover", function()
        {
            if(chosen_state != this.id)
            {
                this.style.fill = hover_color;
            }
        })
        .on("mouseout", function()
        {
            if(chosen_state != this.id)
            {
                this.style.fill = default_color;
            }
        })
        .on("click", function(d,i)
        {
            //---when clicking a state, basically you have two options:
            //   (1) the state you've clicked == the already chosen state
            //   (2) the state you've clciekd != the already chosen state
            if(chosen_state == this.id)
            {
                chosen_state = "";
                this.style.fill = hover_color;
            }
            else
            {
                var prior_state = chosen_state;
                chosen_state = this.id;
                this.style.fill = chosen_state_color;
                if(prior_state != "")
                {
                    d3.select("#" + prior_state).style("fill", default_color);
                }
            }
        });
}

function renderIncidentLocations(violence_data)
{
    var data = violence_data.filter(function(n)
    {
        var date_ = n.date.split("-");
        var projection_;
        if(n.latitude && n.longitude)
        {
            projection_ = (projection([n.longitude, n.latitude]) == null);
        }
        return ((date_[0] == current_year) && (date_[1] == current_month) && (projection_ == false));
    
    });
    d3.selectAll("circle").remove();
    var circle = svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "incident_point")
        .attr("id", function(d)
        {
            return d.incident_id;
        })
        .attr("cx", function(d)
        {
            return projection([d.longitude, d.latitude])[0];
        })
        .attr("cy", function(d)
        {
            return projection([d.longitude, d.latitude])[1];
        })
        .attr("r", 3)
        .style("fill", "red");
}

function renderTimeline(time_data, violence_data)
{
    var timeline_width = 650;
    var timeline_height = 100;
    var timeline_xpos = 0;
    var timeline_ypos = 0;
    var timeline_section_width = (timeline_width/(12*4));
    var padding = 35;
    
    var default_color_a = "#fff";
    var default_color_b = "#efefef";
    var hover_color = "#c1c1c1";
    var chosen_segment_color = "#aaaaaa";

    var time_data_range = [];
    time_data_range.push(d3.min(time_data, function(n)
    {
        return n.total_incidents;
    }),
    d3.max(time_data, function(n)
    {
        return n.total_incidents;
    }),
    d3.min(time_data, function(n)
    {
        return n.total_killed;
    }),
    d3.max(time_data, function(n)
    {
        return n.total_killed;
    }),
    d3.min(time_data, function(n)
    {
        return n.total_injured;
    }),
    d3.max(time_data, function(n)
    {
        return n.total_injured;
    }));
    var min_time_data_range = d3.min(time_data_range, function(n)
    {
        return n;
    });
    var max_time_data_range = d3.max(time_data_range, function(n)
    {
        return n;
    });
    
    var yscale = d3.scaleLinear()
        .domain([0, max_time_data_range])
        .range([100, 0]);
    var yaxis = d3.axisLeft(yscale).ticks(4);
    var xscale = d3.scaleLinear()
        .domain([0, (time_data.length - 1)])
        .range([0, timeline_width]);
    var xaxis = d3.axisBottom(xscale)
        .ticks(16)
        .tickFormat(function(d)
        {
            var month_ = Math.floor(d%12);
            return monthNames[month_];
        });
    
    var timeline = svg.append("g")
        .attr("x", timeline_xpos)
        .attr("y", timeline_ypos);
    timeline.append("g")
        .attr("id","x-axis")
        .attr("transform","translate(" + (padding + (timeline_section_width/2)) + "," + (20 +timeline_height)  +")")
        .call(xaxis);
    timeline.append("g")
        .attr("id","y-axis")
        .attr("transform","translate(" + padding + "," + (20)  +")")
        .call(yaxis);
    var timeline_section = timeline.selectAll("rect")
        .data(time_data)
        .enter()
        .append("rect")
        .attr("class", "timeline_section")
        .attr("id", function()
        {
            return ("timeline_section_" + ($(".timeline_section").index(this)));
        })
        .attr("x", function(d, i)
        {
            return (padding + xscale(i));
        })
        .attr("y", 20)
        .attr("width", timeline_section_width)
        .attr("height", timeline_height)
        .attr("fill", function(d, i)
        {
            if(((Math.floor(i/12) + first_year) == current_year) && ((Math.floor(i%12) + 1) == current_month))
            {
                return chosen_segment_color;
            }
            else
            {
                if((Math.floor(i/12)%2) == 0)
                {
                    return default_color_a;
                }
                else
                {
                    return default_color_b;
                }
            }
        })
        .on("mouseover", function(d, i)
        {
            if(((Math.floor(i/12) + first_year) != current_year) || ((Math.floor(i%12) + 1) != current_month))
            {
                this.style.fill = hover_color;
            }
        })
        .on("mouseout", function(d, i)
        {
            if(((Math.floor(i/12) + first_year) != current_year) || ((Math.floor(i%12) + 1) != current_month))
            {
                if((Math.floor(i/12)%2) == 0)
                {
                    this.style.fill = default_color_a;
                }
                else
                {
                    this.style.fill = default_color_b;
                }
            }
        })
        .on("click", function(d, i)
        {
            var old_current_date = ((current_year - first_year) * 12) + (current_month - 1);
            if(current_year%2 == 0)
            {
                d3.select(("#timeline_section_" + old_current_date)).style("fill", default_color_a);
            }
            else
            {
                d3.select(("#timeline_section_" + old_current_date)).style("fill", default_color_b);
            }
            if(((Math.floor(i/12) + first_year) != current_year) || ((Math.floor(i%12) + 1) != current_month))
            {
                current_year = (first_year + Math.floor(i/12));
                current_month = (Math.floor(i%12) + 1);
                this.style.fill = chosen_segment_color;
            }
            renderIncidentLocations(violence_data);
        });
    renderLineFuction("total_incidents", "black", 1.5, timeline, time_data, xscale, yscale, padding, timeline_section_width);
    renderLineFuction("total_killed", "#ff0000", 1, timeline, time_data, xscale, yscale, padding, timeline_section_width);
    renderLineFuction("total_injured", "#ffa500", 1, timeline, time_data, xscale, yscale, padding, timeline_section_width);
}
function renderLineFuction(line_data, line_color, line_width, timeline, time_data, xscale, yscale, padding, timeline_section_width)
{
    var line = d3.line()
        .x(function(d, i)
        {
            return xscale(i);
        })
        .y(function(d,i)
        {
            return yscale(d[line_data]);
        });
    timeline.append("path")
        .datum(time_data)
        .attr("class", "line")
        .attr("d", line)
        .attr("transform","translate(" + (padding + (timeline_section_width/2)) + "," + (20)  +")")
        .style("fill","none")
        .style("stroke", line_color)
        .style("stroke-width", line_width);
}