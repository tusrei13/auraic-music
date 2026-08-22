import 'dotenv/config'
import { prisma } from '../lib/prisma'
import { syncSearchIndex } from '../services/search-index.service'

syncSearchIndex()
  .then(() => console.log('Typesense search index synchronized.'))
  .catch((error) => {
    console.error('Typesense synchronization failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
