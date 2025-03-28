-- Add weekDay and monthDay columns to habits table
ALTER TABLE habits ADD COLUMN weekDay INTEGER;
ALTER TABLE habits ADD COLUMN monthDay INTEGER;

-- Update existing habits to set default values
UPDATE habits SET weekDay = strftime('%w', created_at) WHERE frequency = 'weekly';
UPDATE habits SET monthDay = strftime('%d', created_at) WHERE frequency = 'monthly'; 