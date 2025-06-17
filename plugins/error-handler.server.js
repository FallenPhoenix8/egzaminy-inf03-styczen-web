// Flag to ensure listeners are only added once
let listenersAdded = false

// Increase max listeners to prevent warnings
process.setMaxListeners(20)

export default defineNuxtPlugin(async (nuxtApp) => {
  // Only add listeners once to prevent memory leaks
  if (!listenersAdded) {
    listenersAdded = true
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason)
      
      // Log the error but don't crash the application
      // In development, you might want to be more strict
      if (process.env.NODE_ENV === 'development') {
        console.error('Stack trace:', reason?.stack || 'No stack trace available')
      }
    })

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error)
      console.error('Stack trace:', error.stack)
      
      // In production, you might want to gracefully shutdown
      // For now, just log and continue
      if (process.env.NODE_ENV === 'production') {
        console.error('Critical error occurred, but continuing...')
      }
    })

    // Handle warnings
    process.on('warning', (warning) => {
      console.warn('Node.js warning:', warning.name, warning.message)
      if (warning.stack) {
        console.warn('Warning stack:', warning.stack)
      }
    })
  }
})

