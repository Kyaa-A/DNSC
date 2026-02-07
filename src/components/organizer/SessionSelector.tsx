'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  Users, 
  MapPin, 
  Calendar, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  RefreshCw,
  Eye,
  BarChart3,
  Settings
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Session {
  id: string;
  name: string;
  description?: string;
  eventId: string;
  event: {
    id: string;
    name: string;
    location?: string;
    startDate: string;
    endDate: string;
  };
  timeInStart: string;
  timeInEnd: string;
  timeOutStart?: string;
  timeOutEnd?: string;
  isActive: boolean;
  _count: {
    attendance: number;
  };
}

interface SessionSelectorProps {
  onSessionSelect?: (session: Session) => void;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function SessionSelector({ 
  onSessionSelect, 
  className, 
  autoRefresh = true, 
  refreshInterval = 30000 
}: SessionSelectorProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  // Enhanced fetch function with retry logic
  const fetchSessions = useCallback(async (isRetry = false) => {
    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }

      const response = await fetch('/api/organizer/sessions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add cache busting for real-time updates
        cache: 'no-cache',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSessions(data.sessions);
          setLastRefresh(new Date());
          setRetryCount(0);
          setError(null);
        } else {
          throw new Error(data.message || 'Failed to load sessions');
        }
      } else if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('Access denied. You may not have organizer permissions.');
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions';
      setError(errorMessage);
      
      // Implement exponential backoff retry
      if (retryCount < 3 && !isRetry) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchSessions(true);
        }, delay);
      } else {
        toast.error('Failed to load sessions', {
          description: errorMessage,
          action: {
            label: 'Retry',
            onClick: () => {
              setRetryCount(0);
              fetchSessions();
            }
          }
        });
      }
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
    }
  }, [retryCount]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchSessions();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchSessions(true);
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [fetchSessions, autoRefresh, refreshInterval]);

  // Get session status
  const getSessionStatus = (session: Session) => {
    const now = new Date();
    const timeInStart = new Date(session.timeInStart);
    const timeInEnd = new Date(session.timeInEnd);
    const timeOutStart = session.timeOutStart ? new Date(session.timeOutStart) : null;
    const timeOutEnd = session.timeOutEnd ? new Date(session.timeOutEnd) : null;

    if (!session.isActive) return 'inactive';
    if (now < timeInStart) return 'upcoming';
    if (now >= timeInStart && now <= timeInEnd) return 'active_time_in';
    if (timeOutStart && timeOutEnd && now >= timeOutStart && now <= timeOutEnd) return 'active_time_out';
    if (timeOutEnd && now > timeOutEnd) return 'ended';
    if (!timeOutEnd && now > timeInEnd) return 'ended';
    
    return 'inactive';
  };

  // Get session status badge
  const getSessionStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="outline" className="text-blue-300 border-blue-500/30 bg-blue-500/10">Upcoming</Badge>;
      case 'active_time_in':
        return <Badge variant="default" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Time-In Active</Badge>;
      case 'active_time_out':
        return <Badge variant="default" className="bg-orange-500/20 text-orange-300 border-orange-500/30">Time-Out Active</Badge>;
      case 'ended':
        return <Badge variant="secondary" className="bg-white/10 text-white/60">Ended</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="text-white/40 border-white/20 bg-white/5">Inactive</Badge>;
      default:
        return <Badge variant="outline" className="text-white/40 border-white/20">Unknown</Badge>;
    }
  };

  // Get session status icon
  const getSessionStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="h-4 w-4 text-blue-400" />;
      case 'active_time_in':
        return <Play className="h-4 w-4 text-emerald-400" />;
      case 'active_time_out':
        return <Pause className="h-4 w-4 text-orange-400" />;
      case 'ended':
        return <CheckCircle className="h-4 w-4 text-white/40" />;
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-white/30" />;
      default:
        return <Clock className="h-4 w-4 text-white/30" />;
    }
  };

  // Format time for display
  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format date for display
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle session selection
  const handleSessionSelect = (session: Session) => {
    const status = getSessionStatus(session);
    
    // Only allow selection of active sessions
    if (status === 'active_time_in' || status === 'active_time_out') {
      setSelectedSessionId(session.id);
      if (onSessionSelect) {
        onSessionSelect(session);
      } else {
        // Navigate to scanning interface
        router.push(`/organizer/scan?sessionId=${session.id}`);
      }
    } else {
      toast.error('This session is not currently active');
    }
  };

  // Enhanced filtering with search and status
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const status = getSessionStatus(session);
      
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && !(status === 'active_time_in' || status === 'active_time_out')) {
          return false;
        }
        if (statusFilter === 'upcoming' && status !== 'upcoming') {
          return false;
        }
        if (statusFilter === 'ended' && status !== 'ended') {
          return false;
        }
        if (statusFilter === 'inactive' && status !== 'inactive') {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          session.name.toLowerCase().includes(query) ||
          session.event.name.toLowerCase().includes(query) ||
          (session.description && session.description.toLowerCase().includes(query)) ||
          (session.event.location && session.event.location.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [sessions, statusFilter, searchQuery]);

  // Group filtered sessions by status
  const activeSessions = filteredSessions.filter(session => {
    const status = getSessionStatus(session);
    return status === 'active_time_in' || status === 'active_time_out';
  });

  const upcomingSessions = filteredSessions.filter(session => {
    const status = getSessionStatus(session);
    return status === 'upcoming';
  });

  const endedSessions = filteredSessions.filter(session => {
    const status = getSessionStatus(session);
    return status === 'ended';
  });

  const inactiveSessions = filteredSessions.filter(session => {
    const status = getSessionStatus(session);
    return status === 'inactive';
  });

  // Format last refresh time
  const formatLastRefresh = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-6 bg-white/10 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white/10 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Sessions</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="border-border text-foreground hover:bg-muted">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className={className}>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-blue-400/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Sessions Assigned</h3>
            <p className="text-muted-foreground mb-4">
              You don&apos;t have any sessions assigned to you yet. Contact your administrator to get assigned to events.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Enhanced Header with Controls */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Available Sessions
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredSessions.length} of {sessions.length} sessions
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <RefreshCw className="h-3 w-3" />
                  <span>Updated {formatLastRefresh(lastRefresh)}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchSessions()}
                  disabled={loading}
                  className="border-border text-foreground hover:bg-muted"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sessions, events, or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary-400 focus:ring-primary-400/20"
                />
              </div>
              
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-background border-border text-foreground focus:border-primary-400 focus:ring-primary-400/20">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="all">All Sessions</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-foreground">Active Sessions</h2>
              <Badge variant="default" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                {activeSessions.length}
              </Badge>
            </div>
            <div className="grid gap-4">
              {activeSessions.map((session) => {
                const status = getSessionStatus(session);
                return (
                  <Card 
                    key={session.id} 
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg bg-card border-border hover:border-emerald-500/50 ${
                      selectedSessionId === session.id ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : ''
                    }`}
                    onClick={() => handleSessionSelect(session)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <div className="flex items-center gap-2 sm:gap-3">
                              {getSessionStatusIcon(status)}
                              <h3 className="font-semibold text-foreground truncate">{session.name}</h3>
                            </div>
                            {getSessionStatusBadge(status)}
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {session.event.name}
                            </div>
                            {session.event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {session.event.location}
                              </div>
                            )}
                          </div>

                          {session.description && (
                            <p className="text-sm text-muted-foreground mb-3">{session.description}</p>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                            <div>
                              <span className="font-medium text-foreground">Time-In:</span> {formatTime(session.timeInStart)} - {formatTime(session.timeInEnd)}
                            </div>
                            {session.timeOutStart && session.timeOutEnd && (
                              <div>
                                <span className="font-medium text-foreground">Time-Out:</span> {formatTime(session.timeOutStart)} - {formatTime(session.timeOutEnd)}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{session._count.attendance} scanned</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="sm:ml-4 flex flex-col sm:flex-row gap-2 min-w-0">
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSessionSelect(session);
                            }}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Start Scanning</span>
                            <span className="sm:hidden">Start</span>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-border text-foreground hover:bg-muted whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/organizer/sessions/${session.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">View Details</span>
                            <span className="sm:hidden">View</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-foreground">Upcoming Sessions</h2>
              <Badge variant="outline" className="text-blue-300 border-blue-500/30 bg-blue-500/10">
                {upcomingSessions.length}
              </Badge>
            </div>
            <div className="grid gap-4">
              {upcomingSessions.map((session) => {
                const status = getSessionStatus(session);
                return (
                  <Card key={session.id} className="opacity-75 bg-card border-border hover:border-blue-500/50 transition-all">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <div className="flex items-center gap-2 sm:gap-3">
                              {getSessionStatusIcon(status)}
                              <h3 className="font-semibold text-foreground truncate">{session.name}</h3>
                            </div>
                            {getSessionStatusBadge(status)}
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {session.event.name}
                            </div>
                            {session.event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {session.event.location}
                              </div>
                            )}
                          </div>

                          <div className="text-sm text-blue-300/60">
                            <span className="font-medium text-blue-200/80">Starts:</span> {formatDate(session.timeInStart)} at {formatTime(session.timeInStart)}
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-border text-foreground hover:bg-muted"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/organizer/sessions/${session.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Ended Sessions */}
        {endedSessions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-white/40" />
              <h2 className="text-lg font-semibold text-foreground">Recent Sessions</h2>
              <Badge variant="secondary" className="bg-white/10 text-white/60">
                {endedSessions.length}
              </Badge>
            </div>
            <div className="grid gap-4">
              {endedSessions.slice(0, 3).map((session) => {
                const status = getSessionStatus(session);
                return (
                  <Card key={session.id} className="opacity-60 bg-card border-border shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <div className="flex items-center gap-2 sm:gap-3">
                              {getSessionStatusIcon(status)}
                              <h3 className="font-semibold text-foreground truncate">{session.name}</h3>
                            </div>
                            {getSessionStatusBadge(status)}
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {session.event.name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{session._count.attendance} scanned</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-border text-foreground hover:bg-muted"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/organizer/sessions/${session.id}`);
                            }}
                          >
                            <BarChart3 className="h-4 w-4 mr-1" />
                            View Report
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Inactive Sessions */}
        {inactiveSessions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-white/30" />
              <h2 className="text-lg font-semibold text-foreground">Inactive Sessions</h2>
              <Badge variant="outline" className="text-white/40 border-white/20 bg-white/5">
                {inactiveSessions.length}
              </Badge>
            </div>
            <div className="grid gap-4">
              {inactiveSessions.slice(0, 3).map((session) => {
                const status = getSessionStatus(session);
                return (
                  <Card key={session.id} className="opacity-50 bg-card border-border shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <div className="flex items-center gap-2 sm:gap-3">
                              {getSessionStatusIcon(status)}
                              <h3 className="font-semibold text-foreground truncate">{session.name}</h3>
                            </div>
                            {getSessionStatusBadge(status)}
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {session.event.name}
                            </div>
                            {session.event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {session.event.location}
                              </div>
                            )}
                          </div>

                          <div className="text-sm text-blue-300/60">
                            <span className="font-medium text-blue-200/80">Status:</span> Session is currently inactive
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-border text-foreground hover:bg-muted"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/organizer/sessions/${session.id}`);
                            }}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* No Results Message */}
        {filteredSessions.length === 0 && sessions.length > 0 && (
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="text-center py-8">
              <Search className="h-12 w-12 text-blue-400/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Sessions Found</h3>
              <p className="text-gray-600 mb-4">
                No sessions match your current search and filter criteria.
              </p>
              <Button 
                variant="outline" 
                className="border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
