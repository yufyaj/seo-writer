import 'dotenv/config'
import { execSync } from 'child_process'
import bcrypt from 'bcryptjs'
import { Client } from 'pg'

async function globalSetup() {
  console.log('Setting up E2E test environment...')

  try {
    // マイグレーションを実行
    console.log('Running migrations...')
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })

    // password123のハッシュを生成
    console.log('Generating password hash...')
    const hashedPassword = await bcrypt.hash('password123', 10)

    // PostgreSQLに直接接続してユーザーを作成
    console.log('Creating test user...')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    })

    await client.connect()

    await client.query(
      `
      INSERT INTO users (email, password_hash, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
    `,
      ['test@example.com', hashedPassword]
    )

    await client.end()

    console.log('E2E test environment setup complete!')
  } catch (error) {
    console.error('Failed to setup E2E test environment:', error)
    throw error
  }
}

export default globalSetup
