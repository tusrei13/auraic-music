-- DropForeignKey
ALTER TABLE "public"."EngineLike" DROP CONSTRAINT "EngineLike_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."EngineListening" DROP CONSTRAINT "EngineListening_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."EnginePlaylistSong" DROP CONSTRAINT "EnginePlaylistSong_playlistId_fkey";

-- DropTable
DROP TABLE "public"."EnginePlaylistSong";

-- DropTable
DROP TABLE "public"."EngineLike";

-- DropTable
DROP TABLE "public"."EngineListening";
