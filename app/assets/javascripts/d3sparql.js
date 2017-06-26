//
// d3sparql.js - utilities for visualizing SPARQL results with the D3 library
//
//   Web site: http://github.com/ktym/d3sparql/
//   Copyright: 2013-2015 (C) Toshiaki Katayama (ktym@dbcls.jp)
//   License: BSD license (same as D3.js)
//   Initial version: 2013-01-28
//

var edge_data = [];
var edge_head = [];
var edge_flag = [];
var node_flag = [];
var vertex_flag = [];
var edge_path = [];
var num_edge = 0;
var num_node = 0;

var d3sparql = {
  version: "d3sparql.js version 2015-11-19",
  debug: true  // set to true for showing debug information
}

var d3sparql_started = false;
var force = d3.layout.force()

var searcher = new CompoundSearch("https://beta.openphacts.org/2.1", "161aeb7d", "cffc292726627ffc50ece1dccd15aeaf");

var num_property = 5;

var prev_focus_id=-1;

var property_per_color = [
							{'type':'Protein','color':'#17BECF'},
							{'type':'GeneProduct','color':'#FFBB78'},
							{'type':'Metabolite','color':'#9EDAE5'},
							{'type':'Rna','color':'#CEF2E0'},
              {'type':'Group','color':'#999999'}
						];
var cnt_per_property = [];
var status_property=[];
var info_by_type = [];
var svg_force_width,svg_force_height;
var group_start_id;

function circle_foucs(i)
{
  if(i>=group_start_id) return;
	d3.select(".circle" + i)
            .transition()
            .attr("r", "40") 
            .attr("fill", "#FF7F0E");//"#CEDFFf"	
	d3.select(".marker"+i)
	  .transition()
	  .attr("refX",25);			
}

function circle_foucsover(d,i)
{
  if(i>=group_start_id) return;
	d3.select(".circle" + i) 
		.transition()
		.attr("r","24") 
		.attr("fill", circleColor(d));	
	d3.select(".marker"+i)
	  .transition()
	  .attr("refX",18);		
}


function trim(str)
{
	var result = "";
	var i=0,j=0;
	if(str == null) return "";
	return str;
}

d3sparql.query = function(endpoint, sparql, callback) {
  sparql_node = "select distinct str(?graphid) as ?key concat('http://identifiers.org/',str(?db),'/',str(?dbid)) as ?uri str(?name) as ?name str(?type) as ?type concat('Description: ',str(?description)) as ?description str(?pathwayname) as ?pathwayname where{    ?pathway a wp:Pathway .       ?pathway dc:identifier  <http://identifiers.org/wikipathways/"+ sparql + "> .      ?pathway dc:title ?pathwayname  .  ?pathway wp:isAbout ?gpmlpathway .    ?node a gpml:DataNode .    ?node dcterms:isPartOf ?gpmlpathway .     ?node gpml:graphId ?graphid    OPTIONAL{        ?node gpml:xrefDataSource ?db .        ?node gpml:xrefId ?dbid .    }    ?node gpml:textlabel ?name .    ?node gpml:type ?type .  OPTIONAL {?pathway dcterms:description ?description .}    }";
  sparql_group = "select distinct str(?graphid) as ?graphid str(?nodeid) as ?nodeid where{    ?pathway a wp:Pathway .    ?pathway dc:identifier  <http://identifiers.org/wikipathways/"+ sparql + "> .  ?pathway wp:isAbout ?gpmlpathway .    ?group a gpml:Group .    FILTER regex(?group,?gpmlpathway,'i')    ?group gpml:groupId ?groupid .    ?group gpml:graphId ?graphid .    ?node a gpml:DataNode .    ?node dcterms:isPartOf ?gpmlpathway .       ?node gpml:groupRef ?ref .    FILTER regex(?groupid,?ref,'i')        ?node gpml:graphId ?nodeid .    } order by ?graphid";
  sparql_link = "select distinct str(?interactionid) as ?edge str(?ref) as ?ref str(?anchorid) as ?anchorid where{    ?pathway a wp:Pathway .       ?pathway dc:identifier  <http://identifiers.org/wikipathways/"+ sparql + "> .    ?pathway wp:isAbout ?gpmlpathway .    ?interaction a gpml:Interaction .    ?interaction gpml:graphId ?interactionid .    FILTER regex(?interaction,?gpmlpathway,'i')    ?interaction gpml:hasPoint ?point .    ?point gpml:graphRef ?ref .    OPTIONAL{        ?interaction gpml:hasAnchor ?anchor .        ?anchor a gpml:Anchor .         ?anchor gpml:graphId ?anchorid .      }} order by ?edge";

  var json_node,json_group,json_link;
  var url = endpoint + "?query=" + encodeURIComponent(sparql_node)
  if (d3sparql.debug) { console.log(endpoint) }
  if (d3sparql.debug) { console.log(url) }  
  var mime = "application/sparql-results+json"
  d3.xhr(url, mime, function(request) {
    json_node = request.responseText
    if (d3sparql.debug) { console.log(json_node) }
   // callback(JSON.parse(json))
    url = endpoint + "?query=" + encodeURIComponent(sparql_group)
        if (d3sparql.debug) { console.log(endpoint) }
        if (d3sparql.debug) { console.log(url) }  
        var mime = "application/sparql-results+json"
        d3.xhr(url, mime, function(request) {
          json_group = request.responseText
          if (d3sparql.debug) { console.log(json_group) }

         // callback(JSON.parse(json))
          url = endpoint + "?query=" + encodeURIComponent(sparql_link)
            if (d3sparql.debug) { console.log(endpoint) }
            if (d3sparql.debug) { console.log(url) }  
            var mime = "application/sparql-results+json"
            d3.xhr(url, mime, function(request) {
              json_link = request.responseText
              if (d3sparql.debug) { console.log(json_link) }
              callback(JSON.parse(json_node),JSON.parse(json_group),JSON.parse(json_link))
            })        
        })  
  })           
}

