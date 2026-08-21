const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export const getSongs = async () => {
  const res = await fetch(`${API_BASE_URL}/songs`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Không thể tải danh sách bài hát')
  return res.json()
}

export const getPlaylists = async () => {
  const res = await fetch(`${API_BASE_URL}/playlists`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Không thể tải danh sách playlist')
  return res.json()
}