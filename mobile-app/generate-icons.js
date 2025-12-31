#!/usr/bin/env node

// Script to generate iOS app icons from the base SVG icon
const fs = require('fs');
const path = require('path');

// Base SVG icon content
const iconSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="1024" height="1024" rx="128" fill="#2c3e50"/>
<svg x="256" y="256" width="512" height="512" viewBox="0 0 24 24" fill="white">
<path d="M16 6h-1V5c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v1H6c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM9 5h4c.55 0 1 .45 1 1v1H8V6c0-.55.45-1 1-1zM16 8v3H13V8h3zM11 11H8V8h3v3zM16 14H13v-3h3v3zM11 14H8v-3h3v3zM16 17H6V8H13v9h3z"/>
</svg>
</svg>`;

// Create a simple fallback icon as base64 PNG for each size
const createIconDataUrl = (size) => {
  // This is a simple base64 encoded PNG icon
  // In a real implementation, you'd use a proper image processing library
  const canvas = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${Math.round(size/8)}" fill="#2c3e50"/>
    <text x="50%" y="50%" font-family="Arial" font-size="${Math.round(size/3)}" fill="white" text-anchor="middle" dominant-baseline="central">🃏</text>
  </svg>`;
  
  return `data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`;
};

// iOS icon sizes required
const iconSizes = [
  { name: 'icon-40.png', size: 40 },
  { name: 'icon-40@2x.png', size: 80 },
  { name: 'icon-40@3x.png', size: 120 },
  { name: 'icon-60@2x.png', size: 120 },
  { name: 'icon-60@3x.png', size: 180 },
  { name: 'icon-76.png', size: 76 },
  { name: 'icon-76@2x.png', size: 152 },
  { name: 'icon-83.5@2x.png', size: 167 },
  { name: 'icon-1024.png', size: 1024 }
];

// Create placeholder images (SVG format)
iconSizes.forEach(icon => {
  const svgContent = `<svg width="${icon.size}" height="${icon.size}" viewBox="0 0 ${icon.size} ${icon.size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${icon.size}" height="${icon.size}" rx="${Math.round(icon.size/8)}" fill="#2c3e50"/>
    <text x="50%" y="50%" font-family="Arial" font-size="${Math.round(icon.size/3)}" fill="white" text-anchor="middle" dominant-baseline="central">🃏</text>
  </svg>`;
  
  // Save as SVG (can be used directly by Cordova)
  fs.writeFileSync(path.join(__dirname, 'res', 'ios', icon.name.replace('.png', '.svg')), svgContent);
  
  console.log(`Created ${icon.name.replace('.png', '.svg')} (${icon.size}x${icon.size})`);
});

// Create splash screens
const splashScreens = [
  { name: 'Default@2x~universal~anyany.png', width: 1334, height: 750 },
  { name: 'Default@3x~universal~anyany.png', width: 2208, height: 1242 }
];

splashScreens.forEach(splash => {
  const svgContent = `<svg width="${splash.width}" height="${splash.height}" viewBox="0 0 ${splash.width} ${splash.height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${splash.width}" height="${splash.height}" fill="#2c3e50"/>
    <text x="50%" y="45%" font-family="Arial" font-size="${Math.round(splash.width/15)}" fill="white" text-anchor="middle" dominant-baseline="central">🃏</text>
    <text x="50%" y="55%" font-family="Arial" font-size="${Math.round(splash.width/25)}" fill="white" text-anchor="middle" dominant-baseline="central">Pinochle Score Keeper</text>
  </svg>`;
  
  fs.writeFileSync(path.join(__dirname, 'res', 'ios', splash.name.replace('.png', '.svg')), svgContent);
  
  console.log(`Created ${splash.name.replace('.png', '.svg')} (${splash.width}x${splash.height})`);
});

console.log('Icon generation complete! Note: SVG files created. For production, convert to PNG using ImageMagick or similar tool.');