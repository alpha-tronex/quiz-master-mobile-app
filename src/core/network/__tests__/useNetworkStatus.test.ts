import { renderHook, waitFor } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStatus } from '../useNetworkStatus';

const netInfoMock = NetInfo as unknown as {
    __setState: (state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => void;
    __reset: () => void;
};

afterEach(() => {
    netInfoMock.__reset();
});

describe('useNetworkStatus', () => {
    test('defaults to online', async () => {
        const { result } = await renderHook(() => useNetworkStatus());

        await waitFor(() => expect(result.current).toBe(true));
    });

    test('reports offline when NetInfo reports no connection', async () => {
        const { result } = await renderHook(() => useNetworkStatus());
        await waitFor(() => expect(result.current).toBe(true));

        netInfoMock.__setState({ isConnected: false, isInternetReachable: false });

        await waitFor(() => expect(result.current).toBe(false));
    });

    test('returns to online once connectivity is restored', async () => {
        const { result } = await renderHook(() => useNetworkStatus());
        await waitFor(() => expect(result.current).toBe(true));

        netInfoMock.__setState({ isConnected: false, isInternetReachable: false });
        await waitFor(() => expect(result.current).toBe(false));

        netInfoMock.__setState({ isConnected: true, isInternetReachable: true });
        await waitFor(() => expect(result.current).toBe(true));
    });

    test('treats a null isInternetReachable as online while connected', async () => {
        netInfoMock.__setState({ isConnected: true, isInternetReachable: null });
        const { result } = await renderHook(() => useNetworkStatus());

        await waitFor(() => expect(result.current).toBe(true));
    });

    test('reports offline when isConnected is false even if reachability is unknown', async () => {
        netInfoMock.__setState({ isConnected: false, isInternetReachable: null });
        const { result } = await renderHook(() => useNetworkStatus());

        await waitFor(() => expect(result.current).toBe(false));
    });
});
