'use client'

import React, { createContext, useContext, useState, useRef, useEffect } from 'react'

export interface Song {
  id: number
  title: string
  audioUrl: string
  image: string
  artist: { name: string }
}

interface AudioContextType {
  currentSong: Song | null
  isPlaying: boolean
  playSong: (song: Song) => void
  togglePlay: () => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio()
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  const playSong = (song: Song) => {
    if (!audioRef.current) return

    if (currentSong?.id === song.id) {
      togglePlay()
      return
    }

    setCurrentSong(song)
    audioRef.current.src = song.audioUrl
    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch((err) => console.error('Lỗi phát audio:', err))
  }

  const togglePlay = () => {
    if (!audioRef.current || !currentSong) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  return (
    <AudioContext.Provider value={{ currentSong, isPlaying, playSong, togglePlay }}>
      {children}
    </AudioContext.Provider>
  )
}

export const useAudio = () => {
  const context = useContext(AudioContext)
  if (!context) throw new Error('useAudio phải được dùng bên trong AudioProvider')
  return context
}