import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import API from '../../api/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  FiUsers,
  FiActivity,
  FiPieChart,
  FiTarget,
  FiMessageSquare,
  FiAlertCircle,
  FiSearch,
  FiRefreshCw,
  FiTrash2,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiShield,
  FiCalendar,
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatFullDate } from '../../utils/date';

const AdminDashboardPage = () => {
  const { user: currentUser } = useSelector((state) => state.auth);

  // Active sub-view tab: 'overview' | 'users' | 'feedback'
  const [activeTab, setActiveTab] = useState('overview');

  // Overview Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users State
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  // User Deletion Modal State
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Feedback State
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('');
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState('');
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackTotalPages, setFeedbackTotalPages] = useState(1);
  const [totalFeedbackCount, setTotalFeedbackCount] = useState(0);

  // Feedback Status Update Modal State
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [editStatus, setEditStatus] = useState('new');
  const [editAdminNotes, setEditAdminNotes] = useState('');
  const [isUpdatingFeedback, setIsUpdatingFeedback] = useState(false);

  // Fetch Overview Stats on mount
  useEffect(() => {
    let isMounted = true;
    async function loadOverview() {
      try {
        const res = await API.get('/admin/overview');
        if (isMounted) setStats(res.data?.data || null);
      } catch (error) {
        if (isMounted) toast.error(error.response?.data?.message || 'Failed to fetch admin overview statistics');
      } finally {
        if (isMounted) setLoadingStats(false);
      }
    }
    loadOverview();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Users or Feedback when tab/filter changes
  useEffect(() => {
    let isMounted = true;
    async function loadTabData() {
      if (activeTab === 'users') {
        try {
          const params = { page: userPage, limit: 10 };
          if (userSearch.trim()) params.search = userSearch.trim();
          const res = await API.get('/admin/users', { params });
          if (isMounted) {
            setUsers(res.data?.data || []);
            setUserPage(res.data?.page || 1);
            setUserTotalPages(res.data?.pages || 1);
            setTotalUsersCount(res.data?.total || 0);
          }
        } catch (error) {
          if (isMounted) toast.error(error.response?.data?.message || 'Failed to load users');
        } finally {
          if (isMounted) setUsersLoading(false);
        }
      } else if (activeTab === 'feedback') {
        try {
          const params = { page: feedbackPage, limit: 10 };
          if (feedbackStatusFilter) params.status = feedbackStatusFilter;
          if (feedbackCategoryFilter) params.category = feedbackCategoryFilter;
          if (feedbackSearch.trim()) params.search = feedbackSearch.trim();
          const res = await API.get('/admin/feedback', { params });
          if (isMounted) {
            setFeedbacks(res.data?.data || []);
            setFeedbackPage(res.data?.page || 1);
            setFeedbackTotalPages(res.data?.pages || 1);
            setTotalFeedbackCount(res.data?.total || 0);
          }
        } catch (error) {
          if (isMounted) toast.error(error.response?.data?.message || 'Failed to load feedback');
        } finally {
          if (isMounted) setFeedbackLoading(false);
        }
      }
    }
    loadTabData();
    return () => {
      isMounted = false;
    };
  }, [activeTab, userPage, userSearch, feedbackPage, feedbackStatusFilter, feedbackCategoryFilter, feedbackSearch]);

  // Refresh functions for actions/modals
  const fetchOverviewStats = useCallback(async () => {
    try {
      const res = await API.get('/admin/overview');
      setStats(res.data?.data || null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch admin overview statistics');
    }
  }, []);

  const fetchUsers = useCallback(async (page = 1, search = '') => {
    try {
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      const res = await API.get('/admin/users', { params });
      setUsers(res.data?.data || []);
      setUserPage(res.data?.page || 1);
      setUserTotalPages(res.data?.pages || 1);
      setTotalUsersCount(res.data?.total || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load users');
    }
  }, []);

  const fetchFeedback = useCallback(async (page = 1, status = '', category = '', search = '') => {
    try {
      const params = { page, limit: 10 };
      if (status) params.status = status;
      if (category) params.category = category;
      if (search.trim()) params.search = search.trim();
      const res = await API.get('/admin/feedback', { params });
      setFeedbacks(res.data?.data || []);
      setFeedbackPage(res.data?.page || 1);
      setFeedbackTotalPages(res.data?.pages || 1);
      setTotalFeedbackCount(res.data?.total || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load feedback');
    }
  }, []);

  // Handle User Deletion by Admin
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      await API.delete(`/admin/users/${userToDelete._id}`);
      toast.success(`User ${userToDelete.email} and all data deleted successfully`);
      setUserToDelete(null);
      fetchUsers(userPage, userSearch);
      fetchOverviewStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Handle Feedback Status Update
  const handleUpdateFeedback = async () => {
    if (!selectedFeedback) return;
    setIsUpdatingFeedback(true);
    try {
      await API.patch(`/admin/feedback/${selectedFeedback._id}`, {
        status: editStatus,
        adminNotes: editAdminNotes
      });
      toast.success('Feedback updated successfully');
      setSelectedFeedback(null);
      fetchFeedback(feedbackPage, feedbackStatusFilter, feedbackCategoryFilter, feedbackSearch);
      fetchOverviewStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update feedback');
    } finally {
      setIsUpdatingFeedback(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return <Badge variant="warning" className="uppercase text-[10px] font-bold tracking-wider">New</Badge>;
      case 'reviewing':
        return <Badge variant="info" className="uppercase text-[10px] font-bold tracking-wider">Reviewing</Badge>;
      case 'resolved':
        return <Badge variant="success" className="uppercase text-[10px] font-bold tracking-wider">Resolved</Badge>;
      case 'closed':
        return <Badge variant="secondary" className="uppercase text-[10px] font-bold tracking-wider">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'bug':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-expense-500/10 text-expense-400 border border-expense-500/20">Bug Report</span>;
      case 'feature':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-info-500/10 text-info-400 border border-info-500/20">Feature</span>;
      case 'ui':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">UI / UX</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-income-500/10 text-income-400 border border-income-500/20">Feedback</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-white tracking-tight">Admin Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <FiShield className="text-xs" /> Privileged
            </span>
          </div>
          <p className="text-xs text-dark-400 mt-1">
            System administration, user records management, and real-time student feedback resolution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={FiRefreshCw}
            onClick={() => {
              fetchOverviewStats();
              if (activeTab === 'users') fetchUsers(userPage, userSearch);
              if (activeTab === 'feedback') fetchFeedback(feedbackPage, feedbackStatusFilter, feedbackCategoryFilter, feedbackSearch);
              toast.success('Admin data refreshed');
            }}
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-dark-800 space-x-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'overview'
              ? 'border-info-500 text-white'
              : 'border-transparent text-dark-400 hover:text-dark-200'
          }`}
        >
          Overview Statistics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-info-500 text-white'
              : 'border-transparent text-dark-400 hover:text-dark-200'
          }`}
        >
          User Accounts
          {stats?.totalUsers ? (
            <span className="px-1.5 py-0.2 rounded-full bg-dark-800 text-[10px] font-mono text-dark-300">
              {stats.totalUsers}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('feedback')}
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'feedback'
              ? 'border-info-500 text-white'
              : 'border-transparent text-dark-400 hover:text-dark-200'
          }`}
        >
          Feedback & Reports
          {stats?.unresolvedFeedback ? (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
              {stats.unresolvedFeedback}
            </span>
          ) : null}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. OVERVIEW VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {loadingStats ? (
            <div className="p-12 flex justify-center">
              <LoadingSpinner message="Loading system metrics..." />
            </div>
          ) : (
            <>
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Total Users */}
                <Card className="hover:border-dark-700 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-dark-400">Total Registered Users</span>
                      <div className="w-10 h-10 rounded-xl bg-info-500/10 text-info-400 border border-info-500/20 flex items-center justify-center">
                        <FiUsers className="text-lg" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white tracking-tight">
                        {stats?.totalUsers ?? 0}
                      </span>
                      {stats?.recentUsers ? (
                        <span className="text-xs text-income-400 font-medium">
                          +{stats.recentUsers} this week
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-dark-500 mt-1">Student & Admin profiles</p>
                  </CardContent>
                </Card>

                {/* Total Transactions */}
                <Card className="hover:border-dark-700 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-dark-400">Total Transactions</span>
                      <div className="w-10 h-10 rounded-xl bg-income-500/10 text-income-400 border border-income-500/20 flex items-center justify-center">
                        <FiActivity className="text-lg" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-3xl font-bold text-white tracking-tight">
                        {stats?.totalTransactions ?? 0}
                      </span>
                    </div>
                    <p className="text-[11px] text-dark-500 mt-1">Total recorded financial entries</p>
                  </CardContent>
                </Card>

                {/* Total Budgets */}
                <Card className="hover:border-dark-700 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-dark-400">Configured Budgets</span>
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                        <FiPieChart className="text-lg" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-3xl font-bold text-white tracking-tight">
                        {stats?.totalBudgets ?? 0}
                      </span>
                    </div>
                    <p className="text-[11px] text-dark-500 mt-1">Monthly category limits</p>
                  </CardContent>
                </Card>

                {/* Total Savings Goals */}
                <Card className="hover:border-dark-700 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-dark-400">Savings Goals</span>
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                        <FiTarget className="text-lg" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-3xl font-bold text-white tracking-tight">
                        {stats?.totalSavingsGoals ?? 0}
                      </span>
                    </div>
                    <p className="text-[11px] text-dark-500 mt-1">Student target milestones</p>
                  </CardContent>
                </Card>

                {/* Total Feedback */}
                <Card className="hover:border-dark-700 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-dark-400">Total Feedback Entries</span>
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                        <FiMessageSquare className="text-lg" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-3xl font-bold text-white tracking-tight">
                        {stats?.totalFeedback ?? 0}
                      </span>
                    </div>
                    <p className="text-[11px] text-dark-500 mt-1">Reports & suggestions in MongoDB</p>
                  </CardContent>
                </Card>

                {/* Unresolved Feedback */}
                <Card className="hover:border-dark-700 transition-colors border-amber-500/30 bg-amber-500/[0.02]">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-amber-300">Unresolved Feedback</span>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                        <FiAlertCircle className="text-lg" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white tracking-tight">
                        {stats?.unresolvedFeedback ?? 0}
                      </span>
                      <span className="text-xs text-amber-400 font-medium">
                        Requires Review
                      </span>
                    </div>
                    <p className="text-[11px] text-dark-400 mt-1">Status: new or reviewing</p>
                  </CardContent>
                </Card>
              </div>

              {/* Security & System Info Banner */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <FiShield className="text-info-400 text-lg" />
                    <div>
                      <CardTitle>System & Security Clearance</CardTitle>
                      <CardDescription>
                        Operational parameters and administrative isolation guarantees
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-dark-900 border border-dark-750">
                      <p className="font-semibold text-white">Strict Backend Authorization</p>
                      <p className="text-dark-400 mt-1">
                        All admin endpoints enforce JWT verification and role checks. Non-admin access returns 403 Forbidden.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-dark-900 border border-dark-750">
                      <p className="font-semibold text-white">Zero Privacy Leakage</p>
                      <p className="text-dark-400 mt-1">
                        Private user transaction ledgers and credentials are excluded from administrative overview aggregations.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-dark-900 border border-dark-750">
                      <p className="font-semibold text-white">Cascade Isolation</p>
                      <p className="text-dark-400 mt-1">
                        Account self-deletion permanently deletes all associated data cleanly without leaving orphan records.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. USER MANAGEMENT VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle>Registered User Accounts</CardTitle>
                <CardDescription>
                  Showing {users.length} of {totalUsersCount} user accounts
                </CardDescription>
              </div>

              {/* Search input */}
              <div className="w-full sm:w-72">
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  icon={FiSearch}
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                />
              </div>
            </CardHeader>

            <CardContent>
              {usersLoading ? (
                <div className="p-12 flex justify-center">
                  <LoadingSpinner message="Loading user directory..." />
                </div>
              ) : users.length === 0 ? (
                <div className="py-12 text-center text-dark-400 text-sm">
                  No users found matching your search query.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-dark-900/60 text-dark-400 border-b border-dark-800 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Base Currency</th>
                        <th className="py-3 px-4">Joined Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-800/60 text-dark-200">
                      {users.map((u) => {
                        const isCurrent = currentUser?._id === u._id;
                        return (
                          <tr key={u._id} className="hover:bg-dark-800/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center text-white font-bold text-xs border border-dark-600 shrink-0">
                                  {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-white truncate">
                                    {u.name || 'Anonymous User'}
                                    {isCurrent && (
                                      <span className="ml-2 text-[10px] text-info-400 font-mono font-normal">
                                        (You)
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-dark-400 text-[11px] truncate">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              {u.role === 'admin' ? (
                                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold uppercase text-[10px] tracking-wider">
                                  Admin
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-dark-700 text-dark-300 text-[10px] font-medium uppercase tracking-wider">
                                  User
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-medium text-dark-300">
                              {u.currency || 'INR'}
                            </td>
                            <td className="py-3.5 px-4 text-dark-400 flex items-center gap-1.5 mt-3">
                              <FiCalendar className="text-dark-500" />
                              {u.createdAt ? formatFullDate(u.createdAt) : 'Unknown'}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {isCurrent ? (
                                <span className="text-[11px] text-dark-500 italic">Self</span>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-expense-400 hover:text-expense-300 hover:bg-expense-500/10"
                                  icon={FiTrash2}
                                  onClick={() => setUserToDelete(u)}
                                >
                                  Delete
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {userTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-dark-800 pt-4 mt-4 text-xs text-dark-400">
                  <span>
                    Page {userPage} of {userTotalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={userPage <= 1}
                      onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                      icon={FiChevronLeft}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={userPage >= userTotalPages}
                      onClick={() => setUserPage((p) => p + 1)}
                      icon={FiChevronRight}
                      iconPosition="right"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FEEDBACK MANAGEMENT VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle>Student Feedback & Bug Reports</CardTitle>
                <CardDescription>
                  Showing {feedbacks.length} of {totalFeedbackCount} total submissions
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search */}
                <div className="w-full sm:w-60">
                  <Input
                    type="text"
                    placeholder="Search subject/text..."
                    icon={FiSearch}
                    value={feedbackSearch}
                    onChange={(e) => {
                      setFeedbackSearch(e.target.value);
                      setFeedbackPage(1);
                    }}
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={feedbackStatusFilter}
                  onChange={(e) => {
                    setFeedbackStatusFilter(e.target.value);
                    setFeedbackPage(1);
                  }}
                  className="bg-dark-900 border border-dark-600 text-dark-200 text-xs rounded-xl px-3 py-2 outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="new">New</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                {/* Category Filter */}
                <select
                  value={feedbackCategoryFilter}
                  onChange={(e) => {
                    setFeedbackCategoryFilter(e.target.value);
                    setFeedbackPage(1);
                  }}
                  className="bg-dark-900 border border-dark-600 text-dark-200 text-xs rounded-xl px-3 py-2 outline-none"
                >
                  <option value="">All Categories</option>
                  <option value="feedback">General</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature</option>
                  <option value="ui">UI/UX</option>
                </select>
              </div>
            </CardHeader>

            <CardContent>
              {feedbackLoading ? (
                <div className="p-12 flex justify-center">
                  <LoadingSpinner message="Loading feedback submissions..." />
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="py-12 text-center text-dark-400 text-sm">
                  No feedback items found matching your filters.
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbacks.map((item) => (
                    <div
                      key={item._id}
                      className="p-4 rounded-xl bg-dark-900 border border-dark-750 hover:border-dark-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {getStatusBadge(item.status)}
                          {getCategoryBadge(item.category)}
                          <span className="text-xs text-dark-500 flex items-center gap-1">
                            <FiClock className="text-dark-500" />
                            {item.createdAt ? formatFullDate(item.createdAt) : ''}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-white tracking-tight">
                            {item.subject}
                          </h4>
                          <p className="text-xs text-dark-300 mt-1 leading-relaxed line-clamp-2">
                            {item.message}
                          </p>
                        </div>

                        <div className="text-[11px] text-dark-400 flex items-center gap-2">
                          <span>Submitted by:</span>
                          <span className="font-semibold text-dark-200">
                            {item.user?.name || 'Student'} ({item.user?.email || 'N/A'})
                          </span>
                        </div>

                        {item.adminNotes && (
                          <div className="p-2 rounded-lg bg-dark-800/80 border border-dark-700 text-[11px] text-info-300">
                            <strong>Admin Note:</strong> {item.adminNotes}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={FiEdit3}
                          onClick={() => {
                            setSelectedFeedback(item);
                            setEditStatus(item.status || 'new');
                            setEditAdminNotes(item.adminNotes || '');
                          }}
                        >
                          Review & Update
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {feedbackTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-dark-800 pt-4 mt-4 text-xs text-dark-400">
                  <span>
                    Page {feedbackPage} of {feedbackTotalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={feedbackPage <= 1}
                      onClick={() => setFeedbackPage((p) => Math.max(1, p - 1))}
                      icon={FiChevronLeft}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={feedbackPage >= feedbackTotalPages}
                      onClick={() => setFeedbackPage((p) => p + 1)}
                      icon={FiChevronRight}
                      iconPosition="right"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* USER DELETION MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!userToDelete}
        onClose={() => {
          if (!isDeletingUser) setUserToDelete(null);
        }}
        title="Delete User Account (Cascade)"
        size="md"
      >
        {userToDelete && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-expense-500/10 border border-expense-500/20 flex items-start gap-3">
              <FiAlertTriangle className="text-expense-400 text-lg shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-white">Permanently delete user record</p>
                <p className="text-dark-300">
                  Are you sure you want to delete <strong className="text-white">{userToDelete.email}</strong> ({userToDelete.name})?
                </p>
                <p className="text-dark-300">
                  All transactions, budgets, goals, and feedback records owned by this user will be completely purged.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                disabled={isDeletingUser}
                onClick={() => setUserToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={FiTrash2}
                loading={isDeletingUser}
                onClick={handleConfirmDeleteUser}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* FEEDBACK STATUS UPDATE MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!selectedFeedback}
        onClose={() => {
          if (!isUpdatingFeedback) setSelectedFeedback(null);
        }}
        title="Review & Update Feedback"
        size="md"
      >
        {selectedFeedback && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-dark-900 border border-dark-750 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{selectedFeedback.subject}</span>
                {getCategoryBadge(selectedFeedback.category)}
              </div>
              <p className="text-dark-300 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                {selectedFeedback.message}
              </p>
              <div className="text-[11px] text-dark-500 border-t border-dark-800 pt-1.5 flex justify-between">
                <span>By: {selectedFeedback.user?.email || 'Student'}</span>
                <span>{selectedFeedback.createdAt ? formatFullDate(selectedFeedback.createdAt) : ''}</span>
              </div>
            </div>

            <div>
              <label className="label mb-1.5 text-xs text-dark-200">Update Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 text-dark-100 rounded-xl px-4 py-2.5 text-sm outline-none"
              >
                <option value="new">New (Unreviewed)</option>
                <option value="reviewing">Reviewing (Under Investigation)</option>
                <option value="resolved">Resolved (Implemented / Fixed)</option>
                <option value="closed">Closed (No Action Required)</option>
              </select>
            </div>

            <div>
              <label className="label mb-1.5 text-xs text-dark-200">Admin Resolution Notes</label>
              <textarea
                rows={3}
                placeholder="Add optional notes explaining resolution or steps taken..."
                value={editAdminNotes}
                onChange={(e) => setEditAdminNotes(e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 text-dark-100 rounded-xl px-4 py-2.5 text-xs outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                disabled={isUpdatingFeedback}
                onClick={() => setSelectedFeedback(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={FiCheckCircle}
                loading={isUpdatingFeedback}
                onClick={handleUpdateFeedback}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboardPage;
