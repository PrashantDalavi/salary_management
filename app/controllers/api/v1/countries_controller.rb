module Api
  module V1
    class CountriesController < ActionController::API
      before_action :set_country, only: [ :show, :update, :destroy ]

      def index
        countries = Country.order(:id)
        render json: countries, status: :ok
      end

      def show
        render json: @country, status: :ok
      end

      def create
        country = Country.new(country_params)
        if country.save
          render json: country, status: :created
        else
          render json: { errors: country.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @country.update(country_params)
          render json: @country, status: :ok
        else
          render json: { errors: @country.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        country_name = @country.name
        @country.destroy
        render json: { message: "#{country_name} has been deleted" }, status: :ok
      rescue ActiveRecord::InvalidForeignKey
        render json: { error: "Cannot delete country due to dependent records" }, status: :unprocessable_entity
      end

      private

      def set_country
        @country = Country.find_by(id: params[:id])
        return if @country.present?
        render json: { error: "Country not found" }, status: :not_found
      end

      def country_params
        params.require(:country).permit(:name, :code)
      end
    end
  end
end
