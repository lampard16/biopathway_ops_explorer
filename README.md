#Open PHACTS Explorer 2 [![DOI](https://zenodo.org/badge/doi/10.5281/zenodo.21026.svg)](http://dx.doi.org/10.5281/zenodo.21026)

Introduction
============

The BioPathway_OPS Explorer is a visualization tool for biopathway based on Open PHACTS Explorer published by ianwdunlop. 

The Open PHACTS Explorer is an HTML5 & CSS3 application for chemical information discovery and browsing. It is used to search for chemical compound and target information using a web  search interface. It uses [Ruby on Rails](http://www.rubyonrails.org "Ruby on Rails Web Application framework"), [Ember JS](http://emberjs.com "Ember JS Javascript MVC framework") and [OPS.JS](http://github.com/openphacts/ops.js "OPS.JS Javascript library for accessing the Open PHACTS Linked Data API"). The Explorer uses the [Open PHACTS Linked Data API](http://dev.openphacts.org "Open PHACTS Linked Data API developer documentation and registration").

And BioPathway_OPS Explorer is adding pathway search and visualization function to Open PHACTS Explorer.

Setup 
============

The steps of setup this system is in https://github.com/openphacts/explorer2.

Adding and Updating files
============

Following files are adding files to Open PHACTS Explorer.

/app/assets/javascripts/combined.js                                 
//OPS API

/app/assets/javascripts/biosearchRoutes.js                          
//setting up biosearch route which is the important view part

/app/assets/javascripts/d3sparql.js                                 
//response for getting remote data and visualizing

/app/assets/javascripts/mycompound.js                               
//making chemical report

/app/assets/javascripts/d3-tip.min.js                               
//d3-tip

/app/assets/javascripts/d3-hierarchy.v1.min.js                      
//d3-hierarchy plug for packing in d3sparql

/app/assets/javascripts/controllers/biosearchController.js         
//the controller of biosearch

/app/assets/javascripts/controllers/biosearchIndexController.js     
//the controller of biosearchIndex

/app/assets/javascripts/controllers/math.min.js                     
//math functions


/app/assets/javascripts/templates/biosearch/*                       
//the templates

/app/controllers/biosearch_controller.rb                            
//the ruby file for biosearch controller

/app/views/layouts/biosearch.html.erb                               
//the view layout of biosearch

/app/views/biosearch/*                                              
//the view files for biosearch

Following files are updating files to Open PHACTS Explorer.

/app/assets/javascripts/routes.js                                   
//updating routes on biosearch

/app/assets/javascripts/routeSetup.js                               
//updating routeSetup on biosearch

/app/assets/javascripts/application.js                              
//stopping turbolink and uploading corresponding files




