class CreateDepartments < ActiveRecord::Migration[7.2]
  def change
    create_table :departments do |t|
      t.string :name, null: false
      t.string :code, null: false
      t.references :country, null: false, foreign_key: true

      t.timestamps
    end

    add_index :departments, [:name, :country_id], unique: true
    add_index :departments, :code
  end
end
