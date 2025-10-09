/**
 * Token 主动刷新调度服务
 * 定期检查并提前刷新即将过期的 OAuth token
 * 保持所有账户的 token 始终有效，避免首次请求延迟
 */

const logger = require('../utils/logger')
const config = require('../../config/config')
const claudeAccountService = require('./claudeAccountService')
const geminiAccountService = require('./geminiAccountService')

class TokenRefreshScheduler {
  constructor() {
    this.refreshInterval = null
    this.isRunning = false
    // 从配置读取间隔，默认 15 分钟
    const intervalMinutes = config.scheduledTasks?.tokenRefreshInterval || 15
    this.intervalMs = intervalMinutes * 60 * 1000
    // 提前刷新窗口：token 在过期前多久开始刷新（默认 5 分钟）
    this.refreshWindowMs = (config.scheduledTasks?.tokenRefreshWindow || 5) * 60 * 1000
  }

  /**
   * 启动自动刷新服务
   * @param {number} intervalMinutes - 检查间隔（分钟），默认 15 分钟
   */
  start(intervalMinutes = 15) {
    if (this.refreshInterval) {
      logger.warn('⚠️ Token refresh scheduler is already running')
      return
    }

    this.intervalMs = intervalMinutes * 60 * 1000

    logger.info(
      `🔄 Starting token refresh scheduler (interval: ${intervalMinutes} minutes, window: ${this.refreshWindowMs / 60000} minutes)`
    )

    // 延迟 30 秒后执行第一次刷新，避免启动时负载过高
    setTimeout(() => {
      this.performRefresh()
    }, 30000)

    // 设置定期执行
    this.refreshInterval = setInterval(() => {
      this.performRefresh()
    }, this.intervalMs)
  }

