
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bell, Check, Clock, CalendarDays, Trash2, X, Activity, Droplets, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

// Mock data structure tailored for i18n
interface NotificationItem {
  id: number;
  titleKey: string;
  messageKey: string;
  timestamp: number;
  timeKey?: string; 
  timeParams?: Record<string, string>;
  dateKey: string; // 'today', 'yesterday'
  type: 'info' | 'success' | 'alert' | 'warning';
  read: boolean;
  iconType?: 'droplets' | 'activity' | 'heartPulse' | 'calendar' | 'default';
}

const getIcon = (type?: string) => {
  switch (type) {
    case 'droplets': return <Droplets className="h-5 w-5 text-blue-500" />;
    case 'activity': return <Activity className="h-5 w-5 text-green-500" />;
    case 'heartPulse': return <HeartPulse className="h-5 w-5 text-red-500" />;
    case 'calendar': return <CalendarDays className="h-5 w-5 text-orange-500" />;
    default: return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

const getTimeLabel = (timestamp: number, t: any) => {
    const diff = Math.max(0, Date.now() - timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('just_now');
    if (minutes < 60) return t('mins_ago', { count: minutes.toString() });
    if (hours < 24) return t('hours_ago', { count: hours.toString() });
    if (days === 1) return t('yesterday');
    return t('days_ago', { count: days.toString() });
}

const getDateLabel = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'today';
    if (date.toDateString() === yesterday.toDateString()) return 'yesterday';
    return 'older';
}


const NotificationsPage = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadNotifications = () => {
      const storedNotifications = localStorage.getItem('notifications');
      let currentNotifications: NotificationItem[] = storedNotifications ? JSON.parse(storedNotifications) : [];
      const now = Date.now();

      // Initialize with correct timestamps if empty and not initialized
      if (currentNotifications.length === 0 && !localStorage.getItem('notifications_initialized')) {
           currentNotifications = [
            {
              id: 1,
              titleKey: 'daily_goal',
              messageKey: 'notif_hydrate',
              timestamp: now - 3600000, 
              dateKey: 'today',
              type: 'info',
              read: false,
              iconType: 'droplets'
            },
            {
              id: 2,
              titleKey: 'reminder',
              messageKey: 'notif_activity',
              timestamp: now - 7200000,
              dateKey: 'today',
              type: 'success',
              read: false,
              iconType: 'activity'
            }
          ];
          localStorage.setItem('notifications_initialized', 'true');
          // Initialize last notification times to prevent immediate re-triggering
          localStorage.setItem('lastDailyNotification', (now - 3600000).toString()); 
          localStorage.setItem('lastQuarterlyNotification', (now - 7776000000).toString());
      }

      // Update date keys for existing notifications
      currentNotifications = currentNotifications.map(n => ({
         ...n,
         timestamp: n.timestamp || (n.timeKey === 'just_now' ? now : now - 86400000), // Fallback if missing
         dateKey: getDateLabel(n.timestamp || now)
      }));

      const lastDaily = localStorage.getItem('lastDailyNotification');
      const lastQuarterly = localStorage.getItem('lastQuarterlyNotification');
      
      let newNotifications: NotificationItem[] = [];

      // Check Daily Notifications (1 hour) - 3600000 ms
      // Changed from 24h to 1h per user request
      const DAILY_INTERVAL = 3600000; 
      if (!lastDaily || (now - parseInt(lastDaily) >= DAILY_INTERVAL)) {
        const dailyNotif: NotificationItem = {
          id: now, 
          titleKey: 'daily_goal',
          messageKey: 'notif_hydrate', 
          timestamp: now,
          dateKey: 'today',
          type: 'info',
          read: false,
          iconType: 'droplets'
        };
        newNotifications.push(dailyNotif);
        localStorage.setItem('lastDailyNotification', now.toString());
      }

      // Check Quarterly Notifications (3 months ~ 90 days) - 7776000000 ms = 90 * 24 * 60 * 60 * 1000
      if (!lastQuarterly || (now - parseInt(lastQuarterly) > 7776000000)) {
        const quarterlyNotif: NotificationItem = {
          id: now + 1,
          titleKey: 'health_update',
          messageKey: 'notif_checkup', 
          timestamp: now,
          dateKey: 'today',
          type: 'alert',
          read: false,
          iconType: 'heartPulse'
        };
        newNotifications.push(quarterlyNotif);
        localStorage.setItem('lastQuarterlyNotification', now.toString());
      }

      if (newNotifications.length > 0) {
        currentNotifications = [...newNotifications, ...currentNotifications];
        // Only show toast if it's a genuine new update, not initial load
        if (storedNotifications) {
             toast({ description: t("new_notifications") || "New notifications received" });
        }
      }
      
      // Sort by timestamp descending
      currentNotifications.sort((a, b) => b.timestamp - a.timestamp);

      setNotifications(currentNotifications);
      setIsLoaded(true);
    };

    loadNotifications();
  }, [toast, t]);

  // Save to local storage whenever notifications change
  // We use isLoaded to ensure we don't save the initial empty array [] over existing data
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications, isLoaded]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleRemove = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast({
      description: "Notification removed",
    });
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast({
      description: "All notifications cleared",
    });
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast({
      description: "All notifications marked as read",
    });
  };

  const groupedNotifications = {
    today: notifications.filter(n => n.dateKey === 'today'),
    yesterday: notifications.filter(n => n.dateKey === 'yesterday'),
    older: notifications.filter(n => n.dateKey === 'older'),
  };

  const renderNotificationGroup = (groupTitleKey: string, items: NotificationItem[]) => {
    if (items.length === 0) return null;
    
    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">{t(groupTitleKey)}</h3>
        <div className="space-y-3">
          {items.map((notification) => (
            <div 
              key={notification.id}
              className={cn(
                "relative flex items-start p-4 rounded-xl border transition-all hover:shadow-sm",
                notification.read 
                  ? "bg-card border-border/50 opacity-75" 
                  : "bg-card border-l-4 border-l-primary shadow-sm"
              )}
            >
              <div className={cn(
                "mr-4 mt-0.5 p-2 rounded-full",
                notification.read ? "bg-muted text-muted-foreground" : "bg-primary/10"
              )}>
                {getIcon(notification.iconType)}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className={cn("text-sm font-medium", !notification.read && "text-foreground")}>
                    {t(notification.titleKey)}
                  </p>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {getTimeLabel(notification.timestamp, t)}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(notification.messageKey)}
                </p>
                
                <div className="flex items-center gap-2 mt-3 pt-1">
                  {!notification.read && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      {t('mark_read', { defaultValue: 'Mark as read' })} 
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(notification.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    {t('remove', { defaultValue: 'Remove' })}
                  </Button>
                </div>
              </div>
              
              {!notification.read && (
                <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6 pb-20 fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('notifications_title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('unread_count_text', { count: unreadCount.toString() })}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
              <Check className="h-4 w-4 mr-2" />
              {t('mark_all_read')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll} disabled={notifications.length === 0}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t('clear_all')}
            </Button>
          </div>
        </div>

        <Separator />

        <ScrollArea className="h-[calc(100vh-220px)] pr-4">
          {notifications.length > 0 ? (
            <>
              {renderNotificationGroup('today', groupedNotifications.today)}
              {renderNotificationGroup('yesterday', groupedNotifications.yesterday)}
              {renderNotificationGroup('older', groupedNotifications.older)}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center h-64 border rounded-xl border-dashed bg-muted/20">
              <div className="bg-muted p-4 rounded-full mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">{t('no_notifications')}</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">
                {t('empty_notifications_desc')}
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
