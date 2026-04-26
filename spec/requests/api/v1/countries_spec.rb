require "rails_helper"

RSpec.describe "Api::V1::Countries", type: :request do
  describe "GET /api/v1/countries" do
    it "returns paginated countries with metadata" do
      create(:country, name: "India", code: "IN")
      create(:country, name: "United States", code: "US")
      create(:country, name: "Canada", code: "CA")

      get "/api/v1/countries", params: { page: 1, per_page: 2 }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)

      expect(body["countries"].size).to eq(2)
      expect(body["pagination"]).to include(
        "current_page" => 1,
        "per_page" => 2,
        "total_count" => 3,
        "total_pages" => 2
      )
    end

    it "falls back to default pagination for invalid page/per_page" do
      create(:country, name: "India", code: "IN")

      get "/api/v1/countries", params: { page: 0, per_page: 0 }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["pagination"]["current_page"]).to eq(1)
      expect(body["pagination"]["per_page"]).to eq(10)
    end
  end

  describe "GET /api/v1/countries/:id" do
    it "returns the requested country" do
      country = create(:country, name: "Canada", code: "CA")

      get "/api/v1/countries/#{country.id}"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)

      expect(body["id"]).to eq(country.id)
      expect(body["name"]).to eq("Canada")
      expect(body["code"]).to eq("CA")
    end

    it "returns not found when id does not exist" do
      get "/api/v1/countries/999999"

      expect(response).to have_http_status(:not_found)
      body = JSON.parse(response.body)
      expect(body["error"]).to eq("Country not found")
    end
  end

  describe "POST /api/v1/countries" do
    let(:valid_params) { { country: { name: "Japan", code: "JP" } } }
    let(:invalid_params) { { country: { name: "", code: "" } } }

    it "creates a country" do
      expect do
        post "/api/v1/countries", params: valid_params
      end.to change(Country, :count).by(1)

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body["name"]).to eq("Japan")
      expect(body["code"]).to eq("JP")
    end

    it "returns validation errors for invalid params" do
      post "/api/v1/countries", params: invalid_params

      expect(response).to have_http_status(:unprocessable_entity)
      body = JSON.parse(response.body)
      expect(body["errors"]).to include("Name can't be blank", "Code can't be blank")
    end
  end

  describe "PUT /api/v1/countries/:id" do
    it "updates a country" do
      country = create(:country, name: "Germany", code: "DE")

      put "/api/v1/countries/#{country.id}", params: { country: { name: "Deutschland", code: "DE" } }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["name"]).to eq("Deutschland")
      expect(country.reload.name).to eq("Deutschland")
    end

    it "returns validation errors for invalid update" do
      country = create(:country, name: "France", code: "FR")

      put "/api/v1/countries/#{country.id}", params: { country: { name: "", code: "" } }

      expect(response).to have_http_status(:unprocessable_entity)
      body = JSON.parse(response.body)
      expect(body["errors"]).to include("Name can't be blank", "Code can't be blank")
    end
  end

  describe "DELETE /api/v1/countries/:id" do
    it "deletes the country" do
      country = create(:country, name: "Australia", code: "AU")

      expect do
        delete "/api/v1/countries/#{country.id}"
      end.to change(Country, :count).by(-1)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["message"]).to eq("Australia has been deleted")
    end
  end
end
