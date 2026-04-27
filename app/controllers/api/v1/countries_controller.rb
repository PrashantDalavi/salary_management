module Api
  module V1
    class CountriesController < ActionController::API
      before_action :set_country, only: [ :show, :update, :destroy ]

      def index
        page = params[:page].to_i
        per_page = params[:per_page].to_i
        page = 1 if page <= 0
        per_page = 10 if per_page <= 0

        countries = Country.order(:id).page(page).per(per_page)

        render json: {
          countries: countries,
          pagination: {
            current_page: countries.current_page,
            per_page: countries.limit_value,
            total_count: countries.total_count,
            total_pages: countries.total_pages
          }
        }, status: :ok
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

      def bulk_import
        result = Countries::ImportService.new(params[:file]).call
        response_data = {
          imported: result[:imported],
          updated: result[:updated],
          skipped: result[:skipped],
          errors: result[:errors]
        }
        if result[:success]
          render json: response_data.merge(message: "Import completed"), status: :ok
        else
          render json: response_data.merge(message: "Import failed"), status: :unprocessable_entity
        end
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
