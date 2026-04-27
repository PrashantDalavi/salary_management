require "rails_helper"

RSpec.describe Employee, type: :model do
  describe "database schema" do
    it { is_expected.to have_db_column(:first_name).of_type(:string).with_options(null: false) }
    it { is_expected.to have_db_column(:last_name).of_type(:string).with_options(null: false) }
    it { is_expected.to have_db_column(:email).of_type(:string).with_options(null: false) }
    it { is_expected.to have_db_column(:phone).of_type(:string) }
    it { is_expected.to have_db_column(:employee_code).of_type(:string) }
    it { is_expected.to have_db_column(:department_id).of_type(:integer).with_options(null: false) }
    it { is_expected.to have_db_column(:country_id).of_type(:integer).with_options(null: false) }
    it { is_expected.to have_db_column(:job_title).of_type(:string).with_options(null: false) }
    it { is_expected.to have_db_column(:hire_date).of_type(:date).with_options(null: false) }
    it { is_expected.to have_db_column(:salary).of_type(:decimal).with_options(null: false, precision: 12, scale: 2) }
    it { is_expected.to have_db_column(:currency).of_type(:string).with_options(default: "INR") }
    it { is_expected.to have_db_column(:active).of_type(:boolean).with_options(default: true) }
    it { is_expected.to have_db_column(:created_at).of_type(:datetime) }
    it { is_expected.to have_db_column(:updated_at).of_type(:datetime) }
  end

  describe "indexes" do
    it { is_expected.to have_db_index(:email).unique(true) }
    it { is_expected.to have_db_index(:employee_code).unique(true) }
    it { is_expected.to have_db_index(:department_id) }
    it { is_expected.to have_db_index(:country_id) }
  end

  describe "associations" do
    it { is_expected.to belong_to(:country) }
    it { is_expected.to belong_to(:department) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:first_name) }
    it { is_expected.to validate_presence_of(:last_name) }
    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_presence_of(:job_title) }
    it { is_expected.to validate_presence_of(:hire_date) }
    it { is_expected.to validate_presence_of(:salary) }

    it "validates uniqueness of email" do
      create(:employee)
      expect(build(:employee, email: Employee.first.email)).to be_invalid
    end

    it "validates uniqueness of employee_code" do
      emp = create(:employee, employee_code: "EMP001")
      expect(build(:employee, employee_code: "EMP001")).to be_invalid
    end

    it "allows blank employee_code" do
      expect(build(:employee, employee_code: nil)).to be_valid
      expect(build(:employee, employee_code: "")).to be_valid
    end

    it "validates salary is not negative" do
      expect(build(:employee, salary: -1)).to be_invalid
    end

    it "validates salary of zero is valid" do
      expect(build(:employee, salary: 0)).to be_valid
    end

    it "requires a valid country" do
      expect(build(:employee, country: nil)).to be_invalid
    end

    it "requires a valid department" do
      expect(build(:employee, department: nil)).to be_invalid
    end
  end
end
