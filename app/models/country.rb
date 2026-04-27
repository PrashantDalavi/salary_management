class Country < ApplicationRecord
  validates :name, :code, presence: true
  validates :name, uniqueness: { scope: :code }

  def self.search(query)
    return all if query.blank?

    where("name ILIKE :q OR code ILIKE :q", q: "%#{query}%")
  end
end
