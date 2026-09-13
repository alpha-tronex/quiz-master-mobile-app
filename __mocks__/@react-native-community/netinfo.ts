type NetInfoState = {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
};

type Listener = (state: NetInfoState) => void;

let currentState: NetInfoState = { isConnected: true, isInternetReachable: true };
const listeners = new Set<Listener>();

function addEventListener(listener: Listener): () => void {
    listeners.add(listener);
    listener(currentState);
    return () => {
        listeners.delete(listener);
    };
}

async function fetch(): Promise<NetInfoState> {
    return currentState;
}

/** Test-only helper: simulate a connectivity change and notify subscribers. */
function __setState(state: Partial<NetInfoState>): void {
    currentState = { ...currentState, ...state };
    listeners.forEach((listener) => listener(currentState));
}

/** Test-only helper to reset state between test cases. */
function __reset(): void {
    currentState = { isConnected: true, isInternetReachable: true };
    listeners.clear();
}

export default { addEventListener, fetch, __setState, __reset };
