import { useState, useCallback, useEffect } from 'react';
import { forumService } from '../services/forumService';

export const useForum = () => {
  const [categories, setCategories] = useState([]);
  const [threads, setThreads] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await forumService.getCategories();
      setCategories(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchThreads = useCallback(async (categoryId, params = {}) => {
    setLoading(true);
    try {
      const data = await forumService.getThreads(categoryId, params);
      setThreads(data.results || data);
      if (data.count) {
        setPagination({
          page: params.page || 1,
          totalPages: Math.ceil(data.count / (params.page_size || 20)),
          totalItems: data.count
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createThread = async (data) => {
    try {
      const newThread = await forumService.createThread(data);
      setThreads(prev => [newThread, ...prev]);
      return newThread;
    } catch (err) {
      throw err;
    }
  };

  const searchThreads = useCallback(async (query) => {
    setLoading(true);
    try {
      const data = await forumService.searchThreads(query);
      setThreads(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    threads,
    posts,
    loading,
    error,
    pagination,
    fetchCategories,
    fetchThreads,
    createThread,
    searchThreads
  };
};