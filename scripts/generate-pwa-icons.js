// PWA icons generator script
// This script creates placeholder icons for PWA
// In production, replace these with actual branded icons

const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const publicDir = path.join(__dirname, '..', 'public')

// Create a simple SVG icon
const createSvgIcon = (size) => {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#000000"/>
    <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="#4f46e5"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size/4}px" fill="white" text-anchor="middle" dominant-baseline="middle">F</text>
  </svg>`
}

// Generate icons
sizes.forEach(size => {
  const svgContent = createSvgIcon(size)
  const filename = path.join(publicDir, `icon-${size}x${size}.svg`)
  
  fs.writeFileSync(filename, svgContent)
  console.log(`Created ${filename}`)
})

// Create special icons
const specialIcons = {
  'icon-video.svg': createSvgIcon(96),
  'icon-community.svg': createSvgIcon(96),
  'screenshot1.svg': `<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
    <rect width="1280" height="720" fill="#1a1a1a"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48px" fill="#4f46e5" text-anchor="middle" dominant-baseline="middle">FLEEKS Home</text>
  </svg>`,
  'screenshot2.svg': `<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
    <rect width="1280" height="720" fill="#1a1a1a"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48px" fill="#4f46e5" text-anchor="middle" dominant-baseline="middle">FLEEKS Videos</text>
  </svg>`
}

Object.entries(specialIcons).forEach(([filename, content]) => {
  const filepath = path.join(publicDir, filename)
  fs.writeFileSync(filepath, content)
  console.log(`Created ${filepath}`)
})

console.log('PWA icons generated successfully!')
console.log('Note: These are placeholder icons. Replace with actual branded icons for production.')