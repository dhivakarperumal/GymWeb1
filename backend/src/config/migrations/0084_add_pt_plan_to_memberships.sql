-- Migration 0084: Add PT plan tracking to memberships table

ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS has_pt_plan TINYINT(1) DEFAULT 0;

-- Update existing records based on the plan's trainer_included status
UPDATE memberships m
INNER JOIN gym_plans gp ON m.planId = gp.id
SET m.has_pt_plan = CASE 
  WHEN gp.trainer_included = 1 OR gp.trainer_included = true THEN 1
  ELSE 0
END
WHERE m.planId IS NOT NULL;
