import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { ticketsAPI } from '@/services/api/tickets.api';
import { projectsAPI } from '@/services/api/projects.api';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Select from '@/components/ui/Select';
import toast from 'react-hot-toast';
import { socketService } from '@/services/socket/socket';

function CommentItem({ comment, currentUserId }) {
  const isOwn = comment.user_id === currentUserId;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} max-w-[80%] gap-3`}>
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-medium">
            {comment.user_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
        <div className="flex-1">
          <div className={`rounded-2xl px-4 py-3 ${
            isOwn
              ? 'bg-primary text-white rounded-tr-sm'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-sm'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{comment.user_name}</span>
              {comment.is_internal && (
                <Badge variant="warning" className="text-xs">Internal</Badge>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap break-words">{comment.comment_text}</p>
          </div>
          <div className={`mt-1 text-xs text-gray-500 ${isOwn ? 'text-right' : 'text-left'}`}>
            {new Date(comment.created_at).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function MentionSuggestions({ members, onSelect, position }) {
  if (!members || members.length === 0) return null;

  return (
    <div
      className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
      style={{ bottom: position.bottom, left: position.left }}
    >
      {members.map((member) => (
        <button
          key={member.id}
          type="button"
          onClick={() => onSelect(member)}
          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">
            {member.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-sm text-gray-900 dark:text-white">{member.name}</div>
            <div className="text-xs text-gray-500">{member.email}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function TicketDetailModal({ ticketId, isOpen, onClose }) {
  const user = useSelector(selectCurrentUser);
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ bottom: 0, left: 0 });
  const textareaRef = useRef(null);
  const commentsEndRef = useRef(null);

  const { data: ticketData, isLoading: ticketLoading } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketsAPI.getById(ticketId),
    enabled: isOpen && !!ticketId,
  });

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', ticketId],
    queryFn: () => ticketsAPI.getComments(ticketId),
    enabled: isOpen && !!ticketId,
  });

  const { data: membersData } = useQuery({
    queryKey: ['project-members', ticketData?.data?.project_id],
    queryFn: () => projectsAPI.getMembers(ticketData?.data?.project_id),
    enabled: !!ticketData?.data?.project_id,
  });

  const addCommentMutation = useMutation({
    mutationFn: (data) => ticketsAPI.addComment(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ticketId] });
      setCommentText('');
      setIsInternal(false);
      toast.success('Comment added');
    },
    onError: () => {
      toast.error('Failed to add comment');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status) => ticketsAPI.update(ticketId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
      toast.success('Status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  useEffect(() => {
    if (isOpen && ticketId) {
      socketService.on('comment_created', handleCommentUpdate);
      socketService.on('ticket_updated', handleTicketUpdate);

      return () => {
        socketService.off('comment_created', handleCommentUpdate);
        socketService.off('ticket_updated', handleTicketUpdate);
      };
    }
  }, [isOpen, ticketId]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commentsData]);

  const handleCommentUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['comments', ticketId] });
  };

  const handleTicketUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    setCommentText(value);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setShowMentions(true);
      setMentionSearch(mentionMatch[1].toLowerCase());

      const textarea = textareaRef.current;
      const rect = textarea.getBoundingClientRect();
      setMentionPosition({
        bottom: window.innerHeight - rect.top + 10,
        left: rect.left,
      });
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (member) => {
    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = commentText.substring(0, cursorPosition);
    const textAfterCursor = commentText.substring(cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const newText = textBeforeCursor.replace(/@(\w*)$/, `@${member.name} `) + textAfterCursor;
      setCommentText(newText);
    }

    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;

    addCommentMutation.mutate({
      comment_text: commentText,
      is_internal: isInternal,
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  if (!isOpen) return null;
  if (ticketLoading) return <Loading fullScreen />;

  const ticket = ticketData?.data;
  const comments = commentsData?.data || [];
  const members = membersData?.data || [];

  const filteredMembers = showMentions
    ? members.filter((m) => m.name.toLowerCase().includes(mentionSearch))
    : [];

  const isCustomer = user?.role === 'CUSTOMER';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ticket?.ticket_number} size="xl">
      <div className="flex flex-col h-[600px]">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {ticket?.title}
              </h2>
              <div className="flex flex-wrap gap-2">
                <Badge status={ticket?.status}>{ticket?.status}</Badge>
                <Badge priority={ticket?.priority}>{ticket?.priority}</Badge>
                <Badge variant="default">{ticket?.work_category}</Badge>
                <Badge variant="default">{ticket?.work_type}</Badge>
                {ticket?.story_points && !isCustomer && (
                  <Badge variant="primary">{ticket.story_points} pts</Badge>
                )}
              </div>
            </div>
            {!isCustomer && (
              <Select
                value={ticket?.status}
                onChange={(e) => updateStatusMutation.mutate(e.target.value)}
                options={[
                  { value: 'TODO', label: 'To Do' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'IN_REVIEW', label: 'In Review' },
                  { value: 'DONE', label: 'Done' },
                ]}
                className="w-40"
              />
            )}
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-3">{ticket?.description}</p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium">Reporter:</span> {ticket?.reporter_name}
            </div>
            <div>
              <span className="font-medium">Assignee:</span> {ticket?.assignee_name || 'Unassigned'}
            </div>
            <div>
              <span className="font-medium">Created:</span>{' '}
              {new Date(ticket?.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 pr-2 scrollbar-hide">
          {commentsLoading ? (
            <Loading />
          ) : comments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No comments yet. Start the conversation!
            </div>
          ) : (
            <>
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} currentUserId={user?.id} />
              ))}
              <div ref={commentsEndRef} />
            </>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 relative">
          {!isCustomer && (
            <label className="flex items-center gap-2 mb-2 text-sm">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded text-primary focus:ring-primary"
              />
              <span className="text-gray-700 dark:text-gray-300">Internal comment</span>
            </label>
          )}

          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={commentText}
              onChange={handleCommentChange}
              onKeyPress={handleKeyPress}
              placeholder="Type @ to mention team members... (Press Enter to send, Shift+Enter for new line)"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
              rows="3"
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!commentText.trim()}
              loading={addCommentMutation.isPending}
              className="self-end"
            >
              Send
            </Button>
          </div>

          <MentionSuggestions
            members={filteredMembers}
            onSelect={handleMentionSelect}
            position={mentionPosition}
          />
        </div>
      </div>
    </Modal>
  );
}
