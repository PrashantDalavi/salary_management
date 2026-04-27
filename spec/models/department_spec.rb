require "rails_helper"

RSpec.describe Department, type: :model do
  describe "database schema" do
    it { is_expected.to have_db_column(:name).of_type(:string).with_options(null: false) }
    it { is_expected.to have_db_column(:code).of_type(:string).with_options(null: false) }
    it { is_expected.to have_db_column(:country_id).of_type(:integer).with_options(null: false) }
    it { is_expected.to have_db_column(:created_at).of_type(:datetime) }
    it { is_expected.to have_db_column(:updated_at).of_type(:datetime) }
  end

  describe "indexes" do
    it { is_expected.to have_db_index([:name, :country_id]).unique(true) }
    it { is_expected.to have_db_index(:code) }
    it { is_expected.to have_db_index(:country_id) }
  end

  describe "associations" do
    it { is_expected.to belong_to(:country) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:code) }

    it "validates uniqueness of name scoped to country_id" do
      country = create(:country, name: "India", code: "IN")
      create(:department, name: "Engineering", code: "ENG", country: country)

      expect(build(:department, name: "Engineering", code: "ENG2", country: country)).to be_invalid
      expect(build(:department, name: "Engineering", code: "ENG", country: create(:country, name: "Japan", code: "JP"))).to be_valid
    end

    it "requires a valid country" do
      department = build(:department, country: nil)
      expect(department).to be_invalid
    end
  end

  describe ".search" do
    let!(:india) { create(:country, name: "India", code: "IN") }
    let!(:usa) { create(:country, name: "United States", code: "US") }
    let!(:engineering) { create(:department, name: "Engineering", code: "ENG", country: india) }
    let!(:marketing) { create(:department, name: "Marketing", code: "MKT", country: usa) }
    let!(:sales) { create(:department, name: "Sales", code: "SAL", country: india) }

    it "returns all departments when query is blank" do
      expect(Department.search(nil)).to contain_exactly(engineering, marketing, sales)
      expect(Department.search("")).to contain_exactly(engineering, marketing, sales)
    end

    it "searches by department name (case-insensitive)" do
      results = Department.search("engineering")
      expect(results).to include(engineering)
      expect(results).not_to include(marketing, sales)
    end

    it "searches by country name (case-insensitive)" do
      results = Department.search("india")
      expect(results).to include(engineering, sales)
      expect(results).not_to include(marketing)
    end

    it "performs partial matching on department name" do
      results = Department.search("eng")
      expect(results).to include(engineering)
      expect(results).not_to include(marketing, sales)
    end

    it "performs partial matching on country name" do
      results = Department.search("united")
      expect(results).to include(marketing)
      expect(results).not_to include(engineering, sales)
    end

    it "is case-insensitive" do
      expect(Department.search("ENGINEERING")).to include(engineering)
      expect(Department.search("Engineering")).to include(engineering)
      expect(Department.search("eNgInEeRiNg")).to include(engineering)
    end

    it "returns empty when no match" do
      expect(Department.search("xyz")).to be_empty
    end

    it "matches across name or country" do
      results = Department.search("sal")
      expect(results).to include(sales)
      expect(results).not_to include(marketing)
    end
  end
end
