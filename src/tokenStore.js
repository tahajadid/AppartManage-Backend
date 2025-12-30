// Temporary in-memory token store.
// Replace with a persistent store (Firestore, PostgreSQL, etc.) in production.

const tokensByUser = new Map(); // userId -> Set<token>
const tokenToUser = new Map(); // token -> userId

const registerToken = (userId, token, platform = 'unknown') => {
  if (!userId || !token) return;

  if (!tokensByUser.has(userId)) {
    tokensByUser.set(userId, new Set());
  }
  tokensByUser.get(userId).add(token);
  tokenToUser.set(token, userId);

  console.log(`Registered token for user ${userId} (${platform})`);
};

const removeToken = (token) => {
  const userId = tokenToUser.get(token);
  if (userId) {
    const set = tokensByUser.get(userId);
    if (set) {
      set.delete(token);
      if (set.size === 0) {
        tokensByUser.delete(userId);
      }
    }
    tokenToUser.delete(token);
    console.log(`Removed token for user ${userId}`);
  }
};

const getTokensForUser = (userId) => {
  return Array.from(tokensByUser.get(userId) || []);
};

const clearAll = () => {
  tokensByUser.clear();
  tokenToUser.clear();
};

module.exports = {
  registerToken,
  removeToken,
  getTokensForUser,
  clearAll,
};

