import 'server-only'

export const s3Provider = {
  name: 's3' as const,

  async upload(_opts: { file: Buffer; filename: string; mimetype: string; folder?: string }) {
    // TODO: فاز ۸ — ArvanCloud S3-compatible
    return { success: false, url: '', key: '', provider: 's3' as const, error: 'S3 not configured' }
  },

  async delete(_key: string) {
    return { success: false, error: 'S3 not configured' }
  },

  getUrl(_key: string) {
    return ''
  },
}
