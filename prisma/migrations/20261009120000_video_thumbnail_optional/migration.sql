-- AlterTable: the video thumbnail is optional; reels are played from their Instagram link.
ALTER TABLE `Video` MODIFY `thumbnailUrl` VARCHAR(500) NULL,
    MODIFY `thumbnailPublicId` VARCHAR(255) NULL;
