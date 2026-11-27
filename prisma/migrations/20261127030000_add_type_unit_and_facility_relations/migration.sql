CREATE TABLE IF NOT EXISTS `facility` (
    `kode_facility` VARCHAR(191) NOT NULL,
    `nama_facility` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`kode_facility`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `type_unit` (
    `id_unit_type` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_type_unit` VARCHAR(191) NOT NULL,
    `branch_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_unit_type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `type_unit_facility` (
    `id_unit_type` INTEGER NOT NULL,
    `kode_facility` VARCHAR(191) NOT NULL,

    INDEX `type_unit_facility_kode_facility_idx`(`kode_facility`),
    PRIMARY KEY (`id_unit_type`, `kode_facility`),
    CONSTRAINT `type_unit_facility_id_unit_type_fkey`
        FOREIGN KEY (`id_unit_type`) REFERENCES `type_unit`(`id_unit_type`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `type_unit_facility_kode_facility_fkey`
        FOREIGN KEY (`kode_facility`) REFERENCES `facility`(`kode_facility`)
        ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
