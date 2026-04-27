module Employees
  class ImportService
    REQUIRED_HEADERS = %w[first_name last_name email job_title salary hire_date country_code department_code].freeze
    OPTIONAL_HEADERS = %w[phone employee_code currency active].freeze
    BATCH_SIZE = 1000

    def initialize(file)
      @file = file
      @errors = []
      @imported_count = 0
      @updated_count = 0
      @skipped_count = 0
    end

    def call
      validate_file!
      return failure_result if @errors.any?

      spreadsheet = open_spreadsheet
      return failure_result if @errors.any?

      headers = spreadsheet.row(1).map(&:to_s).map(&:strip).map(&:downcase)
      validate_headers!(headers)
      return failure_result if @errors.any?

      preload_lookups
      process_spreadsheet(spreadsheet, headers)
      persist_records

      success_result
    end

    private

    def validate_file!
      if @file.nil?
        @errors << "No file provided"
        return
      end

      extension = File.extname(@file.original_filename).downcase
      unless %w[.csv .xlsx .xls].include?(extension)
        @errors << "Invalid file format. Please upload a .csv, .xlsx, or .xls file"
      end
    end

    def open_spreadsheet
      extension = File.extname(@file.original_filename).downcase
      case extension
      when ".csv"  then Roo::CSV.new(@file.path)
      when ".xlsx" then Roo::Excelx.new(@file.path)
      when ".xls"  then Roo::Excel.new(@file.path)
      end
    rescue StandardError => e
      @errors << "Could not read file: #{e.message}"
      nil
    end

    def validate_headers!(headers)
      missing = REQUIRED_HEADERS - headers
      @errors << "Missing required columns: #{missing.join(', ')}" if missing.any?
    end

    def preload_lookups
      @countries = Country.all.index_by(&:code)
      @departments = Department.all.each_with_object({}) do |dept, hash|
        hash["#{dept.code}:#{dept.country_id}"] = dept
        hash[dept.code] ||= dept
      end
      @existing_emails = Employee.pluck(:email).to_set
      @new_records = []
      @update_records = []
    end

    def process_spreadsheet(spreadsheet, headers)
      indices = build_indices(headers)

      (2..spreadsheet.last_row).each do |row_number|
        row = spreadsheet.row(row_number)
        attrs = extract_row_attrs(row, indices)
        next if attrs.nil?

        validate_and_classify(row_number, attrs)
      end
    end

    def build_indices(headers)
      required = REQUIRED_HEADERS.each_with_object({}) { |h, hash| hash[h] = headers.index(h) }
      optional = OPTIONAL_HEADERS.each_with_object({}) { |h, hash| hash[h] = headers.index(h) }
      { required: required, optional: optional }
    end

    def extract_row_attrs(row, indices)
      req = indices[:required]
      opt = indices[:optional]

      attrs = {
        first_name: row[req["first_name"]]&.to_s&.strip,
        last_name: row[req["last_name"]]&.to_s&.strip,
        email: row[req["email"]]&.to_s&.strip&.downcase,
        job_title: row[req["job_title"]]&.to_s&.strip,
        salary: row[req["salary"]],
        hire_date: row[req["hire_date"]]&.to_s&.strip,
        country_code: row[req["country_code"]]&.to_s&.strip,
        department_code: row[req["department_code"]]&.to_s&.strip,
        phone: opt["phone"] ? row[opt["phone"]]&.to_s&.strip : nil,
        employee_code: opt["employee_code"] ? row[opt["employee_code"]]&.to_s&.strip.presence : nil,
        currency: opt["currency"] ? row[opt["currency"]]&.to_s&.strip.presence || "USD" : "USD",
        active: opt["active"] ? row[opt["active"]]&.to_s&.strip&.downcase != "false" : true
      }

      return nil if attrs[:first_name].blank? && attrs[:last_name].blank? && attrs[:email].blank?
      attrs
    end

    def validate_and_classify(row_number, attrs)
      label = "#{attrs[:first_name]} #{attrs[:last_name]}, #{attrs[:email]}"

      return add_error(row_number, label, missing_fields_message(attrs)) unless required_fields_present?(attrs)

      country = @countries[attrs[:country_code]]
      return add_error(row_number, label, "Country '#{attrs[:country_code]}' not found") unless country

      department = @departments["#{attrs[:department_code]}:#{country.id}"] || @departments[attrs[:department_code]]
      return add_error(row_number, label, "Department '#{attrs[:department_code]}' not found") unless department

      now = Time.current
      record = attrs.except(:country_code, :department_code).merge(
        department_id: department.id, country_id: country.id,
        salary: attrs[:salary].to_f, created_at: now, updated_at: now
      )

      classify_record(record)
    end

    def required_fields_present?(attrs)
      %i[first_name last_name email job_title salary hire_date].all? { |f| attrs[f].present? }
    end

    def missing_fields_message(attrs)
      missing = %i[first_name last_name email job_title salary hire_date].select { |f| attrs[f].blank? }
      "Missing #{missing.join(', ')}"
    end

    def classify_record(record)
      if @existing_emails.include?(record[:email])
        @update_records << record
      else
        @new_records << record
        @existing_emails.add(record[:email])
      end
    end

    def add_error(row_number, label, message)
      @errors << "Row #{row_number} (#{label}): #{message}"
    end

    def persist_records
      @new_records.each_slice(BATCH_SIZE) { |batch| Employee.insert_all(batch) }
      @imported_count = @new_records.size

      @update_records.each_slice(BATCH_SIZE) { |batch| Employee.upsert_all(batch, unique_by: :email) }
      @updated_count = @update_records.size
    end

    def success_result
      { success: true, imported: @imported_count, updated: @updated_count, skipped: @skipped_count, errors: @errors }
    end

    def failure_result
      { success: false, imported: 0, updated: 0, skipped: 0, errors: @errors }
    end
  end
end
