/**
 * Real-time URL Search Service (Client-side)
 * Calls backend API to search VaultOfCodes website in real-time
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Search VaultOfCodes website for relevant URLs based on query
 * @param {string} query - User's search query
 * @param {string} intent - Detected intent
 * @returns {Promise<Object>} Found URL or null
 */
export async function searchWebsiteRealtime(query, intent) {
  console.log(`[Realtime Search] Searching for: "${query}", Intent: ${intent}`);

  try {
    const response = await fetch(`${API_BASE}/search-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        intent: intent || 'general_query'
      })
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const result = await response.json();

    if (result.found && result.url) {
      console.log(`[Realtime Search] ✓ Found URL: ${result.url}`);
      return result;
    }

    console.log(`[Realtime Search] ✗ No specific URL found`);
    return null;

  } catch (error) {
    console.error(`[Realtime Search] Error:`, error.message);
    return null;
  }
}
