import puppeteer from 'puppeteer'

class BrowserPool {
  constructor(maxBrowsers = 3) {
    this.maxBrowsers = maxBrowsers
    this.activeBrowsers = 0
    this.queue = []
  }

  async getBrowser() {
    return new Promise((resolve, reject) => {
      if (this.activeBrowsers < this.maxBrowsers) {
        this.activeBrowsers++
        this.launchBrowser()
          .then(resolve)
          .catch(reject)
      } else {
        // Queue the request
        this.queue.push({ resolve, reject })
      }
    })
  }

  async launchBrowser() {
    try {
      const browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox", 
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--memory-pressure-off",
          "--max_old_space_size=4096"
        ],
      })

      // Add cleanup handler
      const originalClose = browser.close.bind(browser)
      browser.close = async () => {
        try {
          await originalClose()
        } finally {
          this.activeBrowsers--
          this.processQueue()
        }
      }

      return browser
    } catch (error) {
      this.activeBrowsers--
      this.processQueue()
      throw error
    }
  }

  processQueue() {
    if (this.queue.length > 0 && this.activeBrowsers < this.maxBrowsers) {
      const { resolve, reject } = this.queue.shift()
      this.activeBrowsers++
      this.launchBrowser()
        .then(resolve)
        .catch(reject)
    }
  }

  async closeAll() {
    // This would require tracking all browsers, which we're not doing yet
    // For now, just reset counters
    this.activeBrowsers = 0
    this.queue.forEach(({ reject }) => reject(new Error('Browser pool closed')))
    this.queue = []
  }
}

// Export a singleton instance
export const browserPool = new BrowserPool(2) // Limit to 2 concurrent browsers

export default browserPool

