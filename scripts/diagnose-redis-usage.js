#!/usr/bin/env node

/**
 * Redis 使用诊断脚本
 * 用于分析 Redis 请求模式和优化建议
 */

const Redis = require('ioredis')
const config = require('../config/config')

class RedisDiagnostics {
  constructor() {
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      tls: config.redis.enableTLS ? {} : false
    })

    this.stats = {
      totalCommands: 0,
      commandCounts: {},
      keysScans: 0,
      pipelineUsage: 0,
      startTime: Date.now()
    }

    // 拦截所有 Redis 命令
    this.setupCommandInterceptor()
  }

  setupCommandInterceptor() {
    const originalSendCommand = this.redis.sendCommand.bind(this.redis)

    this.redis.sendCommand = (...args) => {
      const commandName = args[0]?.name || 'unknown'

      // 统计
      this.stats.totalCommands++
      this.stats.commandCounts[commandName] = (this.stats.commandCounts[commandName] || 0) + 1

      // 特别标记 KEYS 命令
      if (commandName.toLowerCase() === 'keys') {
        this.stats.keysScans++
        console.warn(`⚠️  KEYS command detected: ${args[0]?.args?.join(' ')}`)
      }

      return originalSendCommand(...args)
    }
  }

  async analyze() {
    console.log('🔍 Starting Redis usage analysis...\n')

    // 1. 检查键数量
    await this.analyzeKeyPatterns()

    // 2. 模拟定时任务
    await this.simulateScheduledTasks()

    // 3. 模拟 API 请求
    await this.simulateApiRequest()

    // 4. 生成报告
    this.generateReport()

    await this.redis.quit()
  }

  async analyzeKeyPatterns() {
    console.log('📊 Analyzing key patterns...')

    const patterns = [
      'claude:account:*',
      'openai:account:*',
      'gemini:account:*',
      'api_key:*',
      'usage:*',
      'session:*'
    ]

    const keyCounts = {}

    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern)
      keyCounts[pattern] = keys.length
      console.log(`  ${pattern.padEnd(25)} → ${keys.length} keys`)
    }

    console.log()
    return keyCounts
  }

  async simulateScheduledTasks() {
    console.log('⏰ Simulating scheduled task (rate limit cleanup)...')

    const beforeCount = this.stats.totalCommands

    // 模拟获取所有账户 (当前实现)
    const claudeKeys = await this.redis.keys('claude:account:*')
    for (const key of claudeKeys) {
      await this.redis.hgetall(key)
    }

    const openaiKeys = await this.redis.keys('openai:account:*')
    for (const key of openaiKeys) {
      await this.redis.hgetall(key)
    }

    const geminiKeys = await this.redis.keys('gemini:account:*')
    for (const key of geminiKeys) {
      await this.redis.hgetall(key)
    }

    const afterCount = this.stats.totalCommands
    const requestsPerCleanup = afterCount - beforeCount

    console.log(`  Requests per cleanup: ${requestsPerCleanup}`)
    console.log(
      `  Daily cleanups (5min interval): ${Math.floor((24 * 60) / 5)} = ${requestsPerCleanup * Math.floor((24 * 60) / 5)} requests/day`
    )
    console.log()
  }

  async simulateApiRequest() {
    console.log('📡 Simulating API request...')

    const beforeCount = this.stats.totalCommands

    // 模拟 API 请求流程
    await this.redis.hget('api_key_hash:test', 'data') // Key validation
    await this.redis.keys('claude:account:*') // Account selection
    await this.redis.hincrby('usage:test:model', 'requests', 1) // Usage stats
    await this.redis.get('session:test') // Session check
    await this.redis.set('session:test', 'data', 'EX', 3600) // Session update

    const afterCount = this.stats.totalCommands
    const requestsPerApi = afterCount - beforeCount

    console.log(`  Requests per API call: ${requestsPerApi}`)
    console.log(`  If 100 API calls/day: ${requestsPerApi * 100} requests/day`)
    console.log()
  }

  generateReport() {
    const runtime = Date.now() - this.stats.startTime
    const commandsPerSecond = (this.stats.totalCommands / (runtime / 1000)).toFixed(2)

    console.log('═══════════════════════════════════════════════')
    console.log('📋 DIAGNOSTICS REPORT')
    console.log('═══════════════════════════════════════════════')
    console.log()

    console.log('📊 Command Statistics:')
    console.log(`  Total commands: ${this.stats.totalCommands}`)
    console.log(`  Runtime: ${(runtime / 1000).toFixed(2)}s`)
    console.log(`  Commands/second: ${commandsPerSecond}`)
    console.log()

    console.log('🔍 Command Breakdown:')
    const sorted = Object.entries(this.stats.commandCounts).sort((a, b) => b[1] - a[1])
    for (const [cmd, count] of sorted) {
      const percentage = ((count / this.stats.totalCommands) * 100).toFixed(1)
      console.log(`  ${cmd.padEnd(15)} ${String(count).padStart(6)} (${percentage}%)`)
    }
    console.log()

    console.log('⚠️  Critical Issues:')
    if (this.stats.keysScans > 0) {
      console.log(`  ❌ KEYS command used ${this.stats.keysScans} times - VERY INEFFICIENT!`)
      console.log(`     Recommendation: Replace with SET-based indexing`)
    }

    const hasGetAll = this.stats.commandCounts['hgetall'] > 10
    if (hasGetAll) {
      console.log(`  ⚠️  Multiple HGETALL calls (${this.stats.commandCounts['hgetall']})`)
      console.log(`     Recommendation: Use Pipeline for batch operations`)
    }
    console.log()

    console.log('💡 Optimization Recommendations:')
    console.log()
    console.log('1. 🚨 URGENT: Replace KEYS with SET indexing')
    console.log('   Current: KEYS "claude:account:*" → O(n) complexity')
    console.log('   Better:  SMEMBERS "claude:accounts:index" → O(1) lookup')
    console.log()

    console.log('2. ⚡ Use Pipeline for batch operations')
    console.log('   Current: N separate HGETALL calls')
    console.log('   Better:  1 Pipeline with N operations')
    console.log()

    console.log('3. 🔄 Adjust scheduled task intervals')
    console.log('   Current: 5 minutes → High frequency')
    console.log('   Better:  30-60 minutes → Reduced load')
    console.log()

    console.log('4. 💾 Add local caching for hot data')
    console.log('   Use node-cache with 5-minute TTL for account lists')
    console.log()

    console.log('📈 Estimated Daily Usage (extrapolated):')
    const dailyEstimate = this.stats.totalCommands * 100 // Rough estimate
    console.log(`  Current pattern: ~${dailyEstimate.toLocaleString()} requests/day`)

    if (dailyEstimate > 100000) {
      console.log('  ⚠️  WARNING: This will exceed Upstash free tier (50K requests/month)')
      console.log('  💰 Recommendation: Upgrade Upstash or implement optimizations')
    }
    console.log()
  }
}

// 运行诊断
async function main() {
  const diagnostics = new RedisDiagnostics()
  await diagnostics.analyze()
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Diagnostics failed:', error)
    process.exit(1)
  })
}

module.exports = RedisDiagnostics
