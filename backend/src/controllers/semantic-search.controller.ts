import { Request, Response } from 'express'
import { performSemanticSearch } from '../services/semantic-search.service'
import { sendError, sendInternalError } from '../lib/api-error'

export const handleSemanticSearch = async (req: Request, res: Response) => {
  const q = req.query.q ? String(req.query.q).trim() : ''
  if (!q) {
    return sendError(res, 400, 'QUERY_REQUIRED', 'Tham số tìm kiếm q không được để trống')
  }

  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 24
  const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0

  try {
    const result = await performSemanticSearch(q, { limit, offset })
    return res.json(result)
  } catch (error) {
    return sendInternalError(res, 'SEMANTIC_SEARCH_FAILED', 'Tìm kiếm ngữ nghĩa thất bại')
  }
}
