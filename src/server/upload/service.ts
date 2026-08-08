import 'server-only'
import { localDiskProvider } from './providers/local'
import { s3Provider } from './providers/s3'

const provider = process.env.UPLOAD_PROVIDER === 's3' ? s3Provider : localDiskProvider

export const uploadService = {
  async upload(opts: {
    file: Buffer
    filename: string
    mimetype: string
    folder?: string
  }) {
    return provider.upload(opts)
  },

  async delete(key: string) {
    return provider.delete(key)
  },

  getUrl(key: string) {
    return provider.getUrl(key)
  },
}
