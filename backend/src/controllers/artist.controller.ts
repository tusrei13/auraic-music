import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getArtists = async (req: Request, res: Response) => {
  try {
    const artists = await prisma.artist.findMany({
      include: {
        songs: {
          include: {
            genre: true,
          },
        },
      },
    });
    return res.json(artists);
  } catch (error) {
    console.error("Lỗi getArtists:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

export const getArtistById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const decodedNameOrId = decodeURIComponent(id);

    const artist = await prisma.artist.findFirst({
      where: {
        OR: [
          { id: decodedNameOrId },
          { name: { equals: decodedNameOrId, mode: "insensitive" } },
        ],
      },
      include: {
        songs: {
          include: {
            genre: true,
            artist: true,
          },
        },
      },
    });

    if (!artist) {
      return res.status(404).json({ message: "Không tìm thấy nghệ sĩ" });
    }

    return res.json(artist);
  } catch (error) {
    console.error("Lỗi getArtistById:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
};