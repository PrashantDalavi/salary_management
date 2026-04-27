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
end
