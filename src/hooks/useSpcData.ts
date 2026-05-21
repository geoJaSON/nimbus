import { useEffect } from 'react';
import { fetchSpcDay1Outlook } from '../lib/spcOutlook';
import { useSpcStore } from '../store/spcStore';

const REFRESH_MS = 30 * 60 * 1000;

export function useSpcData() {
  const setOutlook = useSpcStore((s) => s.setOutlook);

  useEffect(() => {
    async function load() {
      const features = await fetchSpcDay1Outlook();
      setOutlook(features, new Date());
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, []);
}