d3sparql.querybytext = function(endpoint, sparql, callback) {
  var url = endpoint + "?query=" + encodeURIComponent(sparql) + "&format=json"
  if (d3sparql.debug) { console.log(endpoint) }
  if (d3sparql.debug) { console.log(url) }
  var mime = "application/sparql-results+json"
  d3.xhr(url, mime, function(request) {
    var json = request.responseText
    if (d3sparql.debug) { console.log(json) }
    json = JSON.parse(json);
    var tbody_str = "";
    for(var i=0;i<json.result.length;i++)
    {
        tbody_str = tbody_str + "<tr class='record-deco'><td>" + json.result[i].id + "</td></tr>";
    }
    $("tbody").append(tbody_str);
  })
}


/*
  Convert sparql-results+json object into a JSON graph in the {"nodes": [], "links": []} form.
  Suitable for d3.layout.force(), d3.layout.sankey() etc.

  Options:
    config = {
      "key1":   "node1",       // SPARQL variable name for node1 (optional; default is the 1st variable)
      "key2":   "node2",       // SPARQL variable name for node2 (optional; default is the 2nd varibale)
      "label1": "node1label",  // SPARQL variable name for the label of node1 (optional; default is the 3rd variable)
      "label2": "node2label",  // SPARQL variable name for the label of node2 (optional; default is the 4th variable)
      "value1": "node1value",  // SPARQL variable name for the value of node1 (optional; default is the 5th variable)
      "value2": "node2value"   // SPARQL variable name for the value of node2 (optional; default is the 6th variable)
    }

  Synopsis:
    d3sparql.query(endpoint, sparql, render)

    function render(json) {
      var config = { ... }
      d3sparql.forcegraph(json, config)
      d3sparql.sankey(json, config)
    }

  TODO:
    Should follow the convention in the miserables.json https://gist.github.com/mbostock/4062045 to contain group for nodes and value for edges.
*/
var check = d3.map();

