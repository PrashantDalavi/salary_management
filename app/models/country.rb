class Country < ApplicationRecord
  validates :name, :code, presence: true
  validates :name, uniqueness: { scope: :code }
end
