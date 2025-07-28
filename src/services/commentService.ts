import { RequestComment, CommentFormData, UserMention } from '../types/withdrawalTypes';
import { AUTHORIZED_USERS } from '../config/authorizedUsers';

// Local storage keys
const STORAGE_KEYS = {
  COMMENTS: 'adfd_request_comments',
  MENTIONS: 'adfd_user_mentions'
};

class CommentService {
  // Initialize with mock data if no data exists
  private initializeData(): void {
    if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
      const mockComments: RequestComment[] = [
        {
          id: 'comment_1',
          requestId: '1',
          userId: 'ops001',
          userName: 'Ali Al Derie',
          userAvatar: '👨‍🔧',
          commentText: 'Request has been reviewed and approved for technical assessment.',
          mentionedUsers: [],
          isInternal: false,
          createdAt: new Date('2025-05-07T10:30:00Z'),
          updatedAt: new Date('2025-05-07T10:30:00Z')
        },
        {
          id: 'comment_2',
          requestId: '2',
          userId: 'archive001',
          userName: 'Ahmed Al Zaabi',
          userAvatar: '👨‍💼',
          commentText: 'Withdrawal date has expired. @bank001 please review extension requirements.',
          mentionedUsers: ['bank001'],
          isInternal: false,
          createdAt: new Date('2025-05-08T14:30:00Z'),
          updatedAt: new Date('2025-05-08T14:30:00Z')
        },
        {
          id: 'comment_3',
          requestId: '2',
          userId: 'bank001',
          userName: 'Ahmed Siddique',
          userAvatar: '👩‍💻',
          commentText: 'Extension request documentation sent to beneficiary. Awaiting response.',
          mentionedUsers: [],
          isInternal: false,
          createdAt: new Date('2025-05-08T16:20:00Z'),
          updatedAt: new Date('2025-05-08T16:20:00Z')
        },
        {
          id: 'comment_4',
          requestId: '3',
          userId: 'ops001',
          userName: 'Ali Al Derie',
          userAvatar: '👨‍🔧',
          commentText: 'Technical review in progress. Checking project eligibility requirements.',
          mentionedUsers: [],
          isInternal: true,
          createdAt: new Date('2025-05-12T10:15:00Z'),
          updatedAt: new Date('2025-05-12T10:15:00Z')
        }
      ];
      
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(mockComments));
    }
  }

  // Get all comments for a specific request
  getCommentsByRequestId(requestId: string): RequestComment[] {
    this.initializeData();
    const comments = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    const allComments: RequestComment[] = comments ? JSON.parse(comments) : [];
    
    return allComments
      .filter(comment => comment.requestId === requestId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // Add a new comment
  addComment(requestId: string, userId: string, commentData: CommentFormData): RequestComment | null {
    try {
      this.initializeData();
      const comments = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      const allComments: RequestComment[] = comments ? JSON.parse(comments) : [];
      
      // Find user details
      const user = AUTHORIZED_USERS.find(u => u.email === userId);
      if (!user) {
        console.error('User not found:', userId);
        return null;
      }

      const newComment: RequestComment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requestId,
        userId,
        userName: user.name,
        userAvatar: this.getUserAvatar(user.role),
        commentText: commentData.commentText,
        mentionedUsers: commentData.mentionedUsers,
        isInternal: commentData.isInternal,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      allComments.push(newComment);
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(allComments));
      
      return newComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  }

  // Update an existing comment
  updateComment(commentId: string, updates: Partial<CommentFormData>): boolean {
    try {
      const comments = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      const allComments: RequestComment[] = comments ? JSON.parse(comments) : [];
      
      const commentIndex = allComments.findIndex(comment => comment.id === commentId);
      if (commentIndex === -1) return false;

      allComments[commentIndex] = {
        ...allComments[commentIndex],
        ...updates,
        updatedAt: new Date()
      };

      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(allComments));
      return true;
    } catch (error) {
      console.error('Error updating comment:', error);
      return false;
    }
  }

  // Delete a comment
  deleteComment(commentId: string): boolean {
    try {
      const comments = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      const allComments: RequestComment[] = comments ? JSON.parse(comments) : [];
      
      const filteredComments = allComments.filter(comment => comment.id !== commentId);
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(filteredComments));
      
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }

  // Get available users for mentions
  getAvailableUsersForMentions(): UserMention[] {
    return AUTHORIZED_USERS
      .filter(user => user.email !== 'Mamadouourydiallo819@gmail.com') // Exclude current user in production
      .map(user => ({
        id: user.email,
        name: user.name,
        email: user.email,
        role: user.role as any,
        avatar: this.getUserAvatar(user.role),
        isActive: true
      }));
  }

  // Parse mentions from comment text
  parseMentions(commentText: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(commentText)) !== null) {
      const username = match[1];
      // Find user by name or email
      const user = AUTHORIZED_USERS.find(u => 
        u.name.toLowerCase().includes(username.toLowerCase()) ||
        u.email.toLowerCase().includes(username.toLowerCase())
      );
      
      if (user && !mentions.includes(user.email)) {
        mentions.push(user.email);
      }
    }

    return mentions;
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

  // Get comment count for a request
  getCommentCount(requestId: string): number {
    return this.getCommentsByRequestId(requestId).length;
  }

  // Search comments by text
  searchComments(requestId: string, searchTerm: string): RequestComment[] {
    const comments = this.getCommentsByRequestId(requestId);
    const lowercaseSearch = searchTerm.toLowerCase();
    
    return comments.filter(comment =>
      comment.commentText.toLowerCase().includes(lowercaseSearch) ||
      comment.userName.toLowerCase().includes(lowercaseSearch)
    );
  }
}

export const commentService = new CommentService();