d3sparql.graph = function(json_node,json_group,json_link, config) {
  config = config || {}
  check = d3.map();
//--------------------------------------json_node---------------------------------
  var head = json_node.head.vars
  var data = json_node.results.bindings

  for(var index_property=0;index_property < num_property;index_property++)
	  cnt_per_property[index_property] = 0;
  
  var opts_node = {
    "key":   config.key   || head[0] || "key",
    "uri":   config.uri   || head[1] || "uri",
    "name": config.name || head[2] || "name",
    "type": config.type || head[3] || "type",
    "description" : config.description  || head[4] || "description",
    "pathwayname" : config.pathwayname  || head[5] || "pathwayname"
  }
  var graph = {
    "nodes": [],
    "links": []
  }
  var index = 1
  var pathway_name="No Information!";
  var pathway_description="No Information!";
  for(var i = 0;i < data.length; i++){
    var key = data[i][opts_node.key].value;
    var uri = data[i][opts_node.uri].value;
    var name = data[i][opts_node.name].value;
    var type = data[i][opts_node.type].value;
    if(opts_node.description)
      var description = data[i][opts_node.description].value;
    var pathwayname = data[i][opts_node.pathwayname].value;
    if(trim(pathwayname) != "")
      pathway_name = trim(pathwayname);
    if(trim(description) != "")
      pathway_description = trim(description);  
    graph.nodes.push({"key": key, "uri": uri, "name":name, "description": description, "type": type,"index":index})//"value": value1,
    for(var index_property=0;index_property < num_property;index_property++)
    {
      if(property_per_color[index_property].type == type)
      {
        cnt_per_property[index_property]++;
        break;
      }
    }     
  }

//----------------------------------json_group---------------------------
  head = json_group.head.vars
  data = json_group.results.bindings
  
  var opts_group = {
    "key":   config.graphid   || head[0] || "graphid",
    "nodeid":   config.nodeid   || head[1] || "nodeid"
  }

  var prekey = "";
  var children = [];
  var key;
  for(var i = 0;i < data.length; i++){
    key = data[i][opts_group.key].value;
    var nodeid = 0;
    for(nodeid = 0 ; nodeid < graph.nodes.length;nodeid++)
      if(graph.nodes[nodeid].key == data[i][opts_group.nodeid].value)
        break;
   
    var node_item = graph.nodes[nodeid];
    graph.nodes.splice(nodeid,1);
    if(key == prekey || prekey == "")
      children.push(node_item);
    else
    {
      graph.nodes.push({"key": prekey, "uri": "group", "name":"Group", "description": "description", "type": "Group","index":index,"children":children})//"value": value1,
      children = [];
      children.push(node_item);      
    }
    prekey = key;
  }
  graph.nodes.push({"key": key, "uri": "group", "name":"Group", "description": "description", "type": "Group","index":index,"children":children})//"value": value1,


//---------------------------json_link---------------------------------------------------  

  var match = d3.map();
  head = json_link.head.vars
  data = json_link.results.bindings  
  var opts_link = {
  "edge":   config.edge   || head[0] || "edge",
  "ref":   config.ref   || head[1] || "ref",
  "anchorid":   config.anchorid  || head[2] || "anchorid"  
  }
  edge_id = 0;

  for(var i = 0;i < data.length; i++){
    var edge = data[i][opts_link.edge].value;
    var ref = data[i][opts_link.ref].value; 
    var anchorid;
    if(data[i][opts_link.anchorid] != undefined)
      anchorid = data[i][opts_link.anchorid].value;
    if(anchorid != undefined && !check.has(anchorid))
    {
      graph.nodes.push({"key": anchorid, "uri": "anchor", "name":"anchor", "description": "description", "type": "Anchor","index":index})//"value": value1,
      check.set(anchorid,5);
      for(var index_property=0;index_property < num_property;index_property++)
      {
        if(property_per_color[index_property].type == type)
        {
          cnt_per_property[index_property]++;
          break;
        }
      }     
    }
  }  

  for(var i = 0;i < graph.nodes.length; i++){
    graph.nodes[i].index = index;
    check.set(graph.nodes[i].key,index);
    info_by_type[index++] = {"key":key,"data":{"type":graph.nodes[i].type},"name":graph.nodes[i].name}; 
  }

  group_start_id = index;

  for(var i = 0;i < graph.nodes.length; i++){
    if(graph.nodes[i].children !== undefined)
    {
      for(var j=0;j < graph.nodes[i].children.length; j++)
      {
        graph.nodes[i].children[j].index = index;
        check.set(graph.nodes[i].children[j].key,index);
        info_by_type[index++] = {"key":key,"data":{"type":graph.nodes[i].children[j].type},"name":graph.nodes[i].children[j].name}; 
      }
    }
  }


  console.log(graph.nodes);

  for(var i = 0;i < data.length; i++){
    var edge = data[i][opts_link.edge].value;
    var ref = data[i][opts_link.ref].value; 
    var anchorid = undefined;
    if(data[i][opts_link.anchorid] != undefined)
      anchorid = data[i][opts_link.anchorid].value;
    if(!match.has(edge)) 
    {
      match.set(edge,ref);
      if(anchorid != undefined)
      {
        if(check.has(ref))
          graph.links.push({"source": check.get(ref), "target": check.get(anchorid)});
        match.set(edge,anchorid);
      }
    }
    else
    {
      if(check.has(match.get(edge)) && check.has(ref))
        graph.links.push({"source": check.get(match.get(edge)), "target": check.get(ref)});
    }
  }  

  console.log(graph.links)
  $("#pathway_description").html(pathway_description);
  $("#pathway_name").html(pathway_name);
  $("#pathway_description").attr("class","alert alert-success");
  $("#pathway_name").attr("class","alert alert-success");
  $("#div_main").attr("style","border-left-width:1px;border-left-style:dashed;margin-top:50px;");
  $("#filter_result").attr("style","height:200px;overflow-y:scroll;border-width:1px;border-style:solid;margin-bottom:0px;");
  
  var legend_str = "";
  for(var i=0;i<num_property;i++)
  {
    if(cnt_per_property[i] > 0)
      legend_str = legend_str + "<div class='label label-success' style='display:inline-block; width:150px; margin:10px;color:#000;background-color:" + property_per_color[i].color + "'>" + property_per_color[i].type + "<span class='badge'>"+ cnt_per_property[i] + "</span></div>";
  }
  $("#legend").html(legend_str);

  num_edge = 0;
  edge_head.splice(0,edge_head.length);
  edge_data.splice(0,edge_data.length);
  vertex_flag.splice(0,vertex_flag.length);

  for(var i=0;i<=index;i++)
  {
    edge_head[i] = -1;
    vertex_flag[i] = false;
  }

  function add_edge(a,b)
  {
    edge_data.push({"from":a,"to":b,"next":edge_head[a]});
    edge_head[a] = num_edge++;
  }
  edge_flag.splice(0,edge_flag.length);
  for(var i=0;i<graph.links.length;i++)
  {
    add_edge(parseInt(graph.links[i].source),parseInt(graph.links[i].target));
    edge_flag[i] = false;
  }

  var k = graph.links.length;
  for(var i=0;i<graph.nodes.length;i++)
  {
    if(graph.nodes[i].children != undefined)
    {
      for(var j=0;j<graph.nodes[i].children.length;j++)
      {
        add_edge(graph.nodes[i].index,graph.nodes[i].children[j].index);
        add_edge(graph.nodes[i].children[j].index,graph.nodes[i].index);        
        edge_flag[k++] = false;
      }
    }
  }

  num_node = index-1;
  return graph  
}


