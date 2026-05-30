import { useEffect } from "react";

/**
 * useAdminPolling - Polls all admin data every 5 seconds to keep all tabs in sync.
 * @param fetchAllData - function that fetches all admin data (categories, products, banners, notifications, etc)
 */
function useAdminPolling(fetchAllData: () => void) {
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchAllData();
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchAllData]);
}

export default useAdminPolling;
