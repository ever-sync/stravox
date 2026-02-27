Rails.application.configure do
  config.to_prepare do
    # Rebuild the dispatcher on each reload cycle to avoid retaining old subscribers.
    Rails.configuration.dispatcher = Dispatcher.new
    Rails.configuration.dispatcher.load_listeners
  end
end