d3sparql.forcegraph = function(json_link,json_group,json_node, config) {
  arrowhead_scale = d3.scale.linear()
    .domain([10, 30])
    .range([20, 60]);	
	
  function markerscale (d) {
    return arrowhead_scale(10) + "pt";
  }	;
	
  config = config || {}

  var graph = d3sparql.graph(json_link,json_group,json_node, config)
  $("[name='my-checkbox']").bootstrapSwitch();
  $("[name='my-checkbox']").css("display","block");
  $("#gateing").css("display","block");

  var vis_type = true;

  var scale = d3.scale.linear()
    .domain(d3.extent(graph.nodes, function(d) { return parseFloat(d.value) }))
    .range([1, 20])

  var opts = {
    "radius":    config.radius    || function(d) { return 24 },//15 + d.label.length d.value ? scale(d.value) : 
    "charge":    config.charge    || -1000,
    "distance":  config.distance  || 100,
    "width":     config.width     || 1900,
    "height":    config.height    || 890,
    "label":     config.label     || false,
    "selector":  config.selector  || null
  }

  svg_force_width = opts.width;
  svg_force_height = opts.height;  
  
  var id_img="";
  
  var callback=function(success, status, response){
    console.log(success);
    if(success != true || status != '200') return;
     var compoundResult = searcher.parseCompoundResponse(response);
     
     id_img = "http://ops.rsc.org/api/image/compound/";
     if(compoundResult.csURI == null) return;
     for(var i=0;i<compoundResult.csURI.length;i++)
       if(compoundResult.csURI[i] >= '0' && compoundResult.csURI[i] <= '9')
         id_img = id_img + compoundResult.csURI[i]; 
    d3.select("#tip_img").attr('src',id_img)
  }  
if(!d3sparql_started)
{
	node_tip = d3.tip()
	  .attr('id', 'node-tip')
	  .offset([10, 0])
	  .direction('s')
	  .html(function(d) { 
      searcher.fetchCompound(d.data.uri, null, callback);   
      var tip_html = "<div class='alert alert-warning alert-dismissible' style='opacity:0.9;' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span style='font-size:32px;' aria-hidden='true'>&times;</span></button>";
      var info = "<img id='tip_img'></br><strong><span>Name: </span>" + d.data.name + "</br>" + "<span>Type: </span>" + d.data.type + "</br>" +"<span>Link: <a href='"+d.data.uri+ "'target='_blank'>"+d.data.uri+"</a>"+" </span>"+"</br>"+ "<span>MoreInformation: </span><a href='/biosearch/biosearchReport?uri="+d.data.uri+"&name="+d.data.name+"' target='_blank'>"+d.data.name+"</a>" + "</strong>";
      tip_html = tip_html + info + "</div>";

      return tip_html; 
	  });  	  
	d3sparql_started = true;
}   
var zoom = d3.behavior.zoom()
          .scaleExtent([0.1, 10])
          .on("zoom", function() 
          {
            svg_scale = d3.event.scale;
            transform = d3.transform(svg.attr("transform"));       
            console.log(transform.toString())     
            if(!svg_moved)
            {
              svg_transx =  parseFloat(d3.event.translate[0]);
              svg_transy =  parseFloat(d3.event.translate[1]); 
            }
            else
            {
              svg_transx =  parseFloat(d3.event.translate[0]) + parseFloat(transform.translate[0]);
              svg_transy =  parseFloat(d3.event.translate[1]) + parseFloat(transform.translate[1]);  
              svg_moved = false;                          
            }
            console.log(svg_transx.toString() + svg_transy.toString());              
            svg.attr("transform", "translate(" + (svg_transx).toString() + "," + (svg_transy).toString() + ")scale(" + d3.event.scale + ")");
          });
    var json_root = "{\"name\":\"superroot\",\"children\":" + JSON.stringify( graph.nodes ) + "}";
    json_root=JSON.parse(json_root);
    var root = d3.hierarchy(json_root)
        .sum(function(d) { return 6; })
    var pack = d3.pack().size([ opts.width, opts.height ]);
    console.log(root);


  var svg = d3sparql.select(opts.selector, "forcegraph").append("svg")
    .attr("width", opts.width)
    .attr("height", opts.height)
	  .attr( "style","border-width:1px;border-style:solid;")
    .append("g")

  var svg_drag = false,svg_moved = false;
  var svg_transx = 0 ,svg_transy = 0;
  var svg_scale = 1.0;
  var dragx,dragy; 

  var mousedown = function(){
        if(vis_type) {
          dragx = d3.event.x ;dragy = d3.event.y;
          svg_drag = true;         
          svg_moved = true; 
        }
    }
  var mousemove = function(){
        if(vis_type){
          if(svg_drag)
          {
            console.log(dragx.toString() + " " + dragy.toString() + " " + d3.event.x + " " + d3.event.y + " " + svg_transx.toString() + " " + svg_transy.toString());
            svg.attr("transform","translate(" + (parseFloat(d3.event.x) - parseFloat(dragx) + svg_transx).toString() + "," + (parseFloat(d3.event.y) - parseFloat(dragy) + svg_transy).toString() + ")scale("+svg_scale+")");
          }          
        }    
    }  
  var mouseup = function(){
        if(vis_type)
        {
          svg_transx = parseFloat(d3.event.x) - parseFloat(dragx) + svg_transx;
          svg_transy = parseFloat(d3.event.y) - parseFloat(dragy) + svg_transy;      
          svg_drag = false;      
        }    
    }
  var mouseout = function(){
        if(vis_type && svg_drag){
          svg_transx = parseFloat(d3.event.x) - parseFloat(dragx) + svg_transx;
          svg_transy = parseFloat(d3.event.y) - parseFloat(dragy) + svg_transy;      
          svg_drag = false;          
        }    
    }
    d3.select(opts.selector) 
    .on("mousedown",mousedown)
    .on("mousemove",mousemove)        
    .on("mouseup",mouseup)
    .on("mouseout",mouseout)    
    .call(zoom)
    .on("mousedown.zoom", null)
    .on("mousemove.zoom", null)
    .on("mouseup.zoom", null)
    .on("mouseout.zoom", null)     
    $('input[name="my-checkbox"]').on('switchChange.bootstrapSwitch', function(event, state) {
      vis_type = state;
      d3.select(opts.selector)
      .on("mousedown",mousedown)
      .on("mousemove",mousemove)        
      .on("mouseup",mouseup)
      .on("mouseout",mouseout);

  }); 

  d3sparql.piechart(graph,svg);	    		
		
	svg.call(node_tip);


  d3.select("body")
    .on('mouseover',node_tip.hide)
	
	
 svg.append("defs").selectAll("marker")
    .data(pack(root).descendants())
    .enter()
    .append("marker")
      .attr("id", function (d,i) { return d.data.index; })
      .attr("class",function(d,i){return "endmarker marker"+d.data.index;})
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18)
      .attr("refY", 0)
      .attr("markerUnits", "userSpaceOnUse")
      .attr("markerWidth", "8pt")
      .attr("markerHeight", "8pt")
      .attr("orient", "auto")
    .append("path")
      .attr("d", "M0,-2L10,0L0,2");
	  
  svg.selectAll("marker")
    .attr("markerWidth", markerscale)
    .attr("markerHeight", markerscale)
    .select("path")
    .attr("fill", function(d){if(d.data.type != "Anchor") return "#bbb"; else return "#f00";});	  
		
  var link = svg.append("g").selectAll(".link")
    .data(graph.links)
    .enter()
    .append("line")
    .attr("class", function (d,i) { return "link " + d.source;})

	.attr("stroke-width","1")
    .attr("marker-end", function(d) {
      if(d.source == d.target) return;
      return "url(#" + d.target + ")"; 
    });	

    force.charge(opts.charge)
    .linkDistance(opts.distance)
