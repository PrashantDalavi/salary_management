FactoryBot.define do
  factory :department do
    sequence(:name) { |n| "Department #{n}" }
    sequence(:code) { |n| "DEPT#{n}" }
    country
  end
end
