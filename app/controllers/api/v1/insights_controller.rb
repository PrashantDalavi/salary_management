module Api
  module V1
    class InsightsController < ActionController::API
      def salary
        scope = Employee.all
        scope = scope.where(country_id: params[:country_id]) if params[:country_id].present?

        render json: {
          overall: overall_stats(scope),
          by_country: country_breakdown(scope),
          by_job_title: job_title_breakdown(scope)
        }, status: :ok
      end

      private

      def overall_stats(scope)
        result = scope.pick(
          Arel.sql("COUNT(*)"),
          Arel.sql("COALESCE(ROUND(AVG(salary), 2), 0)"),
          Arel.sql("COALESCE(MIN(salary), 0)"),
          Arel.sql("COALESCE(MAX(salary), 0)")
        )

        {
          total_employees: result[0],
          avg_salary: result[1].to_f,
          min_salary: result[2].to_f,
          max_salary: result[3].to_f,
          total_countries: scope.distinct.count(:country_id),
          total_departments: scope.joins(:department).distinct.count("departments.name")
        }
      end

      def country_breakdown(scope)
        scope
          .joins(:country)
          .group("countries.name")
          .order(Arel.sql("COUNT(*) DESC"))
          .pluck(
            Arel.sql("countries.name"),
            Arel.sql("COUNT(*)"),
            Arel.sql("MIN(employees.salary)"),
            Arel.sql("MAX(employees.salary)"),
            Arel.sql("ROUND(AVG(employees.salary), 2)")
          )
          .map do |name, count, min, max, avg|
            { country: name, employee_count: count, min_salary: min.to_f, max_salary: max.to_f, avg_salary: avg.to_f }
          end
      end

      def job_title_breakdown(scope)
        scope
          .joins(:country)
          .group("employees.job_title", "countries.name")
          .order(Arel.sql("ROUND(AVG(employees.salary), 2) DESC"))
          .limit(50)
          .pluck(
            Arel.sql("employees.job_title"),
            Arel.sql("countries.name"),
            Arel.sql("COUNT(*)"),
            Arel.sql("ROUND(AVG(employees.salary), 2)")
          )
          .map do |title, country, count, avg|
            { job_title: title, country: country, employee_count: count, avg_salary: avg.to_f }
          end
      end
    end
  end
end
