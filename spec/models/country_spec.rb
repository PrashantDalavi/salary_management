require 'rails_helper'

RSpec.describe Country, type: :model do
  describe 'database schema' do
    it { is_expected.to have_db_column(:name).of_type(:string).with_options(null: false) }
    it { is_expected.to have_db_column(:code).of_type(:string).with_options(null: false) }
    it { is_expected.to have_db_column(:created_at).of_type(:datetime) }
    it { is_expected.to have_db_column(:updated_at).of_type(:datetime) }
  end

  describe 'indexes' do
    it { is_expected.to have_db_index([:name, :code]).unique(true) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:code) }

    it 'validates uniqueness of name scoped to code' do
      create(:country, name: 'United States', code: 'US')
      expect(build(:country, name: 'United States', code: 'US')).to be_invalid
      expect(build(:country, name: 'United States', code: 'CA')).to be_valid
    end
  end
end
