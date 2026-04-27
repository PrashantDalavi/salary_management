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
end
