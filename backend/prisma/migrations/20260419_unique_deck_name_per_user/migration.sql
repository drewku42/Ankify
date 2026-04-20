-- Rename existing duplicate deck names before adding constraint.
-- Appends " (N)" suffix to duplicates, keeping the oldest untouched.
UPDATE `Deck` d
JOIN (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY userId, name ORDER BY createdAt ASC) AS rn
    FROM `Deck`
) ranked ON d.id = ranked.id
SET d.name = CONCAT(d.name, ' (', ranked.rn, ')')
WHERE ranked.rn > 1;

-- AddUniqueConstraint
CREATE UNIQUE INDEX `Deck_userId_name_key` ON `Deck`(`userId`, `name`);
