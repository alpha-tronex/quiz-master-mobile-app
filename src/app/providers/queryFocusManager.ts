import { AppStateStatus, Platform } from 'react-native';
import { focusManager } from '@tanstack/react-query';

/**
 * React Query's `refetchOnWindowFocus` (on by default) is a browser concept
 * and does nothing on React Native until something tells `focusManager`
 * when the app is actually focused. Without this, a screen like
 * QuizListScreen — kept mounted by the bottom-tab navigator once visited —
 * never refetches when the student backgrounds and re-foregrounds the app,
 * so e.g. a quiz an admin just reopened doesn't show as retake-able until
 * the app is force-quit and relaunched.
 *
 * Wired to RN's `AppState` in AppProviders.tsx. Exported standalone (rather
 * than inlined in a useEffect) so the active/background/inactive mapping is
 * unit-testable without rendering a component. No-op on web, where the
 * browser's own window-focus handling already applies.
 */
export function onAppStateChange(status: AppStateStatus): void {
    if (Platform.OS !== 'web') {
        focusManager.setFocused(status === 'active');
    }
}
