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

  describe '.search' do
    let!(:india) { create(:country, name: 'India', code: 'IN') }
    let!(:indonesia) { create(:country, name: 'Indonesia', code: 'ID') }
    let!(:usa) { create(:country, name: 'United States', code: 'US') }

    it 'returns all countries when query is blank' do
      expect(Country.search(nil)).to contain_exactly(india, indonesia, usa)
      expect(Country.search('')).to contain_exactly(india, indonesia, usa)
    end

    it 'searches by name (case-insensitive)' do
      results = Country.search('india')
      expect(results).to include(india)
      expect(results).not_to include(usa)
    end

    it 'searches by code (case-insensitive)' do
      results = Country.search('us')
      expect(results).to include(usa)
      expect(results).not_to include(india)
    end

    it 'performs partial matching' do
      results = Country.search('ind')
      expect(results).to include(india, indonesia)
      expect(results).not_to include(usa)
    end

    it 'is case-insensitive' do
      expect(Country.search('INDIA')).to include(india)
      expect(Country.search('India')).to include(india)
      expect(Country.search('iNdIa')).to include(india)
    end

    it 'returns empty when no match' do
      expect(Country.search('xyz')).to be_empty
    end
  end
end
