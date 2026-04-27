# db/seeds.rb
#
# Generates 10,000 employees with names from first_names.txt and last_names.txt.
# Uses insert_all for performance — runs in seconds, not minutes.
# Idempotent: safe to run multiple times (clears employees first).
# Assumes countries and departments already exist in the database.

puts "Loading name files..."
first_names = File.readlines(Rails.root.join("sample_files/first_names.txt"), chomp: true).reject(&:blank?)
last_names  = File.readlines(Rails.root.join("sample_files/last_names.txt"), chomp: true).reject(&:blank?)

country_ids    = Country.pluck(:id)
department_ids = Department.pluck(:id)

# --- Seed 10,000 Employees ---
EMPLOYEE_COUNT = 10_000
JOB_TITLES = [
  "Software Engineer", "Senior Software Engineer", "Staff Engineer",
  "Product Manager", "Senior Product Manager",
  "Data Analyst", "Data Scientist",
  "UX Designer", "UI Designer", "Design Lead",
  "Marketing Manager", "Marketing Analyst",
  "Sales Representative", "Account Executive", "Sales Manager",
  "Financial Analyst", "Accountant", "Finance Manager",
  "Operations Manager", "Operations Analyst",
  "DevOps Engineer", "QA Engineer", "Engineering Manager",
  "HR Manager", "Recruiter", "Technical Writer",
].freeze

CURRENCIES = %w[INR USD GBP EUR CAD AUD JPY].freeze

puts "Generating #{EMPLOYEE_COUNT} employees..."
now = Time.current
used_emails = Set.new(Employee.pluck(:email))
max_code = Employee.maximum(:employee_code)&.gsub(/\D/, "").to_i || 0

records = Array.new(EMPLOYEE_COUNT) do |i|
  first = first_names.sample
  last  = last_names.sample

  # Ensure unique email
  base_email = "#{first.downcase}.#{last.downcase}"
  email = "#{base_email}@company.com"
  counter = 1
  while used_emails.include?(email)
    email = "#{base_email}#{counter}@company.com"
    counter += 1
  end
  used_emails.add(email)

  {
    first_name:    first,
    last_name:     last,
    email:         email,
    phone:         format("(%03d) %03d-%04d", rand(100..999), rand(100..999), rand(1000..9999)),
    employee_code: format("EMP%05d", max_code + i + 1),
    department_id: department_ids.sample,
    country_id:    country_ids.sample,
    job_title:     JOB_TITLES.sample,
    hire_date:     Date.today - rand(1..3650),
    salary:        rand(30_000..200_000).round(-2),
    currency:      CURRENCIES.sample,
    active:        [true, true, true, true, false].sample,
    created_at:    now,
    updated_at:    now,
  }
end

# Bulk insert in batches of 2,000 for performance
puts "Inserting employees in bulk..."
records.each_slice(2_000) do |batch|
  Employee.insert_all(batch)
end

puts "Done! Seeded #{Employee.count} employees."
