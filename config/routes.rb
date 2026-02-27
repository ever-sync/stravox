# frozen_string_literal: true

Rails.application.routes.draw do
  # AUTH STARTS
  mount_devise_token_auth_for 'User', at: 'auth', controllers: {
    confirmations: 'devise_overrides/confirmations',
    passwords: 'devise_overrides/passwords',
    sessions: 'devise_overrides/sessions',
    token_validations: 'devise_overrides/token_validations',
    omniauth_callbacks: 'devise_overrides/omniauth_callbacks'
  }, via: [:get, :post]

  ## renders the frontend paths only if its not an api only server
  if ActiveModel::Type::Boolean.new.cast(ENV.fetch('CW_API_ONLY_SERVER', false))
    root to: 'api#index'
  else
    root to: 'dashboard#index'

    get '/app', to: 'dashboard#index'
    get '/app/*params', to: 'dashboard#index'
    %i[twitter microsoft instagram tiktok].each do |provider|
      get "/app/accounts/:account_id/settings/inboxes/new/#{provider}", to: 'dashboard#index', as: :"app_new_#{provider}_inbox"
    end
    %i[twitter email instagram tiktok].each do |provider|
      get '/app/accounts/:account_id/settings/inboxes/new/:inbox_id/agents', to: 'dashboard#index', as: :"app_#{provider}_inbox_agents"
    end
    %i[instagram tiktok email].each do |provider|
      get '/app/accounts/:account_id/settings/inboxes/:inbox_id', to: 'dashboard#index', as: :"app_#{provider}_inbox_settings"
    end

    resource :widget, only: [:show]
    namespace :survey do
      resources :responses, only: [:show]
    end
    resource :slack_uploads, only: [:show]
  end

  get '/health', to: 'health#show'
  get '/api', to: 'api#index'

  concern :account_captain_routes do
    namespace :captain do
      resource :preferences, only: [:show, :update]
      resources :assistants do
        member do
          post :playground
        end
        collection do
          get :tools
        end
        resources :inboxes, only: [:index, :create, :destroy], param: :inbox_id
        resources :scenarios
      end
      resources :assistant_responses
      resources :bulk_actions, only: [:create]
      resources :copilot_threads, only: [:index, :create] do
        resources :copilot_messages, only: [:index, :create]
      end
      resources :custom_tools
      resources :documents, only: [:index, :show, :create, :destroy]
      resource :tasks, only: [], controller: 'tasks' do
        post :rewrite
        post :summarize
        post :reply_suggestion
        post :label_suggestion
        post :follow_up
      end
    end
  end

  concern :account_conversation_routes do
    collection do
      get :meta
      get :search
      post :filter
    end

    scope module: :conversations do
      resources :messages, only: [:index, :create, :destroy, :update] do
        member do
          post :translate
          post :retry
        end
      end
      resources :assignments, only: [:create]
      resources :labels, only: [:create, :index]
      resource :participants, only: [:show, :create, :update, :destroy]
      resource :direct_uploads, only: [:create]
      resource :draft_messages, only: [:show, :update, :destroy]
    end

    member do
      post :mute
      post :unmute
      post :transcript
      post :toggle_status
      post :toggle_priority
      post :toggle_typing_status
      post :update_last_seen
      post :unread
      post :custom_attributes
      get :attachments
      get :inbox_assistant
      get :reporting_events if StravoXApp.enterprise?
    end
  end

  concern :account_contact_routes do
    collection do
      get :active
      get :search
      post :filter
      post :import
      post :export
    end

    member do
      get :contactable_inboxes
      post :destroy_custom_attributes
      delete :avatar
    end

    scope module: :contacts do
      resources :conversations, only: [:index]
      resources :contact_inboxes, only: [:create]
      resources :labels, only: [:create, :index]
      resources :notes
      post :call, on: :member, to: 'calls#create' if StravoXApp.enterprise?
    end
  end

  concern :account_inbox_routes do
    get :assignable_agents, on: :member
    get :campaigns, on: :member
    get :agent_bot, on: :member
    post :set_agent_bot, on: :member
    delete :avatar, on: :member
    post :sync_templates, on: :member
    get :health, on: :member

    if StravoXApp.enterprise?
      resource :conference, only: %i[create destroy], controller: 'conference' do
        get :token, on: :member
      end
    end

    resource :csat_template, only: [:show, :create], controller: 'inbox_csat_templates'
  end

  concern :account_notification_routes do
    collection do
      post :read_all
      get :unread_count
      post :destroy_all
    end

    member do
      post :snooze
      post :unread
    end
  end

  concern :account_team_routes do
    resources :team_members, only: [:index, :create] do
      collection do
        delete :destroy
        patch :update
      end
    end
  end

  concern :api_v1_widget_routes do
    namespace :widget do
      resource :direct_uploads, only: [:create]
      resource :config, only: [:create]
      resources :campaigns, only: [:index]
      resources :events, only: [:create]
      resources :messages, only: [:index, :create, :update]
      resources :conversations, only: [:index, :create] do
        collection do
          post :destroy_custom_attributes
          post :set_custom_attributes
          post :update_last_seen
          post :toggle_typing
          post :transcript
          get :toggle_status
        end
      end
      resource :contact, only: [:show, :update] do
        collection do
          post :destroy_custom_attributes
          patch :set_user
        end
      end
      resources :inbox_members, only: [:index]
      resources :labels, only: [:create, :destroy]
      namespace :integrations do
        resource :dyte, controller: 'dyte', only: [] do
          collection do
            post :add_participant_to_meeting
          end
        end
      end
    end
  end

  concern :api_v2_account_reporting_routes do
    scope module: :accounts do
      resources :summary_reports, only: [] do
        collection do
          get :agent
          get :team
          get :inbox
          get :label
          get :channel
        end
      end
      resources :reports, only: [:index] do
        collection do
          get :summary
          get :bot_summary
          get :agents
          get :inboxes
          get :labels
          get :teams
          get :conversations
          get :conversations_summary
          get :conversation_traffic
          get :bot_metrics
          get :inbox_label_matrix
          get :first_response_time_distribution
          get :outgoing_messages_count
        end
      end
      resource :year_in_review, only: [:show]
      resources :live_reports, only: [] do
        collection do
          get :conversation_metrics
          get :grouped_conversation_metrics
        end
      end
    end
  end

  concern :public_api_inbox_contact_conversation_routes do
    member do
      post :toggle_status
      post :toggle_typing
      post :update_last_seen
    end

    resources :messages, only: [:index, :create, :update]
  end

  concern :public_api_inbox_contact_routes do
    resources :conversations, only: [:index, :create, :show], concerns: :public_api_inbox_contact_conversation_routes
  end

  concern :enterprise_api_v1_account_routes do
    member do
      post :checkout
      post :subscription
      get :limits
      post :toggle_deletion
      post :topup_checkout
    end
  end

  concern :platform_api_v1_user_routes do
    member do
      get :login
      post :token
    end
  end

  concern :platform_api_v1_account_routes do
    resources :account_users, only: [:index, :create] do
      collection do
        delete :destroy
      end
    end
  end

  namespace :api, defaults: { format: 'json' } do
    namespace :v1 do
      # ----------------------------------
      # start of account scoped api routes
      resources :accounts, only: [:create, :show, :update] do
        member do
          post :update_active_at
          get :cache_keys
        end

        scope module: :accounts do
          namespace :actions do
            resource :contact_merge, only: [:create]
          end
          resource :bulk_actions, only: [:create]
          resources :agents, only: [:index, :create, :update, :destroy] do
            post :bulk_create, on: :collection
          end
          concerns :account_captain_routes
          resource :saml_settings, only: [:show, :create, :update, :destroy]
          resources :agent_bots, only: [:index, :create, :show, :update, :destroy] do
            delete :avatar, on: :member
            post :reset_access_token, on: :member
          end
          resources :contact_inboxes, only: [] do
            collection do
              post :filter
            end
          end
          resources :assignable_agents, only: [:index]
          resource :audit_logs, only: [:show]
          resources :callbacks, only: [] do
            collection do
              post :register_facebook_page
              get :register_facebook_page
              post :facebook_pages
              post :reauthorize_page
            end
          end
          resources :canned_responses, only: [:index, :create, :update, :destroy]
          resources :pipelines do
            resources :pipeline_stages
          end
          resources :automation_rules, only: [:index, :create, :show, :update, :destroy] do
            post :clone
          end
          resources :macros, only: [:index, :create, :show, :update, :destroy] do
            post :execute, on: :member
          end
          resources :sla_policies, only: [:index, :create, :show, :update, :destroy]
          resources :custom_roles, only: [:index, :create, :show, :update, :destroy]
          resources :agent_capacity_policies, only: [:index, :create, :show, :update, :destroy] do
            scope module: :agent_capacity_policies do
              resources :users, only: [:index, :create, :destroy]
              resources :inbox_limits, only: [:create, :update, :destroy]
            end
          end
          resources :campaigns, only: [:index, :create, :show, :update, :destroy]
          resources :dashboard_apps, only: [:index, :show, :create, :update, :destroy]
          namespace :channels do
            resource :twilio_channel, only: [:create]
          end
          resources :conversations, only: [:index, :create, :show, :update, :destroy], concerns: :account_conversation_routes

          resources :search, only: [:index] do
            collection do
              get :conversations
              get :messages
              get :contacts
              get :articles
            end
          end

          resources :companies, only: [:index, :show, :create, :update, :destroy] do
            collection do
              get :search
            end
          end
          resources :contacts, only: [:index, :show, :update, :create, :destroy], concerns: :account_contact_routes
          resources :csat_survey_responses, only: [:index] do
            collection do
              get :metrics
              get :download
            end
            member do
              patch :update if StravoXApp.enterprise?
            end
          end
          resources :applied_slas, only: [:index] do
            collection do
              get :metrics
              get :download
            end
          end
          resources :reporting_events, only: [:index] if StravoXApp.enterprise?
          resources :custom_attribute_definitions, only: [:index, :show, :create, :update, :destroy]
          resources :custom_filters, only: [:index, :show, :create, :update, :destroy]
          resources :inboxes, only: [:index, :show, :create, :update, :destroy], concerns: :account_inbox_routes

          resources :inbox_members, only: [:create, :show], param: :inbox_id do
            collection do
              delete :destroy
              patch :update
            end
          end
          resources :labels, only: [:index, :show, :create, :update, :destroy]

          resources :notifications, only: [:index, :update, :destroy], concerns: :account_notification_routes
          resource :notification_settings, only: [:show, :update]

          resources :teams, concerns: :account_team_routes

          # Assignment V2 Routes
          resources :assignment_policies do
            resources :inboxes, only: [:index, :create, :destroy], module: :assignment_policies
          end

          resources :inboxes, only: [] do
            resource :assignment_policy, only: [:show, :create, :destroy], module: :inboxes
          end

          %i[twitter microsoft google instagram tiktok notion whatsapp].each do |provider|
            namespace provider do
              resource :authorization, only: [:create]
            end
          end

          resources :webhooks, only: [:index, :create, :update, :destroy]
          namespace :integrations do
            resources :apps, only: [:index, :show]
            resources :hooks, only: [:show, :create, :update, :destroy] do
              member do
                post :process_event
              end
            end
            resource :slack, only: [:create, :update, :destroy], controller: 'slack' do
              member do
                get :list_all_channels
              end
            end
            resource :dyte, controller: 'dyte', only: [] do
              collection do
                post :create_a_meeting
                post :add_participant_to_meeting
              end
            end
            resource :shopify, controller: 'shopify', only: [:destroy] do
              collection do
                post :auth
                get :orders
              end
            end
            resource :linear, controller: 'linear', only: [] do
              collection do
                delete :destroy
                get :teams
                get :team_entities
                post :create_issue
                post :link_issue
                post :unlink_issue
                get :search_issue
                get :linked_issues
              end
            end
            resource :notion, controller: 'notion', only: [] do
              collection do
                delete :destroy
              end
            end
          end
          resources :working_hours, only: [:update]

          resources :portals do
            member do
              patch :archive
              delete :logo
              post :send_instructions
              get :ssl_status
            end
            resources :categories
            resources :articles do
              post :reorder, on: :collection
            end
          end

          resources :upload, only: [:create]
        end
      end
      # end of account scoped api routes
      # ----------------------------------

      namespace :integrations do
        resources :webhooks, only: [:create]
      end

      # Frontend API endpoint to trigger SAML authentication flow
      post 'auth/saml_login', to: 'auth#saml_login'

      resource :profile, only: [:show, :update] do
        delete :avatar, on: :collection
        member do
          post :availability
          post :auto_offline
          put :set_active_account
          post :resend_confirmation
          post :reset_access_token
        end

        # MFA routes
        scope module: 'profile' do
          resource :mfa, controller: 'mfa', only: [:show, :create, :destroy] do
            post :verify
            post :backup_codes
          end
        end
      end

      resource :notification_subscriptions, only: [:create, :destroy]

      concerns :api_v1_widget_routes
    end

    namespace :v2 do
      resources :accounts, only: [:create], concerns: :api_v2_account_reporting_routes
    end
  end

  if StravoXApp.enterprise?
    namespace :enterprise, defaults: { format: 'json' } do
      namespace :api do
        namespace :v1 do
          resources :accounts, concerns: :enterprise_api_v1_account_routes
        end
      end

      post 'webhooks/stripe', to: 'webhooks/stripe#process_payload'
      post 'webhooks/firecrawl', to: 'webhooks/firecrawl#process_payload'
    end
  end

  # ----------------------------------------------------------------------
  # Routes for platform APIs
  namespace :platform, defaults: { format: 'json' } do
    namespace :api do
      namespace :v1 do
        resources :users, only: [:create, :show, :update, :destroy], concerns: :platform_api_v1_user_routes
        resources :agent_bots, only: [:index, :create, :show, :update, :destroy] do
          delete :avatar, on: :member
        end
        resources :accounts, only: [:index, :create, :show, :update, :destroy], concerns: :platform_api_v1_account_routes
      end
    end
  end

  # ----------------------------------------------------------------------
  # Routes for inbox APIs Exposed to contacts
  namespace :public, defaults: { format: 'json' } do
    namespace :api do
      namespace :v1 do
        resources :inboxes do
          scope module: :inboxes do
            resources :contacts, only: [:create, :show, :update], concerns: :public_api_inbox_contact_routes
          end
        end

        resources :csat_survey, only: [:show, :update]
      end
    end
  end

  [
    ['hc/:slug', 'public/api/v1/portals#show'],
    ['hc/:slug/sitemap.xml', 'public/api/v1/portals#sitemap'],
    ['hc/:slug/:locale', 'public/api/v1/portals#show'],
    ['hc/:slug/:locale/articles', 'public/api/v1/portals/articles#index'],
    ['hc/:slug/:locale/categories', 'public/api/v1/portals/categories#index'],
    ['hc/:slug/:locale/categories/:category_slug', 'public/api/v1/portals/categories#show'],
    ['hc/:slug/:locale/categories/:category_slug/articles', 'public/api/v1/portals/articles#index'],
    ['hc/:slug/articles/:article_slug.png', 'public/api/v1/portals/articles#tracking_pixel'],
    ['hc/:slug/articles/:article_slug', 'public/api/v1/portals/articles#show']
  ].each do |path, target|
    get path, to: target
  end

  # ----------------------------------------------------------------------
  # Used in mailer templates
  resource :app, only: [:index] do
    resources :accounts do
      resources :conversations, only: [:show]
    end
  end

  # ----------------------------------------------------------------------
  # Routes for channel integrations
  mount Facebook::Messenger::Server, at: 'bot'
  get 'webhooks/twitter', to: 'api/v1/webhooks#twitter_crc'
  post 'webhooks/twitter', to: 'api/v1/webhooks#twitter_events'
  {
    line: :line_channel_id,
    telegram: :bot_token,
    sms: :phone_number
  }.each do |provider, param|
    post "webhooks/#{provider}/:#{param}", to: "webhooks/#{provider}#process_payload"
  end
  get 'webhooks/whatsapp/:phone_number', to: 'webhooks/whatsapp#verify'
  post 'webhooks/whatsapp/:phone_number', to: 'webhooks/whatsapp#process_payload'
  get 'webhooks/instagram', to: 'webhooks/instagram#verify'
  post 'webhooks/instagram', to: 'webhooks/instagram#events'
  post 'webhooks/tiktok', to: 'webhooks/tiktok#events'

  %i[twitter linear shopify].each do |provider|
    namespace provider do
      resource :callback, only: [:show]
    end
  end

  namespace :twilio do
    resources :callback, only: [:create]
    resources :delivery_status, only: [:create]

    if StravoXApp.enterprise?
      post 'voice/call/:phone', to: 'voice#call_twiml', as: :voice_call
      post 'voice/status/:phone', to: 'voice#status', as: :voice_status
      post 'voice/conference_status/:phone', to: 'voice#conference_status', as: :voice_conference_status
    end
  end

  %i[microsoft google instagram tiktok notion].each do |provider|
    get "#{provider}/callback", to: "#{provider}/callbacks#show"
  end
  # ----------------------------------------------------------------------
  # Routes for external service verifications
  get '.well-known/assetlinks.json' => 'android_app#assetlinks'
  get '.well-known/apple-app-site-association' => 'apple_app#site_association'
  get '.well-known/microsoft-identity-association.json' => 'microsoft#identity_association'
  get '.well-known/cf-custom-hostname-challenge/:id', to: 'custom_domains#verify'

  # ----------------------------------------------------------------------
  # Internal Monitoring Routes
  require 'sidekiq/web'
  require 'sidekiq/cron/web'

  devise_for :super_admins, path: 'super_admin', controllers: { sessions: 'super_admin/devise/sessions' }
  devise_scope :super_admin do
    get 'super_admin/logout', to: 'super_admin/devise/sessions#destroy'
    namespace :super_admin do
      root to: 'dashboard#index'

      resource :app_config, only: [:show, :create]

      # order of resources affect the order of sidebar navigation in super admin
      resources :accounts, only: [:index, :new, :create, :show, :edit, :update, :destroy] do
        post :seed, on: :member
        post :reset_cache, on: :member
      end
      resources :users, only: [:index, :new, :create, :show, :edit, :update, :destroy] do
        delete :avatar, on: :member, action: :destroy_avatar
      end

      resources :access_tokens, only: [:index, :show]
      resources :installation_configs, only: [:index, :new, :create, :show, :edit, :update]
      resources :agent_bots, only: [:index, :new, :create, :show, :edit, :update, :destroy] do
        delete :avatar, on: :member, action: :destroy_avatar
      end
      resources :platform_apps, only: [:index, :new, :create, :show, :edit, :update, :destroy]
      resource :instance_status, only: [:show]

      resource :settings, only: [:show] do
        get :refresh, on: :collection
      end

      # resources that doesn't appear in primary navigation in super admin
      resources :account_users, only: [:new, :create, :show, :destroy]
    end
    authenticated :super_admin do
      mount Sidekiq::Web => '/monitoring/sidekiq'
    end
  end

  namespace :installation do
    get 'onboarding', to: 'onboarding#index'
    post 'onboarding', to: 'onboarding#create'
  end

  # ---------------------------------------------------------------------
  # Routes for swagger docs
  get '/swagger/*path', to: 'swagger#respond'
  get '/swagger', to: 'swagger#respond'

  # ----------------------------------------------------------------------
  # Routes for testing
  resources :widget_tests, only: [:index] unless Rails.env.production?
end
