import { TimelineEvent, WithdrawalRequest } from '../types/withdrawalTypes';
import { AUTHORIZED_USERS } from '../config/authorizedUsers';

// Local storage keys
const STORAGE_KEYS = {
  TIMELINE: 'adfd_request_timeline'
};

class TimelineService {
  // Initialize with mock data if no data exists
  private initializeData(): void {
    if (!localStorage.getItem(STORAGE_KEYS.TIMELINE)) {
      const mockTimeline: TimelineEvent[] = [
        {
          id: 'timeline_1',
          requestId: '1',
          userId: 'archive001',
          userName: 'Ahmed Al Zaabi',
          userAvatar: '👨‍💼',
          eventType: 'created',
          title: 'Request Created',
          description: 'Withdrawal request #1001 created for Company Alpha',
          createdAt: new Date('2025-05-07T09:00:00Z')
        },
        {
          id: 'timeline_2',
          requestId: '1',
          userId: 'ops001',
          userName: 'Ali Al Derie',
          userAvatar: '👨‍🔧',
          eventType: 'status_change',
          title: 'Status Updated',
          description: 'Request moved to technical review stage',
          previousValue: 'initial_review',
          newValue: 'technical_review',
          createdAt: new Date('2025-05-07T10:30:00Z')
        },
        {
          id: 'timeline_3',
          requestId: '1',
          userId: 'ops001',
          userName: 'Ali Al Derie',
          userAvatar: '👨‍🔧',
          eventType: 'approved',
          title: 'Request Approved',
          description: 'Technical review completed and approved',
          createdAt: new Date('2025-05-08T14:15:00Z')
        },
        {
          id: 'timeline_4',
          requestId: '1',
          userId: 'bank001',
          userName: 'Ahmed Siddique',
          userAvatar: '👩‍💻',
          eventType: 'status_change',
          title: 'Moved to Core Banking',
          description: 'Request forwarded to core banking for disbursement',
          previousValue: 'technical_review',
          newValue: 'core_banking',
          createdAt: new Date('2025-05-10T11:20:00Z')
        },
        {
          id: 'timeline_5',
          requestId: '1',
          userId: 'bank001',
          userName: 'Ahmed Siddique',
          userAvatar: '👩‍💻',
          eventType: 'disbursed',
          title: 'Funds Disbursed',
          description: 'Payment of $1,200,000 successfully disbursed to Company Alpha',
          createdAt: new Date('2025-05-12T16:45:00Z')
        },
        {
          id: 'timeline_6',
          requestId: '2',
          userId: 'archive001',
          userName: 'Ahmed Al Zaabi',
          userAvatar: '👨‍💼',
          eventType: 'created',
          title: 'Request Created',
          description: 'Withdrawal request #1002 created for Company Beta',
          createdAt: new Date('2025-05-06T14:30:00Z')
        },
        {
          id: 'timeline_7',
          requestId: '2',
          userId: 'archive001',
          userName: 'Ahmed Al Zaabi',
          userAvatar: '👨‍💼',
          eventType: 'comment_added',
          title: 'Comment Added',
          description: 'Added note about withdrawal date expiration',
          createdAt: new Date('2025-05-08T14:30:00Z')
        },
        {
          id: 'timeline_8',
          requestId: '3',
          userId: 'archive001',
          userName: 'Ahmed Al Zaabi',
          userAvatar: '👨‍💼',
          eventType: 'created',
          title: 'Request Created',
          description: 'Withdrawal request #1003 created for Company Gamma',
          createdAt: new Date('2025-05-10T09:15:00Z')
        },
        {
          id: 'timeline_9',
          requestId: '3',
          userId: 'ops001',
          userName: 'Ali Al Derie',
          userAvatar: '👨‍🔧',
          eventType: 'status_change',
          title: 'Under Review',
          description: 'Request moved to technical review stage',
          previousValue: 'initial_review',
          newValue: 'technical_review',
          createdAt: new Date('2025-05-11T10:00:00Z')
        }
      ];
      
      localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(mockTimeline));
    }
  }

  // Get timeline events for a specific request
  getTimelineByRequestId(requestId: string): TimelineEvent[] {
    this.initializeData();
    const timeline = localStorage.getItem(STORAGE_KEYS.TIMELINE);
    const allEvents: TimelineEvent[] = timeline ? JSON.parse(timeline) : [];
    
    return allEvents
      .filter(event => event.requestId === requestId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Most recent first
  }

  // Add a new timeline event
  addTimelineEvent(
    requestId: string,
    userId: string,
    eventType: TimelineEvent['eventType'],
    title: string,
    description: string,
    metadata?: Record<string, any>
  ): TimelineEvent | null {
    try {
      this.initializeData();
      const timeline = localStorage.getItem(STORAGE_KEYS.TIMELINE);
      const allEvents: TimelineEvent[] = timeline ? JSON.parse(timeline) : [];
      
      // Find user details
      const user = AUTHORIZED_USERS.find(u => u.email === userId);
      if (!user) {
        console.error('User not found:', userId);
        return null;
      }

      const newEvent: TimelineEvent = {
        id: `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requestId,
        userId,
        userName: user.name,
        userAvatar: this.getUserAvatar(user.role),
        eventType,
        title,
        description,
        metadata,
        createdAt: new Date()
      };

      allEvents.push(newEvent);
      localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(allEvents));
      
      return newEvent;
    } catch (error) {
      console.error('Error adding timeline event:', error);
      return null;
    }
  }

  // Add status change event
  addStatusChangeEvent(
    requestId: string,
    userId: string,
    previousStatus: string,
    newStatus: string,
    description?: string
  ): TimelineEvent | null {
    const title = `Status Changed: ${previousStatus} → ${newStatus}`;
    const desc = description || `Request status updated from ${previousStatus} to ${newStatus}`;
    
    const event = this.addTimelineEvent(requestId, userId, 'status_change', title, desc);
    
    if (event) {
      event.previousValue = previousStatus;
      event.newValue = newStatus;
      
      // Update the stored event
      const timeline = localStorage.getItem(STORAGE_KEYS.TIMELINE);
      const allEvents: TimelineEvent[] = timeline ? JSON.parse(timeline) : [];
      const eventIndex = allEvents.findIndex(e => e.id === event.id);
      
      if (eventIndex !== -1) {
        allEvents[eventIndex] = event;
        localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(allEvents));
      }
    }
    
    return event;
  }

  // Add comment event
  addCommentEvent(requestId: string, userId: string, commentText: string): TimelineEvent | null {
    const title = 'Comment Added';
    const description = `Added comment: "${commentText.substring(0, 100)}${commentText.length > 100 ? '...' : ''}"`;
    
    return this.addTimelineEvent(requestId, userId, 'comment_added', title, description);
  }

  // Add document upload event
  addDocumentUploadEvent(requestId: string, userId: string, fileName: string): TimelineEvent | null {
    const title = 'Document Uploaded';
    const description = `Uploaded document: ${fileName}`;
    
    return this.addTimelineEvent(requestId, userId, 'document_uploaded', title, description);
  }

  // Add assignment change event
  addAssignmentChangeEvent(
    requestId: string,
    userId: string,
    previousAssignee: string,
    newAssignee: string
  ): TimelineEvent | null {
    const title = 'Assignment Changed';
    const description = `Request reassigned from ${previousAssignee} to ${newAssignee}`;
    
    const event = this.addTimelineEvent(requestId, userId, 'assignment_changed', title, description);
    
    if (event) {
      event.previousValue = previousAssignee;
      event.newValue = newAssignee;
      
      // Update the stored event
      const timeline = localStorage.getItem(STORAGE_KEYS.TIMELINE);
      const allEvents: TimelineEvent[] = timeline ? JSON.parse(timeline) : [];
      const eventIndex = allEvents.findIndex(e => e.id === event.id);
      
      if (eventIndex !== -1) {
        allEvents[eventIndex] = event;
        localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(allEvents));
      }
    }
    
    return event;
  }

  // Get user avatar based on role
  private getUserAvatar(role: string): string {
    const avatarMap: Record<string, string> = {
      'archive_team': '👨‍💼',
      'operations_team': '👨‍🔧',
      'core_banking': '👩‍💻',
      'loan_administrator': '👨‍💼',
      'observer': '👀',
      'admin': '👑'
    };
    
    return avatarMap[role] || '👤';
  }

  // Get timeline statistics
  getTimelineStats(requestId: string): {
    totalEvents: number;
    statusChanges: number;
    comments: number;
    documents: number;
    lastActivity: Date | null;
  } {
    const events = this.getTimelineByRequestId(requestId);
    
    return {
      totalEvents: events.length,
      statusChanges: events.filter(e => e.eventType === 'status_change').length,
      comments: events.filter(e => e.eventType === 'comment_added').length,
      documents: events.filter(e => e.eventType === 'document_uploaded').length,
      lastActivity: events.length > 0 ? new Date(events[0].createdAt) : null
    };
  }
}

export const timelineService = new TimelineService();
