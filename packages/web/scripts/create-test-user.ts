import { execSync } from 'child_process'
import bcrypt from 'bcryptjs'

async function createTestUser() {
  console.log('Creating test user...')

  // password123のハッシュを生成
  const hashedPassword = await bcrypt.hash('password123', 10)

  // SQLを実行
  const sql = `
    INSERT INTO users (email, password_hash, created_at, updated_at)
    VALUES ('test@example.com', '${hashedPassword}', NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
  `

  try {
    execSync(`echo "${sql.replace(/"/g, '\\"')}" | pnpm prisma db execute --stdin`, {
      stdio: 'inherit',
      shell: true,
    })
    console.log('Test user created successfully!')
  } catch (error) {
    console.error('Failed to create test user:', error)
    throw error
  }
}

createTestUser()
