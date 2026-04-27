class CreateEmployees < ActiveRecord::Migration[7.2]
  def change
    create_table :employees do |t|
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.string :email, null: false
      t.string :phone
      t.string :employee_code
      t.references :department, null: false, foreign_key: true
      t.references :country, null: false, foreign_key: true
      t.string :job_title, null: false
      t.date :hire_date, null: false
      t.decimal :salary, precision: 12, scale: 2, null: false
      t.string :currency, default: "INR"
      t.boolean :active, default: true

      t.timestamps
    end

    add_index :employees, :email, unique: true
    add_index :employees, :employee_code, unique: true
  end
end
