import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('user'),
  managerName: text('manager_name').notNull(),
  profileImageUrl: text('profile_image_url'),
  isActive: integer('is_active').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

export const businesses = sqliteTable('businesses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  type: text('type').notNull(),
  city: text('city').notNull(),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  refrigeratorCount: integer('refrigerator_count').notNull().default(0),
  freezerCount: integer('freezer_count').notNull().default(0),
  hotDisplayCount: integer('hot_display_count').notNull().default(0),
  coldDisplayCount: integer('cold_display_count').notNull().default(0),
  otherEquipment: text('other_equipment'),
  createdAt: text('created_at').notNull(),
});

export const temperatureLogs = sqliteTable('temperature_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  businessId: integer('business_id').notNull().references(() => businesses.id),
  equipmentType: text('equipment_type').notNull(),
  equipmentNumber: integer('equipment_number').notNull(),
  temperature: real('temperature').notNull(),
  logDate: text('log_date').notNull(),
  createdAt: text('created_at').notNull(),
});

export const establishments = sqliteTable('establishments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  establishmentType: text('establishment_type').notNull(),
  employeeCount: integer('employee_count').notNull(),
  managerName: text('manager_name').notNull(),
  managerPhone: text('manager_phone').notNull(),
  managerEmail: text('manager_email').notNull(),
  companyName: text('company_name').notNull(),
  eik: text('eik').notNull(),
  eikVerified: integer('eik_verified').notNull().default(0),
  eikVerificationDate: text('eik_verification_date'),
  registrationAddress: text('registration_address').notNull(),
  contactEmail: text('contact_email').notNull(),
  vatRegistered: integer('vat_registered').notNull().default(0),
  vatNumber: text('vat_number'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const personnel = sqliteTable('personnel', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  establishmentId: integer('establishment_id').notNull().references(() => establishments.id),
  fullName: text('full_name').notNull(),
  egn: text('egn').notNull(),
  position: text('position').notNull(),
  healthBookImageUrl: text('health_book_image_url'),
  photoUrl: text('photo_url'),
  healthBookNumber: text('health_book_number').notNull(),
  healthBookValidity: text('health_book_validity').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const diaryDevices = sqliteTable('diary_devices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  deviceType: text('device_type').notNull(),
  deviceName: text('device_name').notNull(),
  minTemp: real('min_temp').notNull(),
  maxTemp: real('max_temp').notNull(),
  establishmentId: integer('establishment_id').references(() => establishments.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const temperatureReadings = sqliteTable('temperature_readings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deviceId: integer('device_id').notNull().references(() => diaryDevices.id),
  readingDate: text('reading_date').notNull(),
  hour: integer('hour').notNull(),
  temperature: real('temperature').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const incomingControls = sqliteTable('incoming_controls', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  establishmentId: integer('establishment_id').references(() => establishments.id),
  controlDate: text('control_date').notNull(),
  imageUrl: text('image_url').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const cleaningTemplates = sqliteTable('cleaning_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  establishmentId: integer('establishment_id').references(() => establishments.id),
  name: text('name').notNull(),
  daysOfWeek: text('days_of_week', { mode: 'json' }).notNull(),
  cleaningHours: text('cleaning_hours', { mode: 'json' }).notNull(),
  duration: integer('duration').notNull(),
  products: text('products', { mode: 'json' }).notNull(),
  cleaningAreas: text('cleaning_areas', { mode: 'json' }).notNull(),
  employeeId: integer('employee_id').references(() => personnel.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const cleaningLogs = sqliteTable('cleaning_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  establishmentId: integer('establishment_id').references(() => establishments.id),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  cleaningAreas: text('cleaning_areas', { mode: 'json' }).notNull(),
  products: text('products', { mode: 'json' }).notNull(),
  employeeId: integer('employee_id').references(() => personnel.id),
  employeeName: text('employee_name'),
  notes: text('notes'),
  logDate: text('log_date').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const foodItems = sqliteTable('food_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  cookingTemperature: integer('cooking_temperature'),
  shelfLifeHours: integer('shelf_life_hours').notNull(),
  establishmentId: integer('establishment_id').references(() => establishments.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const foodDiary = sqliteTable('food_diary', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  foodItemId: integer('food_item_id').notNull().references(() => foodItems.id),
  date: text('date').notNull(),
  time: text('time').notNull(),
  quantity: text('quantity'),
  temperature: integer('temperature'),
  shelfLifeHours: integer('shelf_life_hours').notNull(),
  notes: text('notes'),
  establishmentId: integer('establishment_id').references(() => establishments.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const foodTemplates = sqliteTable('food_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  daysOfWeek: text('days_of_week', { mode: 'json' }).notNull(),
  preparationTimes: text('preparation_times', { mode: 'json' }).notNull(),
  foodItemIds: text('food_item_ids', { mode: 'json' }).notNull(),
  establishmentId: integer('establishment_id').references(() => establishments.id),
  employeeId: integer('employee_id').references(() => personnel.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});