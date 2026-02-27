class BaseDispatcher
  include Wisper::Publisher

  def initialize
    super
    @loaded_listeners = {}
  end

  def listeners
    []
  end

  def load_listeners
    # `config.to_prepare` can invoke this multiple times in development.
    listeners.each do |listener|
      listener_key = [listener.class.name, listener.object_id]
      next if @loaded_listeners[listener_key]

      subscribe(listener)
      @loaded_listeners[listener_key] = true
    end
  end
end
