-- DropForeignKey
ALTER TABLE "public"."JamendoLike" DROP CONSTRAINT "JamendoLike_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."JamendoListening" DROP CONSTRAINT "JamendoListening_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."JamendoPlaylistSong" DROP CONSTRAINT "JamendoPlaylistSong_playlistId_fkey";

-- DropTable
DROP TABLE "public"."JamendoPlaylistSong";

-- DropTable
DROP TABLE "public"."JamendoLike";

-- DropTable
DROP TABLE "public"."JamendoListening";
