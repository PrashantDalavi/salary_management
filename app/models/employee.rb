class Employee < ApplicationRecord
  belongs_to :country
  belongs_to :department

  validates :first_name, :last_name, :email, :job_title, :hire_date, :salary, presence: true
  validates :email, uniqueness: true
  validates :salary, numericality: { greater_than_or_equal_to: 0 }
  validates :employee_code, uniqueness: true, allow_blank: true

  def full_name
    "#{first_name} #{last_name}"
  end
end
