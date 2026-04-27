Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  get "up" => "rails/health#show", as: :rails_health_check
  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest

  # Defines the root path route ("/")
  root "home#index"

  namespace :api do
    namespace :v1 do
      resources :countries, only: [ :index, :show, :create, :update, :destroy ] do
        collection do
          post :bulk_import
        end
      end
    end
  end
end
