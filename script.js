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
var current_month = 7;
var current_year = 2015;

var violence_data;

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
            //violence_data = data;
            renderIncidentLocations(data);
            renderTimeline(data);
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
    console.log("yyyerrrrrrr");
    d3.selectAll("circle").remove();
    for(var point = 0; point < violence_data.length; point++)
    {
        var date = violence_data[point].date.split("-");
        if((date[0] == current_year) && (date[1] == current_month))
        {
            if(violence_data[point].longitude && violence_data[point].latitude)
            {
                svg.append("circle")
                    .attr("class", "incident_point")
                    .attr("id", violence_data[point].incident_id)
                    .attr("cx", function()
                    {
                        return projection([violence_data[point].longitude, violence_data[point].latitude])[0];
                    })
                    .attr("cy", function()
                    {
                        return projection([violence_data[point].longitude, violence_data[point].latitude])[1];
                    })
                    .attr("r", 3)
                    .style("fill", "red");
            }
        }
    }
}

function renderTimeline(data)
{
    var timeline_width = svg_width;
    var timeline_height = 100;
    var timeline_xpos = 0;
    var timeline_ypos = 0;
    var timeline_section_width = (timeline_width/(12*4));
    
    var default_color = "green";
    var hover_color = "black";
    var chosen_segment_color = "red";
    
    var timeline = svg.append("g")
        .attr("x", timeline_xpos)
        .attr("y", timeline_ypos)
        .attr('fill',"white");
    
    for(var year = 0; year < 4; year++)
    {
        for(var month = 0; month < 12; month++)
        {
            var timeline_section = timeline.append("rect")
                .attr("class", "timeline_section")
                .attr("id", function()
                {
                    return ("timeline_section_" + ($(".timeline_section").index(this)));
                })
                .attr("x", function()
                {
                    return ((timeline_section_width * year * 12) + (timeline_section_width * month));
                })
                .attr("y", 20)
                .attr("width", timeline_section_width)
                .attr("height", timeline_height)
                .attr("fill", function()
                {
                    if(((year + 2014) == current_year) && ((month + 1) == current_month))
                    {
                        return chosen_segment_color;
                    }
                    else
                    {
                        return default_color;
                    }
                })
                .on("mouseover", function()
                {
                    var year_ = Math.floor($(".timeline_section").index(this)/12);
                    var month_ = ($(".timeline_section").index(this) - (year_ * 12));
                    if(((year_ + 2014) != current_year) || ((month_ + 1) != current_month))
                    {
                        this.style.fill = hover_color;
                    }
                })
                .on("mouseout", function()
                {
                    var year_ = Math.floor($(".timeline_section").index(this)/12);
                    var month_ = ($(".timeline_section").index(this) - (year_ * 12));
                    if(((year_ + 2014) != current_year) || ((month_ + 1) != current_month))
                    {
                        this.style.fill = default_color;
                    }
                })
                .on("click", function()
                {
                    var year_ = Math.floor($(".timeline_section").index(this)/12);
                    var month_ = ($(".timeline_section").index(this) - (year_ * 12));
                    var nn = ((current_year- 2014) * 12) + (current_month - 1);
                    d3.select(("#timeline_section_" + nn)).style("fill", default_color);
                    if(((year_ + 2014) != current_year) || ((month_ + 1) != current_month))
                    {
                        current_year = (2014 + year_);
                        current_month = (month_ + 1);
                        this.style.fill = chosen_segment_color;
                    }
                    renderIncidentLocations(data);
                });
        }
    }
}