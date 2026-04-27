FactoryBot.define do
  factory :employee do
    sequence(:first_name) { |n| "John#{n}" }
    sequence(:last_name) { |n| "Doe#{n}" }
    sequence(:email) { |n| "employee#{n}@example.com" }
    sequence(:employee_code) { |n| "EMP#{n.to_s.rjust(4, '0')}" }
    job_title { "Software Engineer" }
    hire_date { Date.today }
    salary { 50000.00 }
    currency { "INR" }
    active { true }
    country
    department
  end
end
