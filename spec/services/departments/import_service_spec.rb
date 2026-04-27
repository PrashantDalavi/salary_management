require "rails_helper"

RSpec.describe Departments::ImportService do
  let!(:india) { create(:country, name: "India", code: "IN") }
  let!(:germany) { create(:country, name: "Germany", code: "DE") }

  let(:csv_content) { "name,code,country_code\nEngineering,ENG,IN\nMarketing,MKT,DE\nSales,SAL,IN\n" }
  let(:file) { create_uploaded_file(csv_content, "departments.csv", "text/csv") }

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
    it "imports departments from a valid CSV file" do
      result = described_class.new(file).call
      expect(result[:success]).to be true
      expect(result[:imported]).to eq(3)
      expect(result[:skipped]).to eq(0)
      expect(Department.count).to eq(3)
    end

    it "skips duplicate departments on re-import" do
      create(:department, name: "Engineering", code: "ENG", country: india)
      result = described_class.new(file).call
      expect(result[:success]).to be true
      expect(result[:imported]).to eq(2)
      expect(result[:skipped]).to eq(1)
    end

    it "updates department when code differs" do
      create(:department, name: "Engineering", code: "OLD", country: india)
      result = described_class.new(file).call
      expect(result[:success]).to be true
      expect(result[:updated]).to eq(1)
      expect(result[:imported]).to eq(2)
      expect(Department.find_by(name: "Engineering", country: india).code).to eq("ENG")
    end

    it "reports error for unknown country code" do
      csv = "name,code,country_code\nEngineering,ENG,XX\n"
      bad_file = create_uploaded_file(csv, "departments.csv", "text/csv")
      result = described_class.new(bad_file).call
      expect(result[:success]).to be true
      expect(result[:imported]).to eq(0)
      expect(result[:errors]).to include(match(/Country with code 'XX' not found/))
    end

    it "returns errors for missing file" do
      result = described_class.new(nil).call
      expect(result[:success]).to be false
      expect(result[:errors]).to include("No file provided")
    end

    it "returns errors for invalid file format" do
      bad_file = create_uploaded_file("data", "departments.txt", "text/plain")
      result = described_class.new(bad_file).call
      expect(result[:success]).to be false
      expect(result[:errors]).to include(match(/Invalid file format/))
    end

    it "returns errors for missing required headers" do
      bad_csv = "dept_name,dept_code\nEngineering,ENG\n"
      bad_file = create_uploaded_file(bad_csv, "departments.csv", "text/csv")
      result = described_class.new(bad_file).call
      expect(result[:success]).to be false
      expect(result[:errors]).to include(match(/Missing required columns/))
    end

    it "skips blank rows" do
      csv = "name,code,country_code\nEngineering,ENG,IN\n,,\nSales,SAL,IN\n"
      file_with_blanks = create_uploaded_file(csv, "departments.csv", "text/csv")
      result = described_class.new(file_with_blanks).call
      expect(result[:success]).to be true
      expect(result[:imported]).to eq(2)
    end
  end
end
