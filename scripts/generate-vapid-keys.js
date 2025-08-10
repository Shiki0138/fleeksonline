// VAPID key generator for push notifications
const webpush = require('web-push')
const fs = require('fs')
const path = require('path')

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys()

// Create .env.local file content
const envContent = `# PWA Push Notification Configuration
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
VAPID_EMAIL=support@app.fleeks.jp

# Add these to your .env.local file
`

// Save to file
const envPath = path.join(__dirname, '..', '.env.local.example')
fs.writeFileSync(envPath, envContent)

console.log('VAPID keys generated successfully!')
console.log('-----------------------------------')
console.log('Public Key:', vapidKeys.publicKey)
console.log('Private Key:', vapidKeys.privateKey)
console.log('-----------------------------------')
console.log('Keys saved to .env.local.example')
console.log('Copy these to your .env.local file')
console.log('WARNING: Keep your private key secure!')