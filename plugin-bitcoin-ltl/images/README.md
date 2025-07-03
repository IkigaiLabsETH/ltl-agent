# Image Requirements for Plugin Publishing

This directory needs to contain the required images for ElizaOS plugin publishing.

## 📁 Required Files

### 1. `logo.jpg` 
- **Dimensions**: 400x400px (square)
- **Max Size**: 500KB
- **Format**: JPG
- **Purpose**: Plugin logo displayed in registry and listings

### 2. `banner.jpg`
- **Dimensions**: 1280x640px (2:1 aspect ratio)
- **Max Size**: 1MB  
- **Format**: JPG
- **Purpose**: Header image for plugin page

## 🎨 Design Guidelines

### Logo Design
- Clean, simple design that works at small sizes
- Bitcoin/cryptocurrency theme preferred
- High contrast for visibility
- Should represent the LiveTheLifeTV brand

### Banner Design
- Professional, modern appearance
- Include plugin name: "Bitcoin LTL Plugin"
- Bitcoin/cryptocurrency visual elements
- LiveTheLifeTV branding
- Clear, readable text

## 📝 Image Creation Options

### Option 1: Create Your Own
Use design tools like:
- Figma
- Canva
- Adobe Photoshop
- GIMP (free)

### Option 2: AI Generation
Use AI tools like:
- DALL-E
- Midjourney
- Stable Diffusion

Sample prompts:
- **Logo**: "Bitcoin logo with LTL letters, clean design, orange and black colors, square format"
- **Banner**: "Bitcoin cryptocurrency banner with LiveTheLifeTV branding, professional design, 1280x640"

### Option 3: Template/Stock Images
- Unsplash (free)
- Pexels (free)
- Shutterstock (paid)

## ✅ Validation

Before publishing, ensure:
- [ ] `logo.jpg` exists and is 400x400px, <500KB
- [ ] `banner.jpg` exists and is 1280x640px, <1MB
- [ ] Images are high quality and professional
- [ ] No copyright issues

## 🚀 Next Steps

1. Create both required images
2. Place them in this directory
3. Run `elizaos publish --test` to validate
4. Proceed with publishing when images are ready

The `elizaos publish` command will automatically validate these requirements before publishing. 