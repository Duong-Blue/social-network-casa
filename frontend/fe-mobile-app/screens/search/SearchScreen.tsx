import React, { useEffect, useRef, useCallback } from 'react';
import { View, ScrollView, Text, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { searchThunk } from '@/features/search/thunk/search.thunk';
import { setQuery, clearSearch } from '@/features/search/slice/search.slice';
import { SearchType } from '@/features/search/type/search.types';
import { getSuggestedUsersThunk } from '@/features/account/thunk/account.thunk';
import { getAllPostsThunk } from '@/features/post/thunk/post.thunk';
import GlobalRefreshControl from '@/components/GlobalRefreshControl';

import SearchBar from './components/SearchBar';
import SearchTabs from './components/SearchTabs';
import UserResults from './components/UserResults';
import PostResults from './components/PostResults';
import SuggestedUsers from './components/SuggestedUsers';
import DiscoveryGrid from './components/DiscoveryGrid';

export default function SearchScreen() {
  const dispatch = useAppDispatch();
  const { query, results, isLoading, error } = useAppSelector((state) => state.search);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [activeType, setActiveType] = React.useState<SearchType>('all');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (query.trim().length > 0) {
        await dispatch(searchThunk({ query, type: activeType })).unwrap();
      } else {
        await Promise.all([
          dispatch(getSuggestedUsersThunk({ page: 1, size: 20 })).unwrap(),
          dispatch(getAllPostsThunk({ page: 1, size: 30 })).unwrap()
        ]);
      }
    } catch (err) {
      console.error('Failed to refresh search results:', err);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, query, activeType]);

  const doSearch = useCallback(
    (q: string) => {
      if (q.trim().length === 0) return;
      dispatch(searchThunk({ query: q, type: activeType }));
    },
    [dispatch, activeType],
  );

  const handleChangeText = (text: string) => {
    if (text.length === 0) {
      dispatch(clearSearch());
      return;
    }
    dispatch(setQuery(text));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(text), 300);
  };

  const handleSubmit = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    doSearch(query);
  };

  const handleTabChange = (type: SearchType) => {
    setActiveType(type);
    if (query.trim().length > 0) {
      dispatch(searchThunk({ query, type }));
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const hasQuery = query.trim().length > 0;
  const hasResults = results !== null;
  const showDefault = !hasQuery && !hasResults;

  const filteredUsers =
    hasResults && activeType !== 'posts' ? results!.users : [];
  const filteredPosts =
    hasResults && activeType !== 'users' ? results!.posts : [];

  return (
    <View className="flex-1 bg-[#f7f6f8] dark:bg-[#0F0A1F]">
      <SearchBar
        value={query}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmit}
      />

      {hasQuery && hasResults && (
        <SearchTabs
          active={activeType}
          onChange={handleTabChange}
          totalUsers={results!.totalUsers}
          totalPosts={results!.totalPosts}
        />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: hasQuery ? 0 : 20, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <GlobalRefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {isLoading && (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator color="#7c3bed" size="large" />
          </View>
        )}

        {!isLoading && error && (
          <View className="py-20 items-center px-4">
            <Text className="text-red-500 text-sm text-center">{error}</Text>
          </View>
        )}

        {!isLoading && hasQuery && !error && !hasResults && (
          <View className="py-20 items-center px-4">
            <Text className="text-slate-400 dark:text-slate-500 text-base">
              Đang tìm kiếm...
            </Text>
          </View>
        )}

        {!isLoading && hasResults && (
          <>
            {activeType !== 'posts' && results!.users.length === 0 && query.trim().length > 0 && (
              <View className="py-10 items-center px-4">
                <Text className="text-slate-400 dark:text-slate-500 text-sm">
                  Không tìm thấy người dùng nào
                </Text>
              </View>
            )}
            {activeType !== 'users' && results!.posts.length === 0 && query.trim().length > 0 && (
              <View className="py-10 items-center px-4">
                <Text className="text-slate-400 dark:text-slate-500 text-sm">
                  Không tìm thấy bài viết nào
                </Text>
              </View>
            )}
            <UserResults users={filteredUsers} />
            <PostResults posts={filteredPosts} />
          </>
        )}

        {showDefault && (
          <>
            <SuggestedUsers />
            <DiscoveryGrid />
          </>
        )}
      </ScrollView>
    </View>
  );
}
