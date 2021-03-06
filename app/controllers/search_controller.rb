require 'csv'

class SearchController < ApplicationController

  # Given a query string search the list of compounds
  # and targets for matches. Only matches the start of
  # the prefLabel
  def typeahead
    results = []
    compound_results = Rails.cache.fetch('comp_' + params[:query], :expires_in => 6.months) { Compound.where(["label LIKE ?", "%#{params[:query]}%"]).limit(20) }.map do |compound|
	    {value: compound.label}
    end
    target_results = Rails.cache.fetch('tar_' + params[:query], :expires_in => 6.months) { Target.where(["label LIKE ?", "%#{params[:query]}%"]).limit(20) }.map do |target|
	    {value: target.label}
    end
    # shuffle the results so that compounds and targets get mixed up since we
    # are not doing any relevancy matches
    compound_results.concat(target_results)
    respond_to do |format|
      format.json { render :json => compound_results }
    end

  end

  def typeaheadCompounds
    results = []
    File.open(File.join(Rails.root, "filestore", "compounds.txt")).each do |row|
       if row.downcase.starts_with? params[:query].downcase
         results.push(row) 
       end
    end
     # shuffle the results so that compounds and targets get mixed up since we
    # are not doing any relevancy matches
    results.shuffle
    respond_to do |format|
      format.json { render :json => results }
    end

  end
  
    def typeaheadTargets
    results = []

    File.open(File.join(Rails.root, "filestore", "targets.txt")).each do |row|
       if row.downcase.starts_with? params[:query].downcase
         results.push(row) 
       end
    end
    # shuffle the results so that compounds and targets get mixed up since we
    # are not doing any relevancy matches
    results.shuffle
    respond_to do |format|
      format.json { render :json => results }
    end

  end
  
  def index

  end

end
