import crypto from 'crypto'

/**
 * 暗号化アルゴリズム: AES-256-GCM
 * - 認証付き暗号化（改ざん検知）
 * - IVは毎回ランダム生成
 */
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * 暗号化キーを取得
 * 環境変数から32バイトのキーを取得
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }

  // Base64デコードして32バイトのキーを取得
  const keyBuffer = Buffer.from(key, 'base64')
  if (keyBuffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (256 bits) when decoded from base64')
  }

  return keyBuffer
}

/**
 * テキストを暗号化
 * @param plaintext 平文
 * @returns 暗号化されたテキスト（IV + AuthTag + Ciphertext をBase64エンコード）
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  // IV(16) + AuthTag(16) + Ciphertext を結合してBase64エンコード
  const combined = Buffer.concat([iv, authTag, encrypted])
  return combined.toString('base64')
}

/**
 * テキストを復号
 * @param encryptedText 暗号化されたテキスト（Base64）
 * @returns 復号された平文
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey()
  const combined = Buffer.from(encryptedText, 'base64')

  // IV, AuthTag, Ciphertext を分離
  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

/**
 * 暗号化キーを生成（初期セットアップ用）
 * 生成されたキーを環境変数に設定する
 */
export function generateEncryptionKey(): string {
  const key = crypto.randomBytes(32)
  return key.toString('base64')
}
