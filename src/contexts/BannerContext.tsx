import { createContext, useContext, useState, ReactNode } from 'react';

interface BannerContextType {
  bannerHeight: number;
  setBannerHeight: (height: number) => void;
}

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export function BannerProvider({ children }: { children: ReactNode }) {
  const [bannerHeight, setBannerHeight] = useState(0);

  return (
    <BannerContext.Provider value={{ bannerHeight, setBannerHeight }}>
      {children}
    </BannerContext.Provider>
  );
}

export function useBanner() {
  const context = useContext(BannerContext);
  if (context === undefined) {
    throw new Error('useBanner must be used within a BannerProvider');
  }
  return context;
}
