import { build } from 'vite';
import { resolve } from 'path';
import fs from 'fs-extra';

const __dirname = process.cwd();

async function buildExtension() {
  // Clean dist directory
  await fs.remove(resolve(__dirname, 'dist'));
  await fs.ensureDir(resolve(__dirname, 'dist'));

  console.log('🏗️  Building popup...');
  // Build popup (can use ES modules)
  await build({
    configFile: false,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      rollupOptions: {
        input: resolve(__dirname, 'src/popup/index.html'),
        output: {
          format: 'es',
          entryFileNames: 'popup.js',
          chunkFileNames: 'chunks/[name].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              return 'assets/[name].[ext]';
            }
            return 'assets/[name].[ext]';
          },
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    esbuild: {
      drop: ['console', 'debugger'],
    },
  });

  console.log('🏗️  Building background script...');
  // Build background script as IIFE
  await build({
    configFile: false,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, 'src/background/index.ts'),
        formats: ['iife'],
        name: 'BackgroundScript',
        fileName: () => 'background.js',
      },
      rollupOptions: {
        external: ['chrome'],
        output: {
          globals: {
            chrome: 'chrome'
          },
          inlineDynamicImports: true,
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    esbuild: {
      drop: ['console', 'debugger'],
    },
  });

  console.log('🏗️  Building content script...');
  // Build content script as IIFE
  await build({
    configFile: false,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, 'src/content/index.ts'),
        formats: ['iife'],
        name: 'ContentScript',
        fileName: () => 'content.js',
      },
      rollupOptions: {
        external: ['chrome'],
        output: {
          globals: {
            chrome: 'chrome'
          },
          inlineDynamicImports: true,
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    esbuild: {
      drop: ['console', 'debugger'],
    },
  });

  console.log('📦 Running post-build tasks...');
  
  // Copy manifest and assets manually since we're not using the post-build script
  const srcDir = resolve(__dirname, 'src');
  const distDir = resolve(__dirname, 'dist');
  
  // Copy manifest.json
  await fs.copy(
    resolve(srcDir, 'manifest.json'),
    resolve(distDir, 'manifest.json')
  );
  
  // Copy assets if they exist
  const assetsPath = resolve(srcDir, 'assets');
  if (await fs.pathExists(assetsPath)) {
    await fs.copy(
      assetsPath,
      resolve(distDir, 'assets')
    );
  }
  
  // Create icon files
  const iconSizes = [16, 32, 48, 128];
  const iconsDir = resolve(distDir, 'assets', 'icons');
  await fs.ensureDir(iconsDir);
  
  const svgSource = resolve(srcDir, 'assets', 'icons', 'icon.svg');
  if (await fs.pathExists(svgSource)) {
    for (const size of iconSizes) {
      await fs.copy(svgSource, resolve(iconsDir, `icon-${size}.svg`));
    }
  }
  
  console.log('✅ Extension build completed successfully!');
}

buildExtension().catch(console.error);