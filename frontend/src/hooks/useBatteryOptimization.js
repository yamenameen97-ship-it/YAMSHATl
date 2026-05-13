/**
 * Hook لتحسين استهلاك البطارية
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { batteryOptimizer } from '../services/batteryOptimizer';

/**
 * Hook لمراقبة حالة البطارية
 */
export const useBatteryStatus = () => {
  const [batteryStatus, setBatteryStatus] = useState(batteryOptimizer.getBatteryStatus());

  useEffect(() => {
    const unsubscribe = batteryOptimizer.on('batterychange', (status) => {
      setBatteryStatus(status);
    });

    return () => unsubscribe?.();
  }, []);

  return batteryStatus;
};

/**
 * Hook لتحسين الفيديوهات
 */
export const useOptimizedVideo = (videoRef) => {
  useEffect(() => {
    if (!videoRef?.current) return;

    const unregister = batteryOptimizer.registerVideoElement(videoRef.current);

    return () => unregister?.();
  }, [videoRef]);

  const pauseVideo = useCallback(() => {
    if (videoRef?.current) {
      videoRef.current.pause();
    }
  }, [videoRef]);

  const playVideo = useCallback(() => {
    if (videoRef?.current) {
      videoRef.current.play();
    }
  }, [videoRef]);

  return { pauseVideo, playVideo };
};

/**
 * Hook لتحسين تحديثات Socket
 */
export const useOptimizedSocket = (socketKey, interval = 1000) => {
  const intervalRef = useRef(interval);

  useEffect(() => {
    const unregister = batteryOptimizer.registerSocketUpdate(socketKey, interval);

    return () => unregister?.();
  }, [socketKey, interval]);

  const updateInterval = useCallback((newInterval) => {
    intervalRef.current = newInterval;
    batteryOptimizer.updateSocketInterval(socketKey, newInterval);
  }, [socketKey]);

  return { updateInterval, currentInterval: intervalRef.current };
};

/**
 * Hook لمنع إعادة التصيير غير الضرورية
 */
export const useOptimizedRender = (componentKey, dependencies = []) => {
  const shouldRenderRef = useRef(true);

  useEffect(() => {
    shouldRenderRef.current = batteryOptimizer.shouldRender(componentKey, dependencies);
  }, dependencies);

  return shouldRenderRef.current;
};

/**
 * Hook لتحسين الأداء العام
 */
export const useBatteryOptimization = (options = {}) => {
  const {
    videoRefs = [],
    socketKeys = [],
    componentKey = 'default',
    dependencies = []
  } = options;

  const batteryStatus = useBatteryStatus();
  const shouldRender = useOptimizedRender(componentKey, dependencies);

  // تحسين الفيديوهات
  useEffect(() => {
    videoRefs.forEach(ref => {
      if (ref?.current) {
        batteryOptimizer.registerVideoElement(ref.current);
      }
    });

    return () => {
      videoRefs.forEach(ref => {
        if (ref?.current) {
          batteryOptimizer.videoElements.delete(ref.current);
        }
      });
    };
  }, [videoRefs]);

  // تحسين Socket
  useEffect(() => {
    const unregisters = socketKeys.map(key => 
      batteryOptimizer.registerSocketUpdate(key)
    );

    return () => {
      unregisters.forEach(unregister => unregister?.());
    };
  }, [socketKeys]);

  return {
    batteryStatus,
    shouldRender,
    isLowBattery: batteryStatus.isLowBattery,
    isCritical: batteryStatus.isCritical,
    isCharging: batteryStatus.isCharging
  };
};

/**
 * Hook لتحسين الرسوميات بناءً على البطارية
 */
export const useAdaptiveGraphics = () => {
  const batteryStatus = useBatteryStatus();
  const [graphicsLevel, setGraphicsLevel] = useState('high');

  useEffect(() => {
    if (batteryStatus.isCritical) {
      setGraphicsLevel('minimal');
    } else if (batteryStatus.isLowBattery) {
      setGraphicsLevel('low');
    } else if (batteryStatus.isCharging) {
      setGraphicsLevel('high');
    } else {
      setGraphicsLevel('medium');
    }
  }, [batteryStatus]);

  const getAnimationDuration = useCallback(() => {
    switch (graphicsLevel) {
      case 'minimal':
        return 0;
      case 'low':
        return 200;
      case 'medium':
        return 400;
      case 'high':
        return 600;
      default:
        return 400;
    }
  }, [graphicsLevel]);

  const shouldShowComplexAnimations = useCallback(() => {
    return graphicsLevel === 'high' || graphicsLevel === 'medium';
  }, [graphicsLevel]);

  const shouldShowBackgroundEffects = useCallback(() => {
    return graphicsLevel === 'high';
  }, [graphicsLevel]);

  return {
    graphicsLevel,
    getAnimationDuration,
    shouldShowComplexAnimations,
    shouldShowBackgroundEffects
  };
};

/**
 * Hook لتحسين الشبكة بناءً على البطارية
 */
export const useAdaptiveNetwork = () => {
  const batteryStatus = useBatteryStatus();
  const [networkQuality, setNetworkQuality] = useState('high');

  useEffect(() => {
    if (batteryStatus.isCritical) {
      setNetworkQuality('minimal');
    } else if (batteryStatus.isLowBattery) {
      setNetworkQuality('low');
    } else if (batteryStatus.isCharging) {
      setNetworkQuality('high');
    } else {
      setNetworkQuality('medium');
    }
  }, [batteryStatus]);

  const getImageQuality = useCallback(() => {
    switch (networkQuality) {
      case 'minimal':
        return 0.3;
      case 'low':
        return 0.5;
      case 'medium':
        return 0.7;
      case 'high':
        return 1;
      default:
        return 0.7;
    }
  }, [networkQuality]);

  const getVideoQuality = useCallback(() => {
    switch (networkQuality) {
      case 'minimal':
        return '240p';
      case 'low':
        return '360p';
      case 'medium':
        return '720p';
      case 'high':
        return '1080p';
      default:
        return '720p';
    }
  }, [networkQuality]);

  const shouldAutoPlayVideos = useCallback(() => {
    return networkQuality === 'high' || networkQuality === 'medium';
  }, [networkQuality]);

  return {
    networkQuality,
    getImageQuality,
    getVideoQuality,
    shouldAutoPlayVideos
  };
};
