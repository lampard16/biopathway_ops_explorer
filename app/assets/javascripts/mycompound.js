function mycompound_report(){

$.extend({
  getUrlVars: function(){
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
      hash = hashes[i].split('=');
      vars.push(hash[0]);
      vars[hash[0]] = hash[1];
    }
    return vars;
  },
  getUrlVar: function(name){
    return $.getUrlVars()[name];
  }
});

var searcher = new CompoundSearch("https://beta.openphacts.org/2.1", "161aeb7d", "cffc292726627ffc50ece1dccd15aeaf");
var uri_priority = ["csURI","URI","cwURI","drugbankURI","chemblURI"];
var uri_img = ["chemspiderProvIcon.png","hmdb.png","conceptWikiProvIcon.png","drugbankProvIcon.png","chemblProvIcon.png"];
var uri_title = ["ChemSpider","HMDB","ConceptWiKi","DrugBank","Chembl"];
var id_priority = ["OPS RSC","HMDB","ConceptWiKi","DrugBank","Chembl"];
var boxes_property = ["logp","hba","hbd","fullMWT","mwFreebase","psa","rtb"];
var boxes_item = ["AlogP","# H-Bond Acceptors","# H-Bond Donors","Mol Weight","Mol Weight Freebase","Polar Surface Area","# Rotatable Bonds"];
var num_uri = 5;
var num_boxes = 7;

function print_moleform(string)
{
	var i=0;
	var result = "";
	while(string[i])
	{
		if(string[i] >= '0' && string[i] <= '9')
			result = result + "<sub>" + string[i] + "</sub>";
		else
			result = result + string[i];
		i++;
	}
	return result;
}

function get_id(string)
{
	var i=0,j=0;
	var cur = "",result = "";
	while(string[i]) i++;
	i--;
	while(string[i] != '/')
	{
		cur = cur + string[i--];
		j++;
	}	
	j--;
	while(j>=0)
		result = result + cur[j--];
	return result;
}

var callback=function(success, status, response){
	//alert(response._about);
	console.log(response._about);
   var compoundResult = searcher.parseCompoundResponse(response);

   var id_img = "";

   for(var i=0;i<compoundResult.csURI.length;i++)
	   if(compoundResult.csURI[i] >= '0' && compoundResult.csURI[i] <= '9')
		   id_img = id_img + compoundResult.csURI[i];
  
   $("#chemical-image").attr('src',"http://ops.rsc.org/api/image/compound/" + id_img);


//Molecular formula   
   var format_str = "<div class='dl-horizontal'> <dl class='dl-text-left'> <dt class='medium-padding-top'>Molecular Formula</dt><dd class='medium-padding-top'>" + print_moleform(compoundResult.molform);
   id_img = "";
   for(var i=0;i<num_uri;i++)
   	{
   		if(compoundResult[uri_priority[i]] != null)
		  	 id_img = id_img + "<a href='"  + compoundResult[uri_priority[i]] + "' target='_blank'><img src='" + uri_img[i] + "' title='" + uri_title[i] + "' width='15' height='15'></a><sub>&nbsp&nbsp</sub>";
   	}		
   	id_img = id_img + "</dd>";
   format_str = format_str + id_img;

//Chemspider ID
	for(var i=0;i<=num_uri;i++)
	{
		if(compoundResult[uri_priority[i]] != null)
		{
			format_str = format_str + "<dt>" + id_priority[i] + " ID</dt><dd class='medium-padding-top'><a href='" + compoundResult[uri_priority[i]] + "' target='_blank'>" + get_id(compoundResult[uri_priority[i]]) + "</a></dd>"
		}
	}
//SMILES (it has problems)
	format_str = format_str + "<dt class='medium-padding-top'>SMILES</dt><dd class='medium-padding-top' id='smiles-provenance'><a id='ember1733' class='ember-view break-word' href='' title='Draw this structure'>"+ compoundResult.smiles + id_img + "</dd>";

//InCHL
	format_str = format_str + "<dt class='medium-padding-top'>Standard  InChI</dt><dd class='medium-padding-top' id='inchi-provenance'>" + compoundResult.inchi + id_img + "</dd>"
//InCHLKey
	format_str = format_str + "<dt class='medium-padding-top'>Standard InChIKey</dt><dd class='medium-padding-top' id='inchikey-provenance'>" + compoundResult.inchiKey + id_img + "</dd>";
//Protein Binding
	if(compoundResult.proteinBinding != null)
		format_str = format_str + "<dt class='medium-padding-top'>Protein Binding</dt><dd class='medium-padding-top' id='protein-binding-provenance'>" + compoundResult.proteinBinding + "<a href='" + compoundResult.drugbankURI + "' target='_blank'><img src='drugbankProvIcon.png' title='DrugBank' width='15' height='15'></a></dd>";
//Toxicity
	if(compoundResult.toxicity != null)
		format_str = format_str + "<dt class='medium-padding-top'>Toxicity</dt><dd class='medium-padding-top' id='toxicity-provenance'>" + compoundResult.toxicity + "<a href='" + compoundResult.drugbankURI + "' target='_blank'><img src='drugbankProvIcon.png' title='DrugBank' width='15' height='15'></a></dd>";
    format_str = format_str + "</dl>"
    $("#intro_plat").html(format_str);			
//----------------------boxes------------------------
//	format_str = "<div class='summary-box no-top-margin'><div class='inner-property-content'><p><small>AlogP</small></p><p class='lead' id='logp-provenance'>" + compoundResult.logp + "<a href='http://ops.rsc.org/OPS403534' target='_blank'><img src='chemspiderProvIcon.png' title='ChemSpider' width='15' height='15'></a></p></div></div>";    
	var i;
	format_str="";
	for(i=0;i<num_boxes;i++)
	{
		if(compoundResult[boxes_property[i]] != null && !isNaN(compoundResult[boxes_property[i]]))
		{
			format_str = "<div class='summary-box no-top-margin'><div class='inner-property-content'><p><small>" + boxes_item[i] + "</small></p><p class='lead' id='" + boxes_item[i] + "-provenance'>" + compoundResult[boxes_property[i]] + "<a href='http://ops.rsc.org/OPS403534' target='_blank'><img src='chemspiderProvIcon.png' title='ChemSpider' width='15' height='15'></a></p></div></div>";    
			break;
		}
	}

	for(i=i+1;i<num_boxes;i++)
	{
		if(compoundResult[boxes_property[i]] != null && !isNaN(compoundResult[boxes_property[i]]))
			format_str = format_str + "<div class='summary-box'><div class='inner-property-content'><p><small>" + boxes_item[i] + "</small></p><p class='lead' id='" + boxes_item[i] + "-provenance'>" + compoundResult[boxes_property[i]] + "<a href='http://ops.rsc.org/OPS403534' target='_blank'><img src='chemspiderProvIcon.png' title='ChemSpider' width='15' height='15'></a></p></div></div>";    
	}


	$("#boxes").html(format_str);
	$("#name_place").html("<h1 class='break-word'>"+decodeURIComponent(compound_name)+"</h1>");

};
var compound_uri = $.getUrlVar('uri');
var compound_name = $.getUrlVar('name');
searcher.fetchCompound(compound_uri, null, callback);
}
