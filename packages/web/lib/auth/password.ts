import bcrypt from 'bcryptjs'

/**
 * パスワードをハッシュ化する
 * @param password - ハッシュ化するパスワード
 * @returns ハッシュ化されたパスワード
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

/**
 * パスワードを検証する
 * @param password - 検証するパスワード
 * @param hashedPassword - ハッシュ化されたパスワード
 * @returns パスワードが一致する場合true
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
