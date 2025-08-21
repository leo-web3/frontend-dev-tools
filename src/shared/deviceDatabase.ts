// Device specifications database for viewport simulation
export interface DeviceSpec {
  id: string;
  name: string;
  brand: 'iPhone' | 'iPad' | 'iWatch' | 'Samsung' | 'Google' | 'Xiaomi' | 'Generic';
  category: 'mobile' | 'tablet' | 'watch' | 'desktop' | 'laptop';
  viewport: {
    width: number;
    height: number;
  };
  screen: {
    width: number;
    height: number;
  };
  devicePixelRatio: number;
  userAgent: string;
  orientation?: 'portrait' | 'landscape';
  features?: string[];
}

// iPhone devices
const iPhoneDevices: DeviceSpec[] = [
  {
    id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    brand: 'iPhone',
    category: 'mobile',
    viewport: { width: 430, height: 932 },
    screen: { width: 1290, height: 2796 },
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    features: ['Dynamic Island', 'Face ID', 'A17 Pro'],
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    brand: 'iPhone',
    category: 'mobile',
    viewport: { width: 393, height: 852 },
    screen: { width: 1179, height: 2556 },
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    features: ['Dynamic Island', 'Face ID', 'A17 Pro'],
  },
  {
    id: 'iphone-15',
    name: 'iPhone 15',
    brand: 'iPhone',
    category: 'mobile',
    viewport: { width: 393, height: 852 },
    screen: { width: 1179, height: 2556 },
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    features: ['Dynamic Island', 'Face ID', 'A16 Bionic'],
  },
  {
    id: 'iphone-14-pro-max',
    name: 'iPhone 14 Pro Max',
    brand: 'iPhone',
    category: 'mobile',
    viewport: { width: 430, height: 932 },
    screen: { width: 1290, height: 2796 },
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    features: ['Dynamic Island', 'Face ID', 'A16 Bionic'],
  },
  {
    id: 'iphone-14-pro',
    name: 'iPhone 14 Pro',
    brand: 'iPhone',
    category: 'mobile',
    viewport: { width: 393, height: 852 },
    screen: { width: 1179, height: 2556 },
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    features: ['Dynamic Island', 'Face ID', 'A16 Bionic'],
  },
  {
    id: 'iphone-14',
    name: 'iPhone 14',
    brand: 'iPhone',
    category: 'mobile',
    viewport: { width: 390, height: 844 },
    screen: { width: 1170, height: 2532 },
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    features: ['Notch', 'Face ID', 'A15 Bionic'],
  },
  {
    id: 'iphone-13-pro-max',
    name: 'iPhone 13 Pro Max',
    brand: 'iPhone',
    category: 'mobile',
    viewport: { width: 428, height: 926 },
    screen: { width: 1284, height: 2778 },
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    features: ['Notch', 'Face ID', 'A15 Bionic'],
  },
  {
    id: 'iphone-13',
    name: 'iPhone 13',
    brand: 'iPhone',
    category: 'mobile',
    viewport: { width: 390, height: 844 },
    screen: { width: 1170, height: 2532 },
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    features: ['Notch', 'Face ID', 'A15 Bionic'],
  },
  {
    id: 'iphone-12-pro-max',
    name: 'iPhone 12 Pro Max',
    brand: 'iPhone',
    category: 'mobile',
    viewport: { width: 428, height: 926 },
    screen: { width: 1284, height: 2778 },
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    features: ['Notch', 'Face ID', 'A14 Bionic'],
  },
  {
    id: 'iphone-12',
    name: 'iPhone 12',
    brand: 'iPhone',
    category: 'mobile',
    viewport: { width: 390, height: 844 },
    screen: { width: 1170, height: 2532 },
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    features: ['Notch', 'Face ID', 'A14 Bionic'],
  },
  {
    id: 'iphone-se-3rd',
    name: 'iPhone SE (3rd gen)',
    brand: 'iPhone',
    category: 'mobile',
    viewport: { width: 375, height: 667 },
    screen: { width: 750, height: 1334 },
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    features: ['Touch ID', 'A15 Bionic'],
  },
];

// iPad devices
const iPadDevices: DeviceSpec[] = [
  {
    id: 'ipad-pro-12-9-m2',
    name: 'iPad Pro 12.9" (M2)',
    brand: 'iPad',
    category: 'tablet',
    viewport: { width: 1024, height: 1366 },
    screen: { width: 2048, height: 2732 },
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
    features: ['Face ID', 'M2 Chip', 'ProMotion'],
  },
  {
    id: 'ipad-pro-11-m2',
    name: 'iPad Pro 11" (M2)',
    brand: 'iPad',
    category: 'tablet',
    viewport: { width: 834, height: 1194 },
    screen: { width: 1668, height: 2388 },
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
    features: ['Face ID', 'M2 Chip', 'ProMotion'],
  },
  {
    id: 'ipad-air-5th',
    name: 'iPad Air (5th gen)',
    brand: 'iPad',
    category: 'tablet',
    viewport: { width: 820, height: 1180 },
    screen: { width: 1640, height: 2360 },
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
    features: ['Touch ID', 'M1 Chip'],
  },
  {
    id: 'ipad-10th',
    name: 'iPad (10th gen)',
    brand: 'iPad',
    category: 'tablet',
    viewport: { width: 820, height: 1180 },
    screen: { width: 1640, height: 2360 },
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
    features: ['Touch ID', 'A14 Bionic'],
  },
];

