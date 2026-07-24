import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'ultrawide' | 'tv' | 'foldable';
export type Orientation = 'portrait' | 'landscape';

export interface DeviceInfo {
  deviceType: DeviceType;
  orientation: Orientation;
  isTouch: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  isMobile: boolean;
  isTablet: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  isUltraWide: boolean;
  isTV: boolean;
  isFoldable: boolean;
  browserName: string;
}

export function useDeviceDetect(): DeviceInfo {
  const getDeviceInfo = (): DeviceInfo => {
    if (typeof window === 'undefined') {
      return {
        deviceType: 'desktop',
        orientation: 'landscape',
        isTouch: false,
        screenWidth: 1280,
        screenHeight: 800,
        pixelRatio: 1,
        isMobile: false,
        isTablet: false,
        isLaptop: true,
        isDesktop: true,
        isUltraWide: false,
        isTV: false,
        isFoldable: false,
        browserName: 'Unknown'
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const ua = navigator.userAgent || '';
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const orientation: Orientation = width > height ? 'landscape' : 'portrait';
    const pixelRatio = window.devicePixelRatio || 1;

    // Detect browser
    let browserName = 'Browser';
    if (/instagram/i.test(ua)) browserName = 'Instagram In-App';
    else if (/fban|fbav/i.test(ua)) browserName = 'Facebook In-App';
    else if (/twitter|x-app/i.test(ua)) browserName = 'X In-App';
    else if (/samsungbrowser/i.test(ua)) browserName = 'Samsung Internet';
    else if (/chrome|crios/i.test(ua)) browserName = 'Chrome';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browserName = 'Safari';
    else if (/firefox|fxios/i.test(ua)) browserName = 'Firefox';
    else if (/edg/i.test(ua)) browserName = 'Edge';
    else if (/opera|opr/i.test(ua)) browserName = 'Opera';

    // TV Detection
    const isTV = /smart-tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast|vizio|webos/i.test(ua) || (width >= 1920 && !isTouch && /tv|large-screen/i.test(ua));

    // Foldable detection (e.g. Samsung Z Fold, Surface Duo with dual screen or unique aspect ratio when unfolded)
    const aspect = width / height;
    const isFoldableUA = /fold|galaxy z|surface duo/i.test(ua);
    const isFoldableAspect = isTouch && aspect >= 0.85 && aspect <= 1.25 && width >= 600 && width <= 900;
    const isFoldable = isFoldableUA || isFoldableAspect;

    // Device classification logic
    let deviceType: DeviceType = 'desktop';

    if (isTV) {
      deviceType = 'tv';
    } else if (isFoldable) {
      deviceType = 'foldable';
    } else if (width < 640 || (/mobile|iphone|ipod|android.*mobile/i.test(ua) && width < 768)) {
      deviceType = 'mobile';
    } else if (width >= 640 && width < 1024 || (/ipad|android(?!.*mobile)/i.test(ua) && width < 1024)) {
      deviceType = 'tablet';
    } else if (width >= 1024 && width < 1440) {
      deviceType = 'laptop';
    } else if (width >= 1440 && width < 2200) {
      deviceType = 'desktop';
    } else {
      deviceType = 'ultrawide';
    }

    return {
      deviceType,
      orientation,
      isTouch,
      screenWidth: width,
      screenHeight: height,
      pixelRatio,
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet' || deviceType === 'foldable',
      isLaptop: deviceType === 'laptop',
      isDesktop: deviceType === 'desktop' || deviceType === 'ultrawide' || deviceType === 'tv',
      isUltraWide: deviceType === 'ultrawide',
      isTV,
      isFoldable,
      browserName
    };
  };

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(getDeviceInfo);

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(getDeviceInfo());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return deviceInfo;
}
