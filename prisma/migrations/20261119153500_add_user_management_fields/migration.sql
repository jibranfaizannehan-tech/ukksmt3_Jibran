ALTER TABLE `users`
    ADD COLUMN `kode_User` VARCHAR(20) NULL,
    ADD COLUMN `token` TEXT NULL;

UPDATE `users`
SET `kode_User` = CONCAT(
    CASE
        WHEN LOWER(`role`) = 'admin' THEN 'ADM'
        WHEN LOWER(`role`) = 'staff' THEN 'STF'
        ELSE LEFT(UPPER(`role`), 3)
    END,
    REPEAT('0', GREATEST(0, 7 - CHAR_LENGTH(CAST(`id` AS CHAR)))),
    CAST(`id` AS CHAR)
);

ALTER TABLE `users`
    MODIFY COLUMN `kode_User` VARCHAR(20) NOT NULL,
    ADD UNIQUE INDEX `users_kode_User_key` (`kode_User`);
