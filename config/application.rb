require File.expand_path('../boot', __FILE__)

require 'rails/all'

if defined?(Bundler)
  # If you precompile assets before deploying to production, use this line
  Bundler.require(*Rails.groups(:assets => %w(development test)))
  # If you want your assets lazily compiled in production, use this line
  # Bundler.require(:default, :assets, Rails.env)
end

module Explorer2
  class Application < Rails::Application
    #load library that handles application specific settings
    require File.expand_path(File.join(File.dirname(__FILE__), '../lib/app_settings'))
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # Custom directories with classes and modules you want to be autoloadable.
    # config.autoload_paths += %W(#{config.root}/extras)
    config.autoload_paths += Dir["#{config.root}/lib/**/"]

    # Only load the plugins named here, in the order given (default is alphabetical).
    # :all can be used as a placeholder for all plugins not explicitly named.
    # config.plugins = [ :exception_notification, :ssl_requirement, :all ]

    # Activate observers that should always be running.
    # config.active_record.observers = :cacher, :garbage_collector, :forum_observer

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
    # config.time_zone = 'Central Time (US & Canada)'

    # The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
    # config.i18n.load_path += Dir[Rails.root.join('my', 'locales', '*.{rb,yml}').to_s]
    # config.i18n.default_locale = :de

    # Configure the default encoding used in templates for Ruby 1.9.
    config.encoding = "utf-8"

    # Configure sensitive parameters which will be filtered from the log file.
    config.filter_parameters += [:password]

    # Enable escaping HTML in JSON.
    config.active_support.escape_html_entities_in_json = true

    # Use SQL instead of Active Record's schema dumper when creating the database.
    # This is necessary if your schema can't be completely dumped by the schema dumper,
    # like if you have constraints or database-specific column types
    # config.active_record.schema_format = :sql

    # Enforce whitelist mode for mass assignment.
    # This will create an empty whitelist of attributes available for mass-assignment for all models
    # in your app. As such, your models will need to explicitly whitelist or blacklist accessible
    # parameters by using an attr_accessible or attr_protected declaration.
    config.active_record.whitelist_attributes = true

    # Enable the asset pipeline
    config.assets.enabled = true

    # Version of your assets, change this if you want to expire all your assets
    config.assets.version = '1.0'
    ActiveRecord::Base.include_root_in_json = false
    
    #application specific settings
    AppSettings.config = YAML.load_file("config/app_settings.yml")[Rails.env]

    #handlebars file
    #HandlebarsAssets::Config.compiler = 'handlebars-v1.3.0.js'
    #HandlebarsAssets::Config.compiler_path = Rails.root.join('vendor/assets/javascripts')
    
    #active support cache has problems unmarshalling objects in development which results in
    #undefined class/module errors
    #http://alisdair.mcdiarmid.org/2013/02/02/fixing-rails-auto-loading-for-serialized-objects.html
    # Eager load all value objects, as they may be instantiated from
    # YAML before the symbol is referenced
    config.before_initialize do |app|
      app.config.paths.add 'app/models', :eager_load => true
    end
    # Reload cached/serialized classes before every request (in development
    # mode) or on startup (in production mode)
    config.to_prepare do
      Dir[ File.expand_path(Rails.root.join("app/models/*.rb")) ].each do |file|
        require_dependency file
      end
    end
  end
end
