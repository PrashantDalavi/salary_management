require 'rails_helper'

RSpec.describe "Api::V1::Insights", type: :request do
  let!(:india) { create(:country, name: "India", code: "IN") }
  let!(:germany) { create(:country, name: "Germany", code: "DE") }
  let!(:eng_in) { create(:department, name: "Engineering", code: "ENG1", country: india) }
  let!(:sales_de) { create(:department, name: "Sales", code: "SAL", country: germany) }

  before do
    create(:employee, email: "a@co.com", salary: 100000, job_title: "Engineer", department: eng_in, country: india)
    create(:employee, email: "b@co.com", salary: 150000, job_title: "Senior Engineer", department: eng_in, country: india)
    create(:employee, email: "c@co.com", salary: 80000, job_title: "Sales Rep", department: sales_de, country: germany)
  end

  describe "GET /api/v1/salary_insights" do
    it "returns overall stats" do
      get api_v1_salary_insights_path
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)

      overall = json["overall"]
      expect(overall["total_employees"]).to eq(3)
      expect(overall["min_salary"].to_f).to eq(80000.0)
      expect(overall["max_salary"].to_f).to eq(150000.0)
      expect(overall["total_countries"]).to eq(2)
      expect(overall["total_departments"]).to eq(2)
    end

    it "counts departments by unique name, not by id" do
      # Add Engineering in Germany too — same name, different id
      eng_de = create(:department, name: "Engineering", code: "ENG2", country: germany)
      create(:employee, email: "d@co.com", salary: 90000, job_title: "DevOps", department: eng_de, country: germany)
      get api_v1_salary_insights_path
      json = JSON.parse(response.body)
      # 3 department records but only 2 unique names (Engineering, Sales)
      expect(json["overall"]["total_departments"]).to eq(2)
    end

    it "returns country breakdown" do
      get api_v1_salary_insights_path
      json = JSON.parse(response.body)
      countries = json["by_country"]
      india_row = countries.find { |c| c["country"] == "India" }
      expect(india_row["employee_count"]).to eq(2)
      expect(india_row["min_salary"].to_f).to eq(100000.0)
      expect(india_row["max_salary"].to_f).to eq(150000.0)
    end

    it "returns job title breakdown" do
      get api_v1_salary_insights_path
      json = JSON.parse(response.body)
      jobs = json["by_job_title"]
      expect(jobs.size).to eq(3)
      expect(jobs.map { |j| j["job_title"] }).to include("Engineer", "Senior Engineer", "Sales Rep")
    end

    it "filters by country_id" do
      get api_v1_salary_insights_path, params: { country_id: india.id }
      json = JSON.parse(response.body)
      expect(json["overall"]["total_employees"]).to eq(2)
      expect(json["by_country"].size).to eq(1)
      expect(json["by_country"].first["country"]).to eq("India")
    end

    it "returns zeros when no employees match filter" do
      empty_country = create(:country, name: "Japan", code: "JP")
      get api_v1_salary_insights_path, params: { country_id: empty_country.id }
      json = JSON.parse(response.body)
      expect(json["overall"]["total_employees"]).to eq(0)
      expect(json["by_country"]).to be_empty
      expect(json["by_job_title"]).to be_empty
    end
  end
end