//******************************************************************
  //  .linkStrength(1)	
  //  .chargeDistance(2000)	
	//.gravity(.02)	
//******************************************************************	
    .size([opts.width, opts.height])
    .nodes(pack(root).descendants())
    .links(graph.links)
    .start();
	
 var node_drag = d3.behavior.drag()
    .on("dragstart", dragstart);

  function dragstart(d) {
    d3.select(this).classed("fixed", d.fixed = true);
  }
 
  function releasenode(d) {
    // of course set the node to fixed so the force doesn't include the node in
    // its auto positioning stuff
    d.fixed = false; 
    force.restart();
  } 

  var deltax=[],deltay=[];
  deltax = []; deltay = [];
  var node = svg.selectAll(".node")
    .data(pack(root).descendants())
    .enter()
    .append("g")
    .on('dblclick', releasenode)
    .attr("class", function(d) {
      if(d.depth == 2)
      {
        deltax[d.data.index] = parseFloat(d.px) - parseFloat(d.parent.px);
        deltay[d.data.index] = parseFloat(d.py) - parseFloat(d.parent.py);
      }
      return d.children ? "node" : "leaf node"; 
    })

	.call(node_drag);
//*************************************5*************************************	
  var circle = node.append("circle")
    .attr("class", function(d,i) { return "circle" + d.data.index; })
    .attr("r", function(d,i){if(d.index == 0) return 0;if(d.height == 0 && d.depth == 1) return 24; else return d.r;})
    .on("mouseover",function(d,i){
    if(!(d.height == 0 && d.depth == 1)) return;  
		if(prev_focus_id != -1)
			circle_foucsover(info_by_type[prev_focus_id],prev_focus_id);

		circle_foucs(d.data.index);
		$("#node-tip").bind('mouseover',function(event){event.stopPropagation();});node_tip_focus = 1;d3.event.stopPropagation();node_tip.show(d);	
	})    


    .on("mouseout",function(d,i){  
    if(!(d.height == 0 && d.depth == 1)) return;  

		circle_foucsover(d,d.data.index);			            
            });

  var text = node.append("text")
    .text(function(d) {if(d.data.name != 'null' && d.index) return d.data.name; else return "";})
    .attr("class", "node")
    .on("mouseover",function(d,i){  
          if(!(d.height == 0 && d.depth == 1)) return;  

        d3.select(".circle"+d.data.index)  
            .transition()
            .attr("r", function(d) { return  40 }) 
            .attr("fill", "#FF7F0E")//"#CEDFFf"
    $("#node-tip").bind('mouseover',function(event){event.stopPropagation();});node_tip_focus = 1;d3.event.stopPropagation();node_tip.show(d);  
            

        d3.select(".marker"+d.data.index)
          .transition()
          .attr("refX",25);
        })
    .on("mouseout",function(d,i){  
          if(!(d.height == 0 && d.depth == 1)) return;  

        d3.select(".circle"+d.data.index)  
            .transition()
            .attr("r", function(d) { return  24 }) 
            .attr("fill", circleColor)//"#CEF2E0"
        d3.select(".marker"+d.data.index)
          .transition()
          .attr("refX",18);            
            });
	
  force.on("tick", function() {
    link.attr("x1", function(d) {return svg.select('.circle' + d.source.index).attr('cx'); })
        .attr("y1", function(d) { return svg.select('.circle' + d.source.index).attr('cy'); })
        .attr("x2", function(d) { return svg.select('.circle' + d.target.index).attr('cx'); })
        .attr("y2", function(d) { return svg.select('.circle' + d.target.index).attr('cy'); })
        .attr("class", function (d,i) { if(edge_flag[i])  return "link " + d.source; else return "link " + d.source + " hidden-link";})


    text.attr("x", function(d) { return svg.select('.circle' + d.data.index).attr('cx') })
        .attr("y", function(d) { return svg.select('.circle' + d.data.index).attr('cy')})
        .attr("class", function (d,i) { if(node_flag[i])  return "node"; else return "node hidden-link";})

    circle.attr("cx", function(d) {
          if(d.height == 1) return d.x;
          if(d.depth == 2) 
            return  (parseFloat(d.parent.x) + deltax[d.data.index]).toString();
          return d.x;
        })
        .attr("cy", function(d) {
          if(d.height == 1) return d.y;
          if(d.depth == 2) 
            return  (parseFloat(d.parent.y) + deltay[d.data.index]).toString();
          return d.y;
        })    
        .attr("class", function (d,i) {if(node_flag[d.data.index]) return "circle" + d.data.index; else return "circle" + d.data.index + " hidden-link";})

  })
  node.call(force.drag)

  // default CSS/SVG
  link.attr({
    "stroke": "#999999",
  })
  //path.attr();
  circle.attr({
    "stroke": "lightblue",
    "stroke-width": "1px",
    "fill": circleColor,//"#CEF2E0",
    "opacity": 1,
    "scale": 1,
  })
  text.attr({
    "font-size": "8px",
    "font-family": "sans-serif",
  })

  svg.append("text")
      .attr("x", 50)
      .attr("y", 30)
      .attr("fill","steelblue")
      .style("font-size","15pt")
      .style("font-family", "Courier New");

}
function search_path(start,end)
{
  for(var i=0;i<edge_flag.length;i++)
    edge_flag[i] = false;
  edge_path.splice(0,edge_path.length);    
  node_flag.splice(0,node_flag.length);        
  for(var i=0;i<=num_node;i++)
  {
    vertex_flag[i] = false;
    edge_path[i] = -1;
    node_flag[i] = false;
  }

  var queue = [];
  queue.push(start);
  while(queue.length) 
  {
    var cur = queue.shift();
    if(vertex_flag[cur]) continue;
    vertex_flag[cur] = true;
    if(vertex_flag[end]) break;
    for(var j=edge_head[cur];j!=-1;j=edge_data[j].next)
    {
      var to = edge_data[j].to;
      if(vertex_flag[to]) continue;
      queue.push(to);
      edge_path[to] = j;
    }
  }
  if(vertex_flag[end])
  {
    var k = edge_path[end];
    while(k != -1)
    {
      edge_flag[k] = true;
      node_flag[edge_data[k].from] = true;
      node_flag[edge_data[k].to] = true;       
      k = edge_path[edge_data[k].from];
    }    
  }
  node_flag[start] = true;
  node_flag[end] = true;  
  force.resume()
}

