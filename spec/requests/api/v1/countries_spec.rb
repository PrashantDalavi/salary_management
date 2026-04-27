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

    it "searches countries by name" do
      create(:country, name: "India", code: "IN")
      create(:country, name: "Indonesia", code: "ID")
      create(:country, name: "United States", code: "US")

      get "/api/v1/countries", params: { search: "ind" }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      names = body["countries"].map { |c| c["name"] }
      expect(names).to include("India", "Indonesia")
      expect(names).not_to include("United States")
    end

    it "searches countries by code" do
      create(:country, name: "India", code: "IN")
      create(:country, name: "United States", code: "US")

      get "/api/v1/countries", params: { search: "US" }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      names = body["countries"].map { |c| c["name"] }
      expect(names).to include("United States")
      expect(names).not_to include("India")
    end

    it "search is case-insensitive" do
      create(:country, name: "Japan", code: "JP")

      get "/api/v1/countries", params: { search: "japan" }

      body = JSON.parse(response.body)
      expect(body["countries"].size).to eq(1)
      expect(body["countries"].first["name"]).to eq("Japan")
    end

    it "returns all countries when search is blank" do
      create(:country, name: "India", code: "IN")
      create(:country, name: "Japan", code: "JP")

      get "/api/v1/countries", params: { search: "" }

      body = JSON.parse(response.body)
      expect(body["countries"].size).to eq(2)
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

  describe "POST /api/v1/countries/bulk_import" do
    def upload_csv(content)
      tempfile = Tempfile.new(["countries", ".csv"])
      tempfile.write(content)
      tempfile.rewind
      Rack::Test::UploadedFile.new(tempfile.path, "text/csv", false, original_filename: "countries.csv")
    end

    it "imports countries from a CSV file" do
      file = upload_csv("name,code\nIndia,IN\nJapan,JP\n")
      expect {
        post bulk_import_api_v1_countries_path, params: { file: file }
      }.to change(Country, :count).by(2)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["message"]).to eq("Import completed")
      expect(json["imported"]).to eq(2)
      expect(json["updated"]).to eq(0)
      expect(json["skipped"]).to eq(0)
    end

    it "updates existing countries with changed codes" do
      create(:country, name: "India", code: "OLD")
      file = upload_csv("name,code\nIndia,IN\n")
      expect {
        post bulk_import_api_v1_countries_path, params: { file: file }
      }.not_to change(Country, :count)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["imported"]).to eq(0)
      expect(json["updated"]).to eq(1)
      expect(Country.find_by(name: "India").code).to eq("IN")
    end

    it "skips countries that already exist with the same code" do
      create(:country, name: "India", code: "IN")
      file = upload_csv("name,code\nIndia,IN\n")
      post bulk_import_api_v1_countries_path, params: { file: file }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["imported"]).to eq(0)
      expect(json["updated"]).to eq(0)
      expect(json["skipped"]).to eq(1)
    end

    it "returns error when no file is provided" do
      post bulk_import_api_v1_countries_path
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["message"]).to eq("Import failed")
      expect(json["errors"]).to include("No file provided")
    end

    it "rejects files with invalid extensions" do
      tempfile = Tempfile.new(["countries", ".txt"])
      tempfile.write("name,code\nIndia,IN\n")
      tempfile.rewind
      file = Rack::Test::UploadedFile.new(tempfile.path, "text/plain", false, original_filename: "countries.txt")
      post bulk_import_api_v1_countries_path, params: { file: file }
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["message"]).to eq("Import failed")
      expect(json["errors"]).to include(match(/Invalid file format/))
    end

    it "rejects CSV files with missing required headers" do
      file = upload_csv("wrong_header,another\nIndia,IN\n")
      post bulk_import_api_v1_countries_path, params: { file: file }
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["errors"]).to include(match(/Missing required columns/))
    end

    it "skips empty rows in the CSV" do
      file = upload_csv("name,code\nIndia,IN\n,,\nJapan,JP\n")
      expect {
        post bulk_import_api_v1_countries_path, params: { file: file }
      }.to change(Country, :count).by(2)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["imported"]).to eq(2)
    end

    it "reports row-level errors for invalid data" do
      file = upload_csv("name,code\n,IN\n")
      post bulk_import_api_v1_countries_path, params: { file: file }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["errors"].length).to be > 0
      expect(json["errors"].first).to match(/Row 2/)
    end

    it "handles mixed import — new, update, and skip in one file" do
      create(:country, name: "India", code: "IN")
      create(:country, name: "Japan", code: "OLD")
      file = upload_csv("name,code\nIndia,IN\nJapan,JP\nGermany,DE\n")
      post bulk_import_api_v1_countries_path, params: { file: file }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["imported"]).to eq(1)
      expect(json["updated"]).to eq(1)
      expect(json["skipped"]).to eq(1)
    end
  end
end
