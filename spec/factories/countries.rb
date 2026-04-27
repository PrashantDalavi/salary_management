FactoryBot.define do
  factory :country do
    name { Faker::Address.country }
    code { Faker::Address.country_code.first(2).upcase }
  end
end
