import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

function isConnected(state: NetInfoState): boolean {
    // isInternetReachable can be null while NetInfo is still determining reachability;
    // treat null as "assume online" to avoid flashing the offline banner during startup,
    // and fall back to isConnected otherwise.
    if (state.isInternetReachable === null) {
        return state.isConnected ?? true;
    }
    return state.isConnected === true && state.isInternetReachable !== false;
}

/**
 * Tracks device connectivity via NetInfo. Returns `true` when the device
 * appears to have a working internet connection, `false` otherwise.
 *
 * Used to drive the global `OfflineBanner` and to decide when Retry actions
 * on error states are likely to succeed.
 */
export function useNetworkStatus(): boolean {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsOnline(isConnected(state));
        });
        NetInfo.fetch().then((state) => setIsOnline(isConnected(state)));
        return unsubscribe;
    }, []);

    return isOnline;
}
