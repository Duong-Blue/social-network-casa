import { Redirect, useRootNavigationState } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Index() {
  const rootNavigationState = useRootNavigationState();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (rootNavigationState?.key) {
      setIsReady(true);
    }
  }, [rootNavigationState?.key]);

  if (!isReady) {
    return null;
  }

  return <Redirect href="/(tab)" />;
}
