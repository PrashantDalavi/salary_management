class Countries::ImportService
  REQUIRED_HEADERS = %w[name code].freeze

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

    import_rows(spreadsheet, headers)

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
    when ".csv"
      Roo::CSV.new(@file.path)
    when ".xlsx"
      Roo::Excelx.new(@file.path)
    when ".xls"
      Roo::Excel.new(@file.path)
    end
  rescue StandardError => e
    @errors << "Could not read file: #{e.message}"
    nil
  end

  def validate_headers!(headers)
    missing = REQUIRED_HEADERS - headers
    if missing.any?
      @errors << "Missing required columns: #{missing.join(', ')}"
    end
  end

  def import_rows(spreadsheet, headers)
    name_index = headers.index("name")
    code_index = headers.index("code")

    (2..spreadsheet.last_row).each do |row_number|
      row = spreadsheet.row(row_number)
      name = row[name_index]&.to_s&.strip
      code = row[code_index]&.to_s&.strip

      next if name.blank? && code.blank?

      country = Country.find_by(name: name)

      if country.nil?
        country = Country.new(name: name, code: code)
        if country.save
          @imported_count += 1
        else
          @errors << "Row #{row_number} (#{name}, #{code}): #{country.errors.full_messages.join(', ')}"
        end
      elsif country.code != code
        if country.update(code: code)
          @updated_count += 1
        else
          @errors << "Row #{row_number} (#{name}, #{code}): #{country.errors.full_messages.join(', ')}"
        end
      else
        @skipped_count += 1
      end
    end
  end

  def success_result
    {
      success: true,
      imported: @imported_count,
      updated: @updated_count,
      skipped: @skipped_count,
      errors: @errors
    }
  end

  def failure_result
    {
      success: false,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: @errors
    }
  end
end
