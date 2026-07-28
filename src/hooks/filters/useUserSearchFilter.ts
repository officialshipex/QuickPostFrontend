import { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';

export interface UserSearchResult {
  _id: string;
  fullname: string;
  email: string;
  phoneNumber?: string;
  userId?: string | number;
}

/**
 * Admin-only "search user" autocomplete filter used across Orders/NDR/Reports —
 * debounces the query, fetches matches from /admin/searchUser, and tracks the
 * selected user's Mongo _id once a suggestion is chosen.
 */
export function useUserSearchFilter(enabled: boolean) {
  const [userQuery, setUserQuery] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<UserSearchResult[]>([]);
  const [userMongoId, setUserMongoId] = useState('');

  useEffect(() => {
    if (!enabled || userQuery.trim().length < 2) { setUserSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/admin/searchUser?query=${encodeURIComponent(userQuery)}`);
        setUserSuggestions(res.data.users || []);
      } catch { setUserSuggestions([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [userQuery, enabled]);

  const selectUser = (u: UserSearchResult) => {
    setUserMongoId(u._id);
    setUserQuery(`${u.fullname} (${u.email})`);
    setUserSuggestions([]);
  };

  const clearUser = () => {
    setUserQuery('');
    setUserMongoId('');
    setUserSuggestions([]);
  };

  const onQueryChange = (value: string) => {
    setUserQuery(value);
    if (!value.trim()) { setUserMongoId(''); setUserSuggestions([]); }
  };

  return {
    userQuery,
    userSuggestions,
    userMongoId,
    setUserQuery,
    setUserMongoId,
    setUserSuggestions,
    onQueryChange,
    selectUser,
    clearUser,
  };
}
