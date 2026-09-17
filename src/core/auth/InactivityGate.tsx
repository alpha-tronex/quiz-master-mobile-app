import React, { ReactNode, useMemo } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { useInactivityTimeout } from './useInactivityTimeout';

export interface InactivityGateProps {
    children: ReactNode;
}

/**
 * Root-level wrapper (mounted once, around `RootNavigator`) that resets the
 * 15-minute inactivity timer on every touch anywhere in the app.
 *
 * Uses `PanResponder`'s *capture* phase — `onStartShouldSetPanResponderCapture`
 * fires for every touch before any child gets a chance to claim the
 * responder, and returning `false` means this view never actually becomes
 * the responder. That combination lets it observe every touch purely as a
 * side effect, with zero impact on nested `Touchable`/`ScrollView`/etc.
 * gesture handling. No gesture library dependency needed — `PanResponder`
 * ships with React Native core.
 *
 * Built via `useMemo` rather than `useRef(...).current` so the render body
 * never reads a ref's current value directly (the pattern React's
 * `react-hooks/refs` lint rule flags), while still keeping one stable
 * `PanResponder` instance across re-renders.
 */
export function InactivityGate({ children }: InactivityGateProps) {
    const { notifyActivity } = useInactivityTimeout();

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponderCapture: () => {
                    notifyActivity();
                    return false;
                }
            }),
        [notifyActivity]
    );

    return (
        <View style={styles.flex} testID="inactivity-gate" {...panResponder.panHandlers}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1
    }
});
