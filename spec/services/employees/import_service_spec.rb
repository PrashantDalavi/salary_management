require 'rails_helper'

RSpec.describe Employees::ImportService do
  let!(:country) { create(:country, name: "India", code: "IN") }
  let!(:department) { create(:department, name: "Engineering", code: "ENG", country: country) }

  let(:csv_content) do
    "first_name,last_name,email,job_title,salary,hire_date,country_code,department_code\n" \
    "Alice,Smith,alice@test.com,Engineer,80000,2024-01-15,IN,ENG\n" \
    "Bob,Jones,bob@test.com,Designer,70000,2024-03-01,IN,ENG\n"
  end
  let(:file) { create_uploaded_file(csv_content, "employees.csv", "text/csv") }

  def create_uploaded_file(content, filename, content_type)
    tempfile = Tempfile.new([filename, File.extname(filename)])
    tempfile.write(content)
    tempfile.rewind
    ActionDispatch::Http::UploadedFile.new(
      tempfile: tempfile,
      filename: filename,
      type: content_type
    )
  end

  describe "#call" do
    it "bulk imports employees from a valid CSV file" do
      result = described_class.new(file).call
      expect(result[:success]).to be true
      expect(result[:imported]).to eq(2)
      expect(result[:skipped]).to eq(0)
      expect(Employee.count).to eq(2)
    end

    it "uses bulk insert (insert_all) for new records" do
      expect(Employee).to receive(:insert_all).once.and_call_original
      described_class.new(file).call
    end

    it "updates existing employees via upsert_all" do
      create(:employee, email: "alice@test.com", first_name: "Alice", last_name: "Smith",
             job_title: "Junior", salary: 50000, hire_date: "2024-01-15",
             department: department, country: country)
      result = described_class.new(file).call
      expect(result[:success]).to be true
      expect(result[:updated]).to eq(1)
      expect(result[:imported]).to eq(1)
    end

    it "reports error for unknown country code" do
      csv = "first_name,last_name,email,job_title,salary,hire_date,country_code,department_code\n" \
            "Alice,Smith,alice@test.com,Engineer,80000,2024-01-15,XX,ENG\n"
      bad_file = create_uploaded_file(csv, "employees.csv", "text/csv")
      result = described_class.new(bad_file).call
      expect(result[:errors]).to include(match(/Country 'XX' not found/))
    end

    it "reports error for unknown department code" do
      csv = "first_name,last_name,email,job_title,salary,hire_date,country_code,department_code\n" \
            "Alice,Smith,alice@test.com,Engineer,80000,2024-01-15,IN,UNKNOWN\n"
      bad_file = create_uploaded_file(csv, "employees.csv", "text/csv")
      result = described_class.new(bad_file).call
      expect(result[:errors]).to include(match(/Department 'UNKNOWN' not found/))
    end

    it "validates required fields in-memory" do
      csv = "first_name,last_name,email,job_title,salary,hire_date,country_code,department_code\n" \
            ",Smith,alice@test.com,Engineer,80000,2024-01-15,IN,ENG\n"
      bad_file = create_uploaded_file(csv, "employees.csv", "text/csv")
      result = described_class.new(bad_file).call
      expect(result[:errors]).to include(match(/Missing first_name/))
    end

    it "handles duplicate emails within the same file" do
      csv = "first_name,last_name,email,job_title,salary,hire_date,country_code,department_code\n" \
            "Alice,Smith,alice@test.com,Engineer,80000,2024-01-15,IN,ENG\n" \
            "Alice,Smith,alice@test.com,Senior Engineer,90000,2024-01-15,IN,ENG\n"
      dup_file = create_uploaded_file(csv, "employees.csv", "text/csv")
      result = described_class.new(dup_file).call
      expect(result[:imported]).to eq(1)
      expect(result[:updated]).to eq(1)
    end

    it "returns errors for missing file" do
      result = described_class.new(nil).call
      expect(result[:success]).to be false
      expect(result[:errors]).to include("No file provided")
    end

    it "returns errors for invalid file format" do
      bad_file = create_uploaded_file("data", "employees.txt", "text/plain")
      result = described_class.new(bad_file).call
      expect(result[:success]).to be false
      expect(result[:errors]).to include(match(/Invalid file format/))
    end

    it "returns errors for missing required headers" do
      bad_csv = "name,title\nAlice,Engineer\n"
      bad_file = create_uploaded_file(bad_csv, "employees.csv", "text/csv")
      result = described_class.new(bad_file).call
      expect(result[:success]).to be false
      expect(result[:errors]).to include(match(/Missing required columns/))
    end

    it "skips blank rows" do
      csv = "first_name,last_name,email,job_title,salary,hire_date,country_code,department_code\n" \
            "Alice,Smith,alice@test.com,Engineer,80000,2024-01-15,IN,ENG\n" \
            ",,,,,,,\n" \
            "Bob,Jones,bob@test.com,Designer,70000,2024-03-01,IN,ENG\n"
      file_with_blanks = create_uploaded_file(csv, "employees.csv", "text/csv")
      result = described_class.new(file_with_blanks).call
      expect(result[:success]).to be true
      expect(result[:imported]).to eq(2)
    end
  end
end
