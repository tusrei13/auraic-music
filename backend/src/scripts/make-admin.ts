import 'dotenv/config'
import { prisma } from '../lib/prisma'

const email = process.argv[2]?.trim().toLowerCase()

if (!email) {
  console.error('Usage: npm run admin:grant -- user@example.com')
  process.exitCode = 1
} else {
  prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
    select: { id: true, email: true, role: true },
  })
    .then((user) => console.log(`Admin role granted to ${user.email}`))
    .catch(() => {
      console.error(`No user found for ${email}`)
      process.exitCode = 1
    })
    .finally(async () => prisma.$disconnect())
}
