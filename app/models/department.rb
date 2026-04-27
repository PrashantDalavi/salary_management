class Department < ApplicationRecord
  belongs_to :country
  has_many :employees

  validates :name, presence: true, uniqueness: { scope: :country_id }
  validates :code, presence: true

  def self.search(query)
    return all if query.blank?

    joins(:country).where(
      "departments.name ILIKE :q OR countries.name ILIKE :q",
      q: "%#{query}%"
    )
  end
end
