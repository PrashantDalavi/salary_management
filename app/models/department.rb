class Department < ApplicationRecord
  belongs_to :country

  validates :name, presence: true, uniqueness: { scope: :country_id }
  validates :code, presence: true
end
