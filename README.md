# Employee Salary Management

Live Url: https://employee-management-vpmd.onrender.com/

A full-stack employee salary management tool built with Rails 7.1 and React. Manage countries, departments, and employees with bulk CSV/Excel import support and real-time salary analytics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Ruby 3.3.0, Rails 7.1.5 |
| Frontend | React 18, esbuild |
| Database | PostgreSQL |
| Testing | RSpec, FactoryBot, Shoulda Matchers |
| Pagination | Kaminari |
| File Parsing | Roo (CSV, XLSX, XLS) |

## Setup

### Prerequisites

- Ruby 3.3.0 (via rvm/rbenv)
- PostgreSQL
- Node.js & Yarn

### Installation

```bash
# Clone and install dependencies
git clone <repo-url> && cd salary_management
bundle install
yarn install

# Database setup
rails db:create db:migrate

# Start the dev server
bin/dev
```

The app runs at `http://localhost:3000`

## Project Structure

```
app/
  controllers/api/v1/
    base_controller.rb        # CSRF-less API base
    countries_controller.rb   # CRUD + bulk import
    departments_controller.rb # CRUD + bulk import
    employees_controller.rb   # CRUD + bulk import + server-side filtering
    insights_controller.rb    # SQL-aggregated salary analytics
  models/
    country.rb                # has_many departments, employees
    department.rb             # belongs_to country, has_many employees
    employee.rb               # Scopes: search, by_country, by_department, sorted, filter
  services/
    countries/import_service.rb
    departments/import_service.rb
    employees/import_service.rb  # Bulk insert_all/upsert_all in batches of 1000
  javascript/
    components/               # React components (Countries, Departments, Employees, Insights)
    services/api.js           # API service layer
```

## API Endpoints

### Countries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/countries` | List all countries |
| POST | `/api/v1/countries` | Create country |
| PATCH | `/api/v1/countries/:id` | Update country |
| DELETE | `/api/v1/countries/:id` | Delete country |
| POST | `/api/v1/countries/bulk_import` | Import CSV/Excel |

### Departments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/departments` | List all departments |
| POST | `/api/v1/departments` | Create department |
| PATCH | `/api/v1/departments/:id` | Update department |
| DELETE | `/api/v1/departments/:id` | Delete department |
| POST | `/api/v1/departments/bulk_import` | Import CSV/Excel |

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/employees` | List with search, filter, sort, pagination |
| GET | `/api/v1/employees/:id` | Show employee |
| POST | `/api/v1/employees` | Create employee |
| PATCH | `/api/v1/employees/:id` | Update employee |
| DELETE | `/api/v1/employees/:id` | Delete employee |
| POST | `/api/v1/employees/bulk_import` | Bulk import CSV/Excel |

**Employee query params:**
- `search` — searches name, email, job title, employee code
- `country_id` — filter by country
- `department_name` — filter by department name (cross-country)
- `sort_by` / `sort_dir` — sortable columns: id, first_name, last_name, email, job_title, salary, hire_date, employee_code
- `page` / `per_page` — pagination (default: 25 per page)

### Salary Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/salary_insights` | Aggregated salary analytics |

**Params:** `country_id` (optional filter)

**Returns:** overall stats, breakdown by country, breakdown by job title — all computed via SQL aggregations.

## Bulk Import

All import endpoints accept `.csv`, `.xlsx`, or `.xls` files via `multipart/form-data`.

### CSV Format

**Countries:** `name,code`

**Departments:** `name,code,country_code,description,active`

**Employees:** `first_name,last_name,email,job_title,salary,hire_date,country_code,department_code`

Optional employee columns: `phone,employee_code,currency,active`

### Import Behavior

- **Idempotent** — re-importing the same file won't create duplicates
- **Upsert** — existing records (matched by email for employees, name for countries/departments) are updated if data differs
- **Bulk optimized** — employees use `insert_all`/`upsert_all` in batches of 1000
- **Error reporting** — row-level errors with employee name and email for easy debugging

### Performance (Employees)

| Metric | Row-by-row | Bulk (current) |
|--------|-----------|----------------|
| 10K records | ~30K queries | ~13 queries |
| Lookups | DB query per row | Preloaded hashes |
| Validation | ActiveRecord save | In-memory |
| Insert | Individual INSERTs | `insert_all` (1K batches) |

## Sample Data

Sample CSV files are in `sample_files/`:
- `countries.csv`
- `departments.csv`
- `employees.csv` (10 records)

Generate 10K employee records for testing:

```bash
rake 'employees:generate_csv[10000]'
# Output: sample_files/employees_bulk.csv
```

## Testing

```bash
# Run all specs
bundle exec rspec

# Run by module
bundle exec rspec spec/models/
bundle exec rspec spec/requests/api/v1/
bundle exec rspec spec/services/
bundle exec rspec spec/tasks/

# With documentation format
bundle exec rspec --format documentation
```

### Test Coverage

| Module | Specs | Tests |
|--------|-------|-------|
| Country model | spec/models/country_spec.rb | Validations |
| Department model | spec/models/department_spec.rb | Validations, associations |
| Employee model | spec/models/employee_spec.rb | Validations, scopes, filter, sorted |
| Countries API | spec/requests/api/v1/countries_spec.rb | CRUD + import |
| Departments API | spec/requests/api/v1/departments_spec.rb | CRUD + import |
| Employees API | spec/requests/api/v1/employees_spec.rb | CRUD + import + filters |
| Insights API | spec/requests/api/v1/insights_spec.rb | Stats + filters |
| Country import | spec/services/countries/import_service_spec.rb | Upsert, errors |
| Dept import | spec/services/departments/import_service_spec.rb | Upsert, errors |
| Employee import | spec/services/employees/import_service_spec.rb | Bulk insert, validation |
| CSV generator | spec/tasks/generate_employees_spec.rb | Rake task output |

## Design Decisions

- **Fat model, thin controller** — filtering, search, and sorting live in `Employee` model scopes. Controller just calls `Employee.filter(params)`
- **`restrict_with_error`** — prevents deleting countries/departments that have employees
- **Department uniqueness** — scoped to `country_id` (same department name allowed across countries)
- **Department filter by name** — uses subquery `WHERE department_id IN (SELECT id FROM departments WHERE name = ?)` to match across all countries
- **Salary insights via SQL** — `pluck` with `GROUP BY` aggregations instead of loading all records into memory
