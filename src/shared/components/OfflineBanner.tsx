import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';

/**
 * Persistent banner shown across the whole app while the device has no
 * network connection. Rendered by `RootNavigator` above the active
 * navigator so it's visible regardless of which screen/tab is showing.
 *
 * `warning`'s dark-on-yellow combination clears WCAG's 4.5:1 text contrast,
 * so `text` (not `textMuted`/`textInverse`) is used for the label here.
 */
export function OfflineBanner() {
    return (
        <View style={styles.container} accessibilityRole="alert" accessibilityLiveRegion="polite" testID="offline-banner">
            <Ionicons name="cloud-offline-outline" size={16} color={colors.text} />
            <Text style={styles.label}>No internet connection</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.warning
    },
    label: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        color: colors.text
    }
});
