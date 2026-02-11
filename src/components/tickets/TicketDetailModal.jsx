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

export default function TicketDetailModal({ ticket, ticketId, isOpen = true, onClose, projectId }) {
  const user = useSelector(selectCurrentUser);
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ bottom: 0, left: 0 });
  const [activeTab, setActiveTab] = useState('comments');
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskStatus, setSubtaskStatus] = useState('TODO');
  const [subtaskStoryPoints, setSubtaskStoryPoints] = useState('');
  const [subtaskAssignee, setSubtaskAssignee] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const textareaRef = useRef(null);
  const commentsEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const effectiveTicketId = ticketId || ticket?.id;
  const effectiveProjectId = projectId || ticket?.project_id;

  const { data: ticketData, isLoading: ticketLoading } = useQuery({
    queryKey: ['ticket', effectiveTicketId],
    queryFn: () => ticketsAPI.getById(effectiveTicketId),
    enabled: isOpen && !!effectiveTicketId && !ticket,
  });

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', effectiveTicketId],
    queryFn: () => ticketsAPI.getComments(effectiveTicketId),
    enabled: isOpen && !!effectiveTicketId,
  });

  const { data: membersData } = useQuery({
    queryKey: ['project-members', effectiveProjectId],
    queryFn: () => projectsAPI.getMembers(effectiveProjectId),
    enabled: !!effectiveProjectId,
  });

  const { data: subtasksData, isLoading: subtasksLoading } = useQuery({
    queryKey: ['subtasks', effectiveTicketId],
    queryFn: () => ticketsAPI.getSubTasks(effectiveTicketId),
    enabled: isOpen && !!effectiveTicketId,
  });

  const addCommentMutation = useMutation({
    mutationFn: (data) => ticketsAPI.addComment(effectiveTicketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', effectiveTicketId] });
      setCommentText('');
      setIsInternal(false);
      toast.success('Comment added');
    },
    onError: () => {
      toast.error('Failed to add comment');
    },
  });

  const createSubtaskMutation = useMutation({
    mutationFn: (data) => ticketsAPI.createSubTask(effectiveTicketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', effectiveTicketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', effectiveTicketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      resetSubtaskForm();
      toast.success('Subtask created');
    },
    onError: () => {
      toast.error('Failed to create subtask');
    },
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: ({ subTaskId, data }) => ticketsAPI.updateSubTask(subTaskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', effectiveTicketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', effectiveTicketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Subtask updated');
    },
    onError: () => {
      toast.error('Failed to update subtask');
    },
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: (subTaskId) => ticketsAPI.deleteSubTask(subTaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', effectiveTicketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', effectiveTicketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Subtask deleted');
    },
    onError: () => {
      toast.error('Failed to delete subtask');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status) => ticketsAPI.update(effectiveTicketId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', effectiveTicketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', effectiveProjectId] });
      toast.success('Status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  useEffect(() => {
    if (isOpen && effectiveTicketId) {
      socketService.on('comment_created', handleCommentUpdate);
      socketService.on('ticket_updated', handleTicketUpdate);

      return () => {
        socketService.off('comment_created', handleCommentUpdate);
        socketService.off('ticket_updated', handleTicketUpdate);
      };
    }
  }, [isOpen, effectiveTicketId]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commentsData]);

  const handleCommentUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['comments', effectiveTicketId] });
  };

  const handleTicketUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['ticket', effectiveTicketId] });
  };

  const handleCreateSubtask = () => {
    if (!subtaskTitle.trim()) return;

    const subtaskData = {
      title: subtaskTitle,
      status: subtaskStatus,
      story_points: subtaskStoryPoints ? parseInt(subtaskStoryPoints) : null,
      assignee_id: subtaskAssignee || null,
    };

    createSubtaskMutation.mutate(subtaskData);
  };

  const resetSubtaskForm = () => {
    setSubtaskTitle('');
    setSubtaskStatus('TODO');
    setSubtaskStoryPoints('');
    setSubtaskAssignee('');
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitCommentWithFiles = async () => {
    if (!commentText.trim() && selectedFiles.length === 0) return;

    try {
      await addCommentMutation.mutateAsync({
        comment_text: commentText,
        is_internal: isInternal,
      });

      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });

        await ticketsAPI.uploadAttachment(effectiveTicketId, formData);
        setSelectedFiles([]);
        toast.success('Files uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to add comment or upload files');
    }
  };

  const handleToggleSubtaskStatus = (subtask) => {
    const newStatus = subtask.status === 'DONE' ? 'TODO' : 'DONE';
    updateSubtaskMutation.mutate({
      subTaskId: subtask.id,
      data: { status: newStatus }
    });
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
    if (!commentText.trim() && selectedFiles.length === 0) return;
    handleSubmitCommentWithFiles();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  if (!isOpen) return null;
  if (ticketLoading) return <Loading fullScreen />;

  const currentTicket = ticket || ticketData?.data;
  const comments = commentsData?.data || [];
  const members = membersData?.data || [];
  const subtasks = subtasksData?.data || [];

  const filteredMembers = showMentions
    ? members.filter((m) => m.name.toLowerCase().includes(mentionSearch))
    : [];

  const isCustomer = user?.role === 'CUSTOMER';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={currentTicket?.ticket_number} size="xl">
      <div className="flex flex-col h-[600px]">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {currentTicket?.title}
              </h2>
              <div className="flex flex-wrap gap-2">
                <Badge status={currentTicket?.status}>{currentTicket?.status}</Badge>
                <Badge priority={currentTicket?.priority}>{currentTicket?.priority}</Badge>
                <Badge variant="default">{currentTicket?.work_category}</Badge>
                <Badge variant="default">{currentTicket?.work_type}</Badge>
                {currentTicket?.story_points && !isCustomer && (
                  <Badge variant="primary">{currentTicket.story_points} pts</Badge>
                )}
              </div>
            </div>
            {!isCustomer && (
              <Select
                value={currentTicket?.status}
                onChange={(e) => updateStatusMutation.mutate(e.target.value)}
                options={[
                  { value: 'OPEN', label: 'Open' },
                  { value: 'TODO', label: 'To Do' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'IN_REVIEW', label: 'In Review' },
                  { value: 'DONE', label: 'Done' },
                  { value: 'CLOSED', label: 'Closed' },
                ]}
                className="w-40"
              />
            )}
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-3">{currentTicket?.description}</p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium">Reporter:</span> {currentTicket?.reporter_name}
            </div>
            <div>
              <span className="font-medium">Assignee:</span> {currentTicket?.assignee_name || 'Unassigned'}
            </div>
            <div>
              <span className="font-medium">Created:</span>{' '}
              {new Date(currentTicket?.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('comments')}
              className={`pb-2 px-1 font-medium transition-colors ${
                activeTab === 'comments'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Comments ({comments.length})
            </button>
            <button
              onClick={() => setActiveTab('subtasks')}
              className={`pb-2 px-1 font-medium transition-colors ${
                activeTab === 'subtasks'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Subtasks ({subtasks.length})
            </button>
          </div>
        </div>

        {activeTab === 'comments' ? (
          <>
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

              {selectedFiles.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg text-sm"
                    >
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={commentText}
                    onChange={handleCommentChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type @ to mention team members... (Press Enter to send, Shift+Enter for new line)"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                    rows="3"
                  />
                  <div className="flex gap-2 mt-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      Attach files
                    </button>
                  </div>
                </div>
                <Button
                  onClick={handleSubmitCommentWithFiles}
                  disabled={!commentText.trim() && selectedFiles.length === 0}
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
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto mb-4 pr-2">
              {subtasksLoading ? (
                <Loading />
              ) : subtasks.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No subtasks yet. Create one to break down this ticket!
                </div>
              ) : (
                <div className="space-y-3">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={subtask.status === 'DONE'}
                          onChange={() => handleToggleSubtaskStatus(subtask)}
                          className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-gray-900 dark:text-white font-medium mb-2 ${
                            subtask.status === 'DONE' ? 'line-through opacity-60' : ''
                          }`}>
                            {subtask.title}
                          </p>
                          <div className="flex flex-wrap gap-2 items-center">
                            <Select
                              value={subtask.status}
                              onChange={(e) => updateSubtaskMutation.mutate({
                                subTaskId: subtask.id,
                                data: { status: e.target.value }
                              })}
                              options={[
                                { value: 'TODO', label: 'To Do' },
                                { value: 'IN_PROGRESS', label: 'In Progress' },
                                { value: 'IN_REVIEW', label: 'In Review' },
                                { value: 'DONE', label: 'Done' },
                              ]}
                              className="text-xs w-32"
                            />
                            <Select
                              value={subtask.assignee_id || ''}
                              onChange={(e) => updateSubtaskMutation.mutate({
                                subTaskId: subtask.id,
                                data: { assignee_id: e.target.value || null }
                              })}
                              options={[
                                { value: '', label: 'Unassigned' },
                                ...members.map((m) => ({ value: m.user_id, label: m.name })),
                              ]}
                              className="text-xs w-40"
                            />
                            {subtask.story_points && (
                              <Badge variant="primary" className="text-xs">
                                {subtask.story_points} pts
                              </Badge>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm('Delete this subtask?')) {
                              deleteSubtaskMutation.mutate(subtask.id);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Create Subtask</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={subtaskTitle}
                    onChange={(e) => setSubtaskTitle(e.target.value)}
                    placeholder="Enter subtask title..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <Select
                      value={subtaskStatus}
                      onChange={(e) => setSubtaskStatus(e.target.value)}
                      options={[
                        { value: 'TODO', label: 'To Do' },
                        { value: 'IN_PROGRESS', label: 'In Progress' },
                        { value: 'IN_REVIEW', label: 'In Review' },
                        { value: 'DONE', label: 'Done' },
                      ]}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Story Points
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={subtaskStoryPoints}
                      onChange={(e) => setSubtaskStoryPoints(e.target.value)}
                      placeholder="Points"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assignee
                    </label>
                    <Select
                      value={subtaskAssignee}
                      onChange={(e) => setSubtaskAssignee(e.target.value)}
                      options={[
                        { value: '', label: 'Unassigned' },
                        ...members.map((m) => ({ value: m.user_id, label: m.name })),
                      ]}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleCreateSubtask}
                    disabled={!subtaskTitle.trim()}
                    loading={createSubtaskMutation.isPending}
                  >
                    Create Subtask
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