// Apple Watch devices
const iWatchDevices: DeviceSpec[] = [
  {
    id: 'apple-watch-ultra-2',
    name: 'Apple Watch Ultra 2',
    brand: 'iWatch',
    category: 'watch',
    viewport: { width: 410, height: 502 },
    screen: { width: 410, height: 502 },
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (Apple Watch; CPU watchOS 10_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/10.0 Mobile/21A5326a Safari/604.1',
    features: ['Digital Crown', 'Always-On Retina', 'S9 SiP'],
  },
  {
    id: 'apple-watch-series-9-45mm',
    name: 'Apple Watch Series 9 45mm',
    brand: 'iWatch',
    category: 'watch',
    viewport: { width: 396, height: 484 },
    screen: { width: 396, height: 484 },
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (Apple Watch; CPU watchOS 10_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/10.0 Mobile/21A5326a Safari/604.1',
    features: ['Digital Crown', 'Always-On Retina', 'S9 SiP'],
  },
  {
    id: 'apple-watch-series-9-41mm',
    name: 'Apple Watch Series 9 41mm',
    brand: 'iWatch',
    category: 'watch',
    viewport: { width: 352, height: 430 },
    screen: { width: 352, height: 430 },
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (Apple Watch; CPU watchOS 10_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/10.0 Mobile/21A5326a Safari/604.1',
    features: ['Digital Crown', 'Always-On Retina', 'S9 SiP'],
  },
];

// Samsung devices
const samsungDevices: DeviceSpec[] = [
  {
    id: 'samsung-galaxy-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung',
    category: 'mobile',
    viewport: { width: 412, height: 915 },
    screen: { width: 1440, height: 3120 },
    devicePixelRatio: 3.5,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    features: ['S Pen', '200MP Camera', 'Snapdragon 8 Gen 3'],
  },
  {
    id: 'samsung-galaxy-s24',
    name: 'Samsung Galaxy S24',
    brand: 'Samsung',
    category: 'mobile',
    viewport: { width: 384, height: 854 },
    screen: { width: 1080, height: 2340 },
    devicePixelRatio: 2.8125,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S921U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    features: ['AI Features', 'Snapdragon 8 Gen 3'],
  },
  {
    id: 'samsung-galaxy-z-fold-5',
    name: 'Samsung Galaxy Z Fold 5',
    brand: 'Samsung',
    category: 'mobile',
    viewport: { width: 344, height: 882 },
    screen: { width: 1812, height: 2176 },
    devicePixelRatio: 3.75,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-F946U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
    features: ['Foldable Display', 'S Pen Support', 'Snapdragon 8 Gen 2'],
  },
  {
    id: 'samsung-galaxy-tab-s9',
    name: 'Samsung Galaxy Tab S9',
    brand: 'Samsung',
    category: 'tablet',
    viewport: { width: 800, height: 1280 },
    screen: { width: 1600, height: 2560 },
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
    features: ['S Pen', 'AMOLED Display', 'Snapdragon 8 Gen 2'],
  },
];

// Google Pixel devices
const googlePixelDevices: DeviceSpec[] = [
  {
    id: 'google-pixel-8-pro',
    name: 'Google Pixel 8 Pro',
    brand: 'Google',
    category: 'mobile',
    viewport: { width: 412, height: 892 },
    screen: { width: 1344, height: 2992 },
    devicePixelRatio: 2.625,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
    features: ['AI Camera', 'Tensor G3', 'Pure Android'],
  },
  {
    id: 'google-pixel-8',
    name: 'Google Pixel 8',
    brand: 'Google',
    category: 'mobile',
    viewport: { width: 412, height: 915 },
    screen: { width: 1080, height: 2400 },
    devicePixelRatio: 2.625,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
    features: ['AI Features', 'Tensor G3', 'Pure Android'],
  },
  {
    id: 'google-pixel-fold',
    name: 'Google Pixel Fold',
    brand: 'Google',
    category: 'mobile',
    viewport: { width: 353, height: 841 },
    screen: { width: 1080, height: 2092 },
    devicePixelRatio: 3.5,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel Fold) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36',
    features: ['Foldable Display', 'Tensor G2', 'Pure Android'],
  },
  {
    id: 'google-pixel-tablet',
    name: 'Google Pixel Tablet',
    brand: 'Google',
    category: 'tablet',
    viewport: { width: 800, height: 1280 },
    screen: { width: 1600, height: 2560 },
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    features: ['Hub Mode', 'Tensor G2'],
  },
];

// Xiaomi devices
const xiaomiDevices: DeviceSpec[] = [
  {
    id: 'xiaomi-14-ultra',
    name: 'Xiaomi 14 Ultra',
    brand: 'Xiaomi',
    category: 'mobile',
    viewport: { width: 412, height: 915 },
    screen: { width: 1440, height: 3200 },
    devicePixelRatio: 3.5,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; 2405CPX3DG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    features: ['Leica Camera', 'Snapdragon 8 Gen 3', 'MIUI 14'],
  },
  {
    id: 'xiaomi-14',
    name: 'Xiaomi 14',
    brand: 'Xiaomi',
    category: 'mobile',
    viewport: { width: 412, height: 915 },
    screen: { width: 1200, height: 2670 },
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; 2312DRA50C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    features: ['Leica Camera', 'Snapdragon 8 Gen 3', 'MIUI 14'],
  },
  {
    id: 'xiaomi-pad-6',
    name: 'Xiaomi Pad 6',
    brand: 'Xiaomi',
    category: 'tablet',
    viewport: { width: 800, height: 1340 },
    screen: { width: 1800, height: 2880 },
    devicePixelRatio: 2.25,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; 23073RPD5C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
    features: ['Snapdragon 870', 'MIUI Pad'],
  },
  {
    id: 'redmi-note-13-pro',
    name: 'Redmi Note 13 Pro',
    brand: 'Xiaomi',
    category: 'mobile',
    viewport: { width: 393, height: 873 },
    screen: { width: 1080, height: 2400 },
    devicePixelRatio: 2.75,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; 23090RA14C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
    features: ['200MP Camera', 'MediaTek Dimensity', 'MIUI 14'],
  },
];

// Generic desktop and laptop sizes
const genericDevices: DeviceSpec[] = [
  {
    id: 'desktop-4k',
    name: '4K Desktop',
    brand: 'Generic',
    category: 'desktop',
    viewport: { width: 3840, height: 2160 },
    screen: { width: 3840, height: 2160 },
    devicePixelRatio: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    features: ['4K Resolution'],
  },
  {
    id: 'desktop-2k',
    name: '2K Desktop',
    brand: 'Generic',
    category: 'desktop',
    viewport: { width: 2560, height: 1440 },
    screen: { width: 2560, height: 1440 },
    devicePixelRatio: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    features: ['2K Resolution'],
  },
  {
    id: 'desktop-fhd',
    name: 'Full HD Desktop',
    brand: 'Generic',
    category: 'desktop',
    viewport: { width: 1920, height: 1080 },
    screen: { width: 1920, height: 1080 },
    devicePixelRatio: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    features: ['Full HD'],
  },
  {
    id: 'laptop-15inch',
    name: '15" Laptop',
    brand: 'Generic',
    category: 'laptop',
    viewport: { width: 1366, height: 768 },
    screen: { width: 1366, height: 768 },
    devicePixelRatio: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    features: ['HD Display'],
  },
  {
    id: 'laptop-13inch',
    name: '13" Laptop',
    brand: 'Generic',
    category: 'laptop',
    viewport: { width: 1280, height: 800 },
    screen: { width: 1280, height: 800 },
    devicePixelRatio: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    features: ['Compact Display'],
  },
];

// Combine all devices
export const DEVICE_DATABASE: DeviceSpec[] = [
  ...iPhoneDevices,
  ...iPadDevices,
  ...iWatchDevices,
  ...samsungDevices,
  ...googlePixelDevices,
  ...xiaomiDevices,
  ...genericDevices,
];

// Helper functions
export const getDevicesByBrand = (brand: DeviceSpec['brand']): DeviceSpec[] => {
  return DEVICE_DATABASE.filter(device => device.brand === brand);
};

export const getDevicesByCategory = (category: DeviceSpec['category']): DeviceSpec[] => {
  return DEVICE_DATABASE.filter(device => device.category === category);
};

export const getDeviceById = (id: string): DeviceSpec | undefined => {
  return DEVICE_DATABASE.find(device => device.id === id);
};

// Popular device presets
export const POPULAR_DEVICES = [
  'iphone-15-pro',
  'iphone-14',
  'ipad-pro-11-m2',
  'samsung-galaxy-s24-ultra',
  'google-pixel-8-pro',
  'xiaomi-14',
  'desktop-fhd',
  'laptop-15inch',
];

export const COFFEE_MODE_DEVICES = [
  'iphone-15-pro-max',
  'ipad-pro-12-9-m2',
  'samsung-galaxy-s24-ultra',
  'desktop-4k',
];