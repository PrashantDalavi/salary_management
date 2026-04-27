require "rails_helper"

RSpec.describe "Api::V1::Departments", type: :request do
  let!(:country) { create(:country, name: "India", code: "IN") }

  describe "GET /api/v1/departments" do
    before do
      create(:department, name: "Engineering", code: "ENG", country: country)
      create(:department, name: "Marketing", code: "MKT", country: country)
      create(:department, name: "Sales", code: "SAL", country: country)
    end

    it "returns paginated departments with metadata" do
      get "/api/v1/departments", params: { page: 1, per_page: 2 }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)

      expect(body["departments"].size).to eq(2)
      expect(body["pagination"]).to include(
        "current_page" => 1,
        "per_page" => 2,
        "total_count" => 3,
        "total_pages" => 2
      )
    end

    it "falls back to default pagination for invalid page/per_page" do
      get "/api/v1/departments", params: { page: 0, per_page: 0 }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["pagination"]["current_page"]).to eq(1)
      expect(body["pagination"]["per_page"]).to eq(10)
    end

    it "includes country data in each department" do
      get "/api/v1/departments"

      body = JSON.parse(response.body)
      department = body["departments"].first
      expect(department["country"]).to be_present
      expect(department["country"]["name"]).to eq("India")
      expect(department["country"]["code"]).to eq("IN")
    end

    it "returns departments sorted by id" do
      get "/api/v1/departments"

      body = JSON.parse(response.body)
      ids = body["departments"].map { |d| d["id"] }
      expect(ids).to eq(ids.sort)
    end
  end

  describe "GET /api/v1/departments/:id" do
    let!(:department) { create(:department, name: "Engineering", code: "ENG", country: country) }

    it "returns the requested department" do
      get "/api/v1/departments/#{department.id}"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)

      expect(body["id"]).to eq(department.id)
      expect(body["name"]).to eq("Engineering")
      expect(body["code"]).to eq("ENG")
      expect(body["country"]["name"]).to eq("India")
    end

    it "returns not found when id does not exist" do
      get "/api/v1/departments/999999"

      expect(response).to have_http_status(:not_found)
      body = JSON.parse(response.body)
      expect(body["error"]).to eq("Department not found")
    end
  end

  describe "POST /api/v1/departments" do
    let(:valid_params) { { department: { name: "Finance", code: "FIN", country_id: country.id } } }
    let(:invalid_params) { { department: { name: "", code: "" } } }

    it "creates a department with valid params" do
      expect do
        post "/api/v1/departments", params: valid_params, as: :json
      end.to change(Department, :count).by(1)

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body["name"]).to eq("Finance")
      expect(body["code"]).to eq("FIN")
      expect(body["country"]["name"]).to eq("India")
    end

    it "returns validation errors for invalid params" do
      post "/api/v1/departments", params: invalid_params, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      body = JSON.parse(response.body)
      expect(body["errors"]).to include("Name can't be blank")
      expect(body["errors"]).to include("Code can't be blank")
    end

    it "returns error for duplicate name in same country" do
      create(:department, name: "Engineering", code: "ENG", country: country)

      post "/api/v1/departments", params: { department: { name: "Engineering", code: "ENG2", country_id: country.id } }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      body = JSON.parse(response.body)
      expect(body["errors"]).to include("Name has already been taken")
    end

    it "allows same name in different country" do
      create(:department, name: "Engineering", code: "ENG", country: country)
      japan = create(:country, name: "Japan", code: "JP")

      expect do
        post "/api/v1/departments", params: { department: { name: "Engineering", code: "ENG", country_id: japan.id } }, as: :json
      end.to change(Department, :count).by(1)

      expect(response).to have_http_status(:created)
    end
  end

  describe "PATCH /api/v1/departments/:id" do
    let!(:department) { create(:department, name: "Engineering", code: "ENG", country: country) }

    it "updates the department name" do
      patch "/api/v1/departments/#{department.id}", params: { department: { name: "Software Engineering" } }, as: :json

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["name"]).to eq("Software Engineering")
      expect(department.reload.name).to eq("Software Engineering")
    end

    it "updates the department code" do
      patch "/api/v1/departments/#{department.id}", params: { department: { code: "SENG" } }, as: :json

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["code"]).to eq("SENG")
    end

    it "updates the department country" do
      japan = create(:country, name: "Japan", code: "JP")
      patch "/api/v1/departments/#{department.id}", params: { department: { country_id: japan.id } }, as: :json

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["country"]["name"]).to eq("Japan")
    end

    it "returns validation errors for invalid update" do
      patch "/api/v1/departments/#{department.id}", params: { department: { name: "" } }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      body = JSON.parse(response.body)
      expect(body["errors"]).to include("Name can't be blank")
    end
  end

  describe "DELETE /api/v1/departments/:id" do
    let!(:department) { create(:department, name: "Engineering", code: "ENG", country: country) }

    it "deletes the department" do
      expect do
        delete "/api/v1/departments/#{department.id}"
      end.to change(Department, :count).by(-1)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["message"]).to eq("Engineering has been deleted")
    end

    it "returns not found for non-existent department" do
      delete "/api/v1/departments/999999"

      expect(response).to have_http_status(:not_found)
    end
  end
end
