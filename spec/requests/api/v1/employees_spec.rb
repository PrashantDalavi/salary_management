require 'rails_helper'

RSpec.describe "Api::V1::Employees", type: :request do
  let!(:country) { create(:country, name: "India", code: "IN") }
  let!(:department) { create(:department, name: "Engineering", code: "ENG", country: country) }

  describe "GET /api/v1/employees" do
    before do
      create(:employee, first_name: "Alice", last_name: "Smith", email: "alice@co.com", department: department, country: country, salary: 80000)
      create(:employee, first_name: "Bob", last_name: "Jones", email: "bob@co.com", department: department, country: country, salary: 120000)
      create(:employee, first_name: "Charlie", last_name: "Brown", email: "charlie@co.com", department: department, country: country, salary: 95000)
    end

    it "returns paginated employees" do
      get "/api/v1/employees", params: { page: 1, per_page: 2 }
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["employees"].size).to eq(2)
      expect(json["total"]).to eq(3)
      expect(json["page"]).to eq(1)
      expect(json["total_pages"]).to eq(2)
    end

    it "falls back to default pagination for invalid page/per_page" do
      get "/api/v1/employees", params: { page: 0, per_page: 0 }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["page"]).to eq(1)
      expect(json["per_page"]).to eq(10)
    end

    it "includes department and country data" do
      get "/api/v1/employees"
      
      json = JSON.parse(response.body)
      emp = json["employees"].first
      expect(emp["department"]["name"]).to be_present
      expect(emp["country"]["name"]).to be_present
      expect(emp["full_name"]).to be_present
    end
  end

  describe "GET /api/v1/employees/:id" do
    let!(:employee) { create(:employee, first_name: "Alice", last_name: "Smith", email: "alice@co.com", department: department, country: country) }

    it "returns the employee" do
      get "/api/v1/employees/#{employee.id}"
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["employee"]["first_name"]).to eq("Alice")
      expect(json["employee"]["full_name"]).to eq("Alice Smith")
    end

    it "returns not found for invalid id" do
      get "/api/v1/employees/99999"
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/employees" do
    it "creates an employee with valid params" do
      params = {
        employee: {
          first_name: "Prashant", last_name: "Dalavi", email: "prashant@co.com",
          job_title: "Lead Engineer", salary: 150000, hire_date: "2024-01-15",
          department_id: department.id, country_id: country.id
        }
      }
      
      expect {
        post "/api/v1/employees", params: params, as: :json
      }.to change(Employee, :count).by(1)
      
      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["employee"]["first_name"]).to eq("Prashant")
      expect(json["employee"]["salary"].to_f).to eq(150000.0)
    end

    it "returns errors for invalid params" do
      params = { employee: { first_name: "", email: "" } }
      
      post "/api/v1/employees", params: params, as: :json
      
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["errors"]).to be_present
    end

    it "returns error for duplicate email" do
      create(:employee, email: "taken@co.com", department: department, country: country)
      
      params = {
        employee: {
          first_name: "New", last_name: "User", email: "taken@co.com",
          job_title: "Engineer", salary: 80000, hire_date: "2024-01-01",
          department_id: department.id, country_id: country.id
        }
      }
      
      post "/api/v1/employees", params: params, as: :json
      
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "PATCH /api/v1/employees/:id" do
    let!(:employee) { create(:employee, first_name: "Alice", salary: 80000, department: department, country: country) }

    it "updates the employee" do
      params = { employee: { salary: 95000, job_title: "Senior Engineer" } }
      
      patch "/api/v1/employees/#{employee.id}", params: params, as: :json
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["employee"]["salary"].to_f).to eq(95000.0)
      expect(json["employee"]["job_title"]).to eq("Senior Engineer")
    end

    it "returns errors for invalid params" do
      params = { employee: { email: "" } }
      
      patch "/api/v1/employees/#{employee.id}", params: params, as: :json
      
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "DELETE /api/v1/employees/:id" do
    let!(:employee) { create(:employee, department: department, country: country) }

    it "deletes the employee" do
      expect {
        delete "/api/v1/employees/#{employee.id}", as: :json
      }.to change(Employee, :count).by(-1)
      
      expect(response).to have_http_status(:ok)
    end
  end

  describe "POST /api/v1/employees/bulk_import" do
    before do
      create(:country, name: "Germany", code: "DE")
    end

    def upload_csv(content)
      tempfile = Tempfile.new(["employees", ".csv"])
      tempfile.write(content)
      tempfile.rewind
      Rack::Test::UploadedFile.new(tempfile.path, "text/csv", false, original_filename: "employees.csv")
    end

    it "imports employees from a CSV file" do
      csv = "first_name,last_name,email,job_title,salary,hire_date,country_code,department_code\n"
      csv += "Alice,Smith,alice@import.com,Engineer,80000,2024-01-15,IN,ENG\n"
      csv += "Bob,Jones,bob@import.com,Designer,70000,2024-03-01,IN,ENG\n"
      file = upload_csv(csv)
      expect {
        post "/api/v1/employees/bulk_import", params: { file: file }
      }.to change(Employee, :count).by(2)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["message"]).to eq("Import completed")
      expect(json["imported"]).to eq(2)
    end

    it "updates existing employees on re-import" do
      create(:employee, email: "alice@import.com", first_name: "Alice", last_name: "Smith",
             job_title: "Junior", salary: 50000, hire_date: "2024-01-15",
             department: department, country: country)
      csv = "first_name,last_name,email,job_title,salary,hire_date,country_code,department_code\n"
      csv += "Alice,Smith,alice@import.com,Senior Engineer,90000,2024-01-15,IN,ENG\n"
      file = upload_csv(csv)
      expect {
        post "/api/v1/employees/bulk_import", params: { file: file }
      }.not_to change(Employee, :count)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["updated"]).to eq(1)
      expect(Employee.find_by(email: "alice@import.com").job_title).to eq("Senior Engineer")
    end

    it "reports error for unknown country code" do
      csv = "first_name,last_name,email,job_title,salary,hire_date,country_code,department_code\n"
      csv += "Alice,Smith,alice@import.com,Engineer,80000,2024-01-15,XX,ENG\n"
      file = upload_csv(csv)
      post "/api/v1/employees/bulk_import", params: { file: file }
      json = JSON.parse(response.body)
      expect(json["errors"]).to include(match(/Country 'XX' not found/))
    end

    it "returns error when no file is provided" do
      post "/api/v1/employees/bulk_import"
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["message"]).to eq("Import failed")
    end

    it "rejects files with invalid extensions" do
      tempfile = Tempfile.new(["employees", ".txt"])
      tempfile.write("data")
      tempfile.rewind
      file = Rack::Test::UploadedFile.new(tempfile.path, "text/plain", false, original_filename: "employees.txt")
      post "/api/v1/employees/bulk_import", params: { file: file }
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["errors"]).to include(match(/Invalid file format/))
    end
  end
end
