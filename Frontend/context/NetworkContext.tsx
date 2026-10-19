import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';

type NetworkContextValue = {
  /** `true` when online, `false` when offline, `null` until the first check completes. */
  isConnected: boolean | null;
};

const NetworkContext = createContext<NetworkContextValue | null>(null);

/**
 * Subscribes to native device connectivity via `@react-native-community/netinfo`
 * and exposes `isConnected` to every screen through `useNetworkStatus`.
 *
 * Placed at the root of the app so the offline banner reflects true device
 * reachability rather than the browser's unreliable `navigator.onLine`.
 */
export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    NetInfo.fetch().then((state) => {
      if (active) setIsConnected(state.isConnected);
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (active) setIsConnected(state.isConnected);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetworkStatus(): { isOnline: boolean } {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetworkStatus must be used within NetworkProvider');
  }

  // Default to online while the initial state is unknown so we don't flash
  // a spurious offline banner before the first reachability check.
  return { isOnline: context.isConnected ?? true };
}
