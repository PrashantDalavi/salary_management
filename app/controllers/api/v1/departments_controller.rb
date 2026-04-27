module Api
  module V1
    class DepartmentsController < ActionController::API
      before_action :set_department, only: [ :show, :update, :destroy ]

      def index
        page = params[:page].to_i
        per_page = params[:per_page].to_i
        page = 1 if page <= 0
        per_page = 10 if per_page <= 0

        departments = Department.search(params[:search]).includes(:country).order(:id).page(page).per(per_page)

        render json: {
          departments: departments.as_json(include: { country: { only: [ :id, :name, :code ] } }),
          pagination: {
            current_page: departments.current_page,
            per_page: departments.limit_value,
            total_count: departments.total_count,
            total_pages: departments.total_pages
          }
        }, status: :ok
      end

      def show
        render json: @department.as_json(include: { country: { only: [ :id, :name, :code ] } }), status: :ok
      end

      def create
        department = Department.new(department_params)

        if department.save
          render json: department.as_json(include: { country: { only: [ :id, :name, :code ] } }), status: :created
        else
          render json: { errors: department.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @department.update(department_params)
          render json: @department.as_json(include: { country: { only: [ :id, :name, :code ] } }), status: :ok
        else
          render json: { errors: @department.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        department_name = @department.name
        @department.destroy
        render json: { message: "#{department_name} has been deleted" }, status: :ok
      end

      def bulk_import
        result = Departments::ImportService.new(params[:file]).call
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

      def set_department
        @department = Department.find_by(id: params[:id])
        return if @department.present?
        render json: { error: "Department not found" }, status: :not_found
      end

      def department_params
        params.require(:department).permit(:name, :code, :country_id)
      end
    end
  end
end
