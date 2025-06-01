import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'

import { ProcessedStatement } from './types'

export class CacheService {
  private cacheDir: string
  private ttlHours: number

  constructor() {
    this.cacheDir = process.env.CACHE_DIR || './cache'
    this.ttlHours = parseInt(process.env.CACHE_TTL_HOURS || '24')
    this.initializeCache()
  }

  private async initializeCache() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
    } catch (error) {
      console.error('Error initializing cache directory:', error)
    }
  }

  /**
   * Generate MD5 hash of file content
   */
  private generateHash(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex')
  }

  /**
   * Get cache file path for a given hash
   */
  private getCachePath(hash: string): string {
    return path.join(this.cacheDir, `${hash}.json`)
  }

  /**
   * Check if a cached result exists and is still valid
   */
  async get(pdfBuffer: Buffer): Promise<ProcessedStatement | null> {
    try {
      const hash = this.generateHash(pdfBuffer)
      const cachePath = this.getCachePath(hash)

      const stats = await fs.stat(cachePath)
      const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60)

      if (ageHours > this.ttlHours) {
        console.info(`Cache expired for hash ${hash}`)
        return null
      }

      const cacheContent = await fs.readFile(cachePath, 'utf-8')
      console.info(`Cache hit for hash ${hash}`)
      return JSON.parse(cacheContent)
    } catch (error) {
      // Cache miss
      return null
    }
  }

  /**
   * Store processed result in cache
   */
  async set(pdfBuffer: Buffer, result: ProcessedStatement): Promise<void> {
    try {
      const hash = this.generateHash(pdfBuffer)
      const cachePath = this.getCachePath(hash)

      await fs.writeFile(cachePath, JSON.stringify(result, null, 2))
      console.info(`Cached result for hash ${hash}`)
    } catch (error) {
      console.error('Error caching result:', error)
    }
  }

  /**
   * Delete a specific cache entry
   */
  async delete(pdfBuffer: Buffer): Promise<void> {
    try {
      const hash = this.generateHash(pdfBuffer)
      const cachePath = this.getCachePath(hash)
      
      await fs.unlink(cachePath)
      console.info(`Deleted cache for hash ${hash}`)
    } catch (error) {
      // Ignore error if file doesn't exist
      if ((error as any).code !== 'ENOENT') {
        console.error('Error deleting cache:', error)
      }
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpired(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir)
      const now = Date.now()

      for (const file of files) {
        const filePath = path.join(this.cacheDir, file)
        const stats = await fs.stat(filePath)
        const ageHours = (now - stats.mtime.getTime()) / (1000 * 60 * 60)

        if (ageHours > this.ttlHours) {
          await fs.unlink(filePath)
          console.info(`Deleted expired cache file: ${file}`)
        }
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error)
    }
  }
}