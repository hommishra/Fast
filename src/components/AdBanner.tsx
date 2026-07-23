import { AdSlot } from '../types';
import AdDisplay from './AdDisplay';

interface AdBannerProps {
  slot?: AdSlot;
  position?: string;
  adSlots?: AdSlot[];
  className?: string;
  onDismiss?: () => void;
}

export default function AdBanner({ slot, position, adSlots, className = "", onDismiss }: AdBannerProps) {
  return <AdDisplay ad={slot} position={position} adSlots={adSlots} className={className} onDismiss={onDismiss} />;
}