function initial_graph()
{
  for(var i=0;i<=num_node;i++)
    node_flag[i] = true;
  for(var i=0;i<edge_flag.length;i++)
    edge_flag[i] = true;
force.resume()
}

function circleColor(d){if(d.data.type == "Protein") return "#17BECF";
                        if(d.data.type == "GeneProduct") return "#FFBB78";
                        if(d.data.type == "Metabolite") return "#9EDAE5";
                       if(d.data.type == "Rna") return "#CEF2E0";
                       if(d.data.type == "Group") return "#999999";

                        }

function handleMouseOver(d, i) {  // Add interactivity

            // Use D3 to select element, change color and size
            d3.select(this).attr({
              fill: "orange",
              r: radius * 2
            });
}
d3sparql.select = function(selector, type) {
  if (selector) {
    return d3.select(selector).html("").append("div").attr("class", "d3sparql " + type)
  } else {
    return d3.select("body").append("div").attr("class", "d3sparql " + type)
  }
}

/*
  Rendering sparql-results+json object into a pie chart

  References:
    http://bl.ocks.org/mbostock/3887235 Pie chart
    http://bl.ocks.org/mbostock/3887193 Donut chart

  Options:
    config = {
      "label":    "pref",    // SPARQL variable name for slice label (optional; default is the 1st variable)
      "size":     "area",    // SPARQL variable name for slice value (optional; default is the 2nd variable)
      "width":    700,       // canvas width (optional)
      "height":   600,       // canvas height (optional)
      "margin":   10,        // canvas margin (optional)
      "hole":     50,        // radius size of a center hole (optional; 0 for pie, r > 0 for doughnut)
      "selector": "#result"
    }

  Synopsis:
    d3sparql.query(endpoint, sparql, render)

    function render(json) {
      var config = { ... }
      d3sparql.piechart(json, config)
    }

  CSS/SVG:
    <style>
    .label {
      font: 10px sans-serif;
    }
    .arc path {
      stroke: #ffffff;
    }
    </style>
*/
d3sparql.piechart = function(graph,svg_force) {
  for(var i=0;i<num_property;i++)
	  status_property[i] = 0;


  var opts = {
    "label":    "pref",
    "size":     "area",
    "width":    350,
    "height":   350,
    "margin":   30,
    "hole":     30,
    "selector": "#result1"
  }

  var radius = Math.min(opts.width, opts.height) / 2 - opts.margin
  var hole = Math.max(Math.min(radius - 50, opts.hole), 0)
  var color = d3.scale.category20()
  var arc = d3.svg.arc()
    .outerRadius(radius)
    .innerRadius(hole)

  var total_cnt = 0;
  for(var i=0;i<num_property;i++)
	  total_cnt = total_cnt + cnt_per_property[i];
  var data=[0,1,2,3];
	
  var pie = d3.layout.pie()
    .value(function(d,i) { return cnt_per_property[i]; })

  var svg = d3sparql.select(opts.selector, "piechart").append("svg")
    .attr("width", opts.width)
    .attr("height", opts.height)
    .append("g")
    .attr("transform", "translate(" + opts.width / 2 + "," + opts.height / 2 + ")")

  var gate_cond = 0,gate_start,gate_end;

  $("#clear_btn").bind("mousedown",function(){
    gate_cond = 0;
    $("#start_btn span").html("Nothing!");
    $("#end_btn span").html("Nothing!");
    initial_graph();
  })

  var g = svg.selectAll(".arc")
    .data(pie(data))
    .enter()
    .append("g")
    .attr("class", "arc")
	.on("mouseover",function(d,i){
        d3.select(this)  
            .transition()
            .attr("transform","scale(1.2)") 
	})
	.on("mouseout",function(d,i){
		if(status_property[i]) return;
        d3.select(this)  
            .transition()
            .attr("transform","scale(1/1.2)");
	})	
	.on("click",function(d,i){
		status_property[i] = 1 - status_property[i];

		var filter_result = "";
		
		for(var i=1;i<=num_node;i++)
		{
			for(var j=0;j<num_property;j++)
				if(property_per_color[j].type == info_by_type[i].data.type)
					break;
			if(j<num_property)
				if(status_property[j] == 1)
					filter_result = filter_result + "<li class='list-group-item' id='" + i + "list' style='background-color:"+property_per_color[j].color+"'>" + info_by_type[i].name + "</li>";
		}
		$("#filter_result").html(filter_result);
		$(".list-group-item").bind("click",
			function(event)
			{
				var id_str = $(event.target).attr("id");
				var id = "";
				var i =0;
				while(id_str[i] >= '0' && id_str[i] <= '9')
					id = id + id_str[i++];
				var key = $(event.target).html();
				
				if(prev_focus_id != -1)
					circle_foucsover(info_by_type[prev_focus_id],prev_focus_id);
				prev_focus_id = id;					
				circle_foucs(id);
				
				var cx = d3.select(".circle"+id).attr("cx"),cy = d3.select(".circle"+id).attr("cy");  

				svg_force.attr("transform", 
					   "translate(" + (svg_force_width / 2 - parseFloat(cx)).toString() + "," + (svg_force_height / 2 - parseFloat(cy)).toString() + ")");				
        if(gate_cond == 0)
        {
          gate_cond = 1;
          gate_start = id;
          $("#start_btn span").html(info_by_type[id].name);
        }
        else
        {
          gate_cond = 0;
          gate_end = id;
          $("#end_btn span").html(info_by_type[id].name);
          search_path(gate_start,gate_end);
        }
			});
		if(status_property[i] == 0) return;
        d3.select(this)  
            .transition()
            .attr("transform","scale(1.2)") 
		
	})	
	
  var slice = g.append("path")
    .attr("d", arc)
    .attr("fill", function(d, i) { return property_per_color[i].color; })
	.attr("style","opacity:0.6;");
	
  var cur_angle = 0;
  var text = g.append("text")
    .attr("class", "label")
    .attr("transform", function(d) { 
			var curx = arc.centroid(d)[0],cury = arc.centroid(d)[1];
			var cos_value = curx / Math.sqrt((curx * curx + cury * cury));
			var angle = Math.acos(cos_value) / Math.PI * 180;
			if((curx <= 0 && cury <= 0) || (curx >= 0 && cury <= 0))
				angle = 360 - angle;
			if(angle >= 90 && angle <=270) angle = angle + 180;
            return  "translate(" + arc.centroid(d) + ")" +  
                    "rotate(" + angle + ")"; 	
		})
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .text(function(d,i) { if(cnt_per_property[i]) return property_per_color[i].type; else return ""; })

  // default CSS/SVG
  slice.attr({
    "stroke": "#ffffff",
  })
  // TODO: not working?
  svg.selectAll("text").attr({
    "stroke": "none",
    "fill": "black",
    "font-size": "20px",
    "font-family": "sans-serif",
  })
}

/* Helper function only for the d3sparql web site */
d3sparql.toggle = function() {
  var button = d3.select("#button")
  var elem = d3.select("#sparql")
  if (elem.style("display") === "none") {
    elem.style("display", "inline")
    button.attr("class", "icon-chevron-up")
  } else {
    elem.style("display", "none")
    button.attr("class", "icon-chevron-down")
  }
}

/* for IFRAME embed */
d3sparql.frameheight = function(height) {
  d3.select(self.frameElement).style("height", height + "px")
}

