import * as StoreReview from 'expo-store-review';
import { useAppStore } from '../stores/useAppStore';

/**
 * Request an App Store review if conditions are met.
 * - Minimum 5 launches
 * - At least 30 days since last prompt
 */
export async function maybeRequestReview(): Promise<boolean> {
  const store = useAppStore.getState();

  if (!store.shouldPromptReview()) {
    return false;
  }

  const isAvailable = await StoreReview.isAvailableAsync();
  if (!isAvailable) {
    return false;
  }

  try {
    await StoreReview.requestReview();
    store.setReviewPrompted();
    return true;
  } catch {
    return false;
  }
}

/**
 * Force open the App Store review page.
 */
export async function openStoreReview(): Promise<void> {
  const isAvailable = await StoreReview.isAvailableAsync();
  if (isAvailable) {
    await StoreReview.requestReview();
  }
}
