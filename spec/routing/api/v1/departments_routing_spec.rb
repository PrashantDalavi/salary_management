require "rails_helper"

RSpec.describe Api::V1::DepartmentsController, type: :routing do
  describe "routing" do
    it "routes GET /api/v1/departments to departments#index" do
      expect(get: "/api/v1/departments").to route_to(
        controller: "api/v1/departments",
        action: "index"
      )
    end

    it "routes GET /api/v1/departments/:id to departments#show" do
      expect(get: "/api/v1/departments/1").to route_to(
        controller: "api/v1/departments",
        action: "show",
        id: "1"
      )
    end

    it "routes POST /api/v1/departments to departments#create" do
      expect(post: "/api/v1/departments").to route_to(
        controller: "api/v1/departments",
        action: "create"
      )
    end

    it "routes PATCH /api/v1/departments/:id to departments#update" do
      expect(patch: "/api/v1/departments/1").to route_to(
        controller: "api/v1/departments",
        action: "update",
        id: "1"
      )
    end

    it "routes PUT /api/v1/departments/:id to departments#update" do
      expect(put: "/api/v1/departments/1").to route_to(
        controller: "api/v1/departments",
        action: "update",
        id: "1"
      )
    end

    it "routes DELETE /api/v1/departments/:id to departments#destroy" do
      expect(delete: "/api/v1/departments/1").to route_to(
        controller: "api/v1/departments",
        action: "destroy",
        id: "1"
      )
    end
  end
end