  /**
   * 停止自动刷新服务
   */
  stop() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
      logger.info('🛑 Token refresh scheduler stopped')
    }
  }

  /**
   * 执行一次刷新检查
   */
  async performRefresh() {
    if (this.isRunning) {
      logger.debug('⏭️ Refresh already in progress, skipping this cycle')
      return
    }

    this.isRunning = true
    const startTime = Date.now()

    try {
      logger.debug('🔍 Starting proactive token refresh check...')

      const results = {
        claude: { checked: 0, refreshed: 0, skipped: 0, failed: 0, errors: [] },
        gemini: { checked: 0, refreshed: 0, skipped: 0, failed: 0, errors: [] }
      }

      // 刷新 Claude 账户
      await this.refreshClaudeAccounts(results.claude)

      // 刷新 Gemini 账户
      await this.refreshGeminiAccounts(results.gemini)

      const totalChecked = results.claude.checked + results.gemini.checked
      const totalRefreshed = results.claude.refreshed + results.gemini.refreshed
      const totalSkipped = results.claude.skipped + results.gemini.skipped
      const totalFailed = results.claude.failed + results.gemini.failed
      const duration = Date.now() - startTime

      if (totalRefreshed > 0 || totalFailed > 0) {
        logger.info(
          `✅ Token refresh completed: ${totalRefreshed} refreshed, ${totalSkipped} skipped, ${totalFailed} failed out of ${totalChecked} checked (${duration}ms)`
        )
        logger.info(
          `   Claude: ${results.claude.refreshed} refreshed, ${results.claude.failed} failed`
        )
        logger.info(
          `   Gemini: ${results.gemini.refreshed} refreshed, ${results.gemini.failed} failed`
        )
      } else {
        logger.debug(`🔍 Token refresh check completed: no tokens need refresh (${duration}ms)`)
      }

      // 记录错误
      const allErrors = [...results.claude.errors, ...results.gemini.errors]
      if (allErrors.length > 0) {
        logger.warn(`⚠️ Encountered ${allErrors.length} errors during refresh:`)
        allErrors.forEach((err) => {
          logger.warn(`   ${err.platform} - ${err.accountName} (${err.accountId}): ${err.error}`)
        })
      }
    } catch (error) {
      logger.error('❌ Token refresh scheduler failed:', error)
    } finally {
      this.isRunning = false
    }
  }

  /**
   * 刷新 Claude 账户的 token
   */
  async refreshClaudeAccounts(result) {
    try {
      const accounts = await claudeAccountService.getAllAccounts()
      const now = Date.now()

      for (const account of accounts) {
        // 只处理激活的、有 OAuth 认证的账户
        if (!account.isActive || !account.hasRefreshToken) {
          continue
        }

        result.checked++

        try {
          // 检查 token 是否需要刷新（即将过期）
          const expiresAt = account.expiresAt ? parseInt(account.expiresAt) : 0
          const needsRefresh = expiresAt > 0 && expiresAt - now <= this.refreshWindowMs

          if (!needsRefresh) {
            result.skipped++
            const minutesRemaining = Math.round((expiresAt - now) / 60000)
            logger.debug(
              `⏭️ Skipping Claude account ${account.name} (${account.id}): ${minutesRemaining} minutes until expiry`
            )
            continue
          }

          // 执行刷新
          logger.info(`🔄 Proactively refreshing Claude token for: ${account.name} (${account.id})`)
          await claudeAccountService.refreshAccountToken(account.id)
          result.refreshed++

          logger.success(
            `✅ Successfully refreshed Claude token for: ${account.name} (${account.id})`
          )
        } catch (error) {
          result.failed++
          result.errors.push({
            platform: 'Claude',
            accountId: account.id,
            accountName: account.name,
            error: error.message
          })
          logger.error(
            `❌ Failed to refresh Claude token for ${account.name} (${account.id}): ${error.message}`
          )
        }
      }
    } catch (error) {
      logger.error('Failed to refresh Claude accounts:', error)
      result.errors.push({ platform: 'Claude', error: error.message })
    }
  }

  /**
   * 刷新 Gemini 账户的 token
   */
  async refreshGeminiAccounts(result) {
    try {
      const accounts = await geminiAccountService.getAllAccounts()
      const now = Date.now()

      for (const account of accounts) {
        // 只处理激活的、有 OAuth 认证的账户
        if (account.isActive !== 'true' || !account.hasRefreshToken) {
          continue
        }

        result.checked++

        try {
          // 检查 token 是否需要刷新（即将过期）
          const expiresAt = account.expiresAt ? new Date(account.expiresAt).getTime() : 0
          const needsRefresh = expiresAt > 0 && expiresAt - now <= this.refreshWindowMs

          if (!needsRefresh) {
            result.skipped++
            const minutesRemaining = Math.round((expiresAt - now) / 60000)
            logger.debug(
              `⏭️ Skipping Gemini account ${account.name} (${account.id}): ${minutesRemaining} minutes until expiry`
            )
            continue
          }

          // 执行刷新
          logger.info(`🔄 Proactively refreshing Gemini token for: ${account.name} (${account.id})`)
          await geminiAccountService.refreshAccountToken(account.id)
          result.refreshed++

          logger.success(
            `✅ Successfully refreshed Gemini token for: ${account.name} (${account.id})`
          )
        } catch (error) {
          result.failed++
          result.errors.push({
            platform: 'Gemini',
            accountId: account.id,
            accountName: account.name,
            error: error.message
          })
          logger.error(
            `❌ Failed to refresh Gemini token for ${account.name} (${account.id}): ${error.message}`
          )
        }
      }
    } catch (error) {
      logger.error('Failed to refresh Gemini accounts:', error)
      result.errors.push({ platform: 'Gemini', error: error.message })
    }
  }

  /**
   * 手动触发一次刷新（供 API 或 CLI 调用）
   */
  async manualRefresh() {
    logger.info('🔄 Manual token refresh triggered')
    await this.performRefresh()
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      running: !!this.refreshInterval,
      intervalMinutes: this.intervalMs / (60 * 1000),
      refreshWindowMinutes: this.refreshWindowMs / (60 * 1000),
      isProcessing: this.isRunning
    }
  }
}

// 创建单例实例
const tokenRefreshScheduler = new TokenRefreshScheduler()

module.exports = tokenRefreshScheduler
