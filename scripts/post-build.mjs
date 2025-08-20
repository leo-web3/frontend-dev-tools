import fs from 'fs-extra';
import path from 'path';

async function postBuild() {
  const srcDir = path.resolve(process.cwd(), 'src');
  const distDir = path.resolve(process.cwd(), 'dist');
  
  try {
    // Copy manifest.json to dist
    await fs.copy(
      path.join(srcDir, 'manifest.json'),
      path.join(distDir, 'manifest.json')
    );
    
    // Copy assets directory if it exists
    const assetsPath = path.join(srcDir, 'assets');
    if (await fs.pathExists(assetsPath)) {
      await fs.copy(
        assetsPath,
        path.join(distDir, 'assets')
      );
    }
    
    // Create icon files from SVG (placeholder - would need actual conversion in real implementation)
    const iconSizes = [16, 32, 48, 128];
    const iconsDir = path.join(distDir, 'assets', 'icons');
    await fs.ensureDir(iconsDir);
    
    // For now, just copy the SVG as placeholder
    const svgSource = path.join(srcDir, 'assets', 'icons', 'icon.svg');
    if (await fs.pathExists(svgSource)) {
      for (const size of iconSizes) {
        await fs.copy(svgSource, path.join(iconsDir, `icon-${size}.svg`));
      }
    }
    
    console.log('✅ Post-build tasks completed successfully');
    console.log('📦 Extension files copied to dist/');
    
  } catch (error) {
    console.error('❌ Post-build failed:', error);
    process.exit(1);
  }
}

postBuild();