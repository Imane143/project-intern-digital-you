import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import styled from 'styled-components';
import { boardService } from '../services/board';
import { workspaceService } from '../services/workspace';

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
`;

const Header = styled.div`
  padding: 20px;
  background: white;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  color: #2c3e50;
`;

const Subtitle = styled.p`
  color: #7f8c8d;
  margin: 8px 0 0 0;
  font-size: 14px;
  line-height: 1.5;
`;

const CreateButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #2980b9;
  }
`;

const BoardsContainer = styled.div`
  padding: 20px;
  flex: 1;
  overflow-y: auto;
`;

const BoardsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const BoardCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }
`;

const BoardName = styled.h3`
  margin: 0 0 10px 0;
  color: #2c3e50;
`;

const BoardDescription = styled.p`
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
`;

const KanbanBoard = styled.div`
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 20px;
  min-height: 500px;
`;

const List = styled.div`
  background: #ecf0f1;
  border-radius: 8px;
  min-width: 300px;
  max-width: 300px;
  padding: 15px;
  display: flex;
  flex-direction: column;
`;

const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const ListTitle = styled.h3`
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
`;

const AddTaskButton = styled.button`
  background-color: #95a5a6;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;

  &:hover {
    background-color: #7f8c8d;
  }
`;

const TasksList = styled.div`
  flex: 1;
  min-height: 100px;
`;

const TaskCard = styled.div`
  background: white;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  cursor: pointer;

  &:hover {
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  }
`;

const TaskTitle = styled.h4`
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 14px;
`;

const TaskMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #7f8c8d;
`;

const AssignedTo = styled.span`
  background-color: #e8f4f8;
  color: #3498db;
  padding: 2px 6px;
  border-radius: 3px;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 5px;
  color: #555;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const Select = styled.select`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const TextArea = styled.textarea`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  min-height: 80px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;

  &.primary {
    background-color: #3498db;
    color: white;

    &:hover {
      background-color: #2980b9;
    }
  }

  &.secondary {
    background-color: #ecf0f1;
    color: #7f8c8d;

    &:hover {
      background-color: #bdc3c7;
    }
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 5px;

  &:hover {
    text-decoration: underline;
  }
`;

function BoardsView({ workspaceId }) {
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showTaskViewModal, setShowTaskViewModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedListId, setSelectedListId] = useState(null);
  const [boardFormData, setBoardFormData] = useState({
    name: '',
    description: ''
  });
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: ''
  });

  useEffect(() => {
    fetchBoards();
    fetchWorkspaceMembers();
  }, [workspaceId]);

  const fetchBoards = async () => {
    try {
      const data = await boardService.getBoards(workspaceId);
      setBoards(data);
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    }
  };

  const fetchWorkspaceMembers = async () => {
    try {
      console.log('Fetching workspace members for workspaceId:', workspaceId);
      const data = await workspaceService.getMembers(workspaceId);
      console.log('Workspace members received:', data);
      setWorkspaceMembers(data);
    } catch (error) {
      console.error('Failed to fetch workspace members:', error);
    }
  };

  const fetchBoardDetails = async (boardId) => {
    try {
      const data = await boardService.getBoardWithLists(workspaceId, boardId);
      setSelectedBoard(data);
    } catch (error) {
      console.error('Failed to fetch board details:', error);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    try {
      await boardService.createBoard(workspaceId, boardFormData);
      setShowCreateBoardModal(false);
      setBoardFormData({ name: '', description: '' });
      fetchBoards();
    } catch (error) {
      alert('Failed to create board');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await boardService.createTask(workspaceId, selectedBoard.id, {
        ...taskFormData,
        listId: selectedListId
      });
      setShowCreateTaskModal(false);
      setTaskFormData({ title: '', description: '', assignedTo: '', dueDate: '' });
      fetchBoardDetails(selectedBoard.id);
    } catch (error) {
      alert('Failed to create task');
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskViewModal(true);
  };

  const handleDragEnd = async (result) => {
    console.log('Drag ended:', result);
    
    if (!result.destination) {
      console.log('No destination, drag cancelled');
      return;
    }

    const { draggableId, source, destination } = result;
    console.log('Drag details:', { draggableId, source, destination });

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      console.log('Same position, no move needed');
      return;
    }

    try {
      // Extract task ID from draggableId (remove "task-" prefix)
      const taskId = parseInt(draggableId.replace('task-', ''));
      console.log('Moving task:', taskId, 'to list:', destination.droppableId, 'position:', destination.index + 1);
      
      await boardService.moveTask(workspaceId, {
        taskId: taskId,
        targetListId: parseInt(destination.droppableId),
        targetPosition: destination.index + 1
      });
      
      console.log('Task moved successfully');
      fetchBoardDetails(selectedBoard.id);
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  if (selectedBoard) {
    return (
      <Container>
        <Header>
          <div>
            <BackButton onClick={() => setSelectedBoard(null)}>
              ← Back to Boards
            </BackButton>
            <Title>{selectedBoard.name}</Title>
          </div>
        </Header>

        <BoardsContainer>
          <DragDropContext onDragEnd={handleDragEnd}>
            <KanbanBoard>
              {selectedBoard.lists?.map((list) => (
                <List key={list.id}>
                  <ListHeader>
                    <ListTitle>{list.name}</ListTitle>
                    <AddTaskButton
                      onClick={() => {
                        setSelectedListId(list.id);
                        setShowCreateTaskModal(true);
                      }}
                    >
                      + Add Task
                    </AddTaskButton>
                  </ListHeader>
                  
                  <Droppable droppableId={list.id.toString()} type="TASK">
                    {(provided, snapshot) => (
                      <TasksList
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          backgroundColor: snapshot.isDraggingOver ? '#d5dbdb' : 'transparent'
                        }}
                      >
                        {list.tasks?.map((task, index) => (
                          <Draggable
                            key={`task-${task.id}`}
                            draggableId={`task-${task.id}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <TaskCard
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  opacity: snapshot.isDragging ? 0.8 : 1
                                }}
                                onClick={() => handleTaskClick(task)}
                              >
                                <TaskTitle>{task.title}</TaskTitle>
                                {task.description && (
                                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#7f8c8d' }}>
                                    {task.description}
                                  </p>
                                )}
                                <TaskMeta>
                                  {task.assigned_to_name && (
                                    <AssignedTo>{task.assigned_to_name}</AssignedTo>
                                  )}
                                  {task.due_date && (
                                    <span>{new Date(task.due_date).toLocaleDateString()}</span>
                                  )}
                                </TaskMeta>
                              </TaskCard>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </TasksList>
                    )}
                  </Droppable>
                </List>
              ))}
            </KanbanBoard>
          </DragDropContext>
        </BoardsContainer>

        {showCreateTaskModal && (
          <Modal onClick={() => setShowCreateTaskModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <h2>Create New Task</h2>
              <Form onSubmit={handleCreateTask}>
                <FormGroup>
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    type="text"
                    id="title"
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="description">Description</Label>
                  <TextArea
                    id="description"
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="assignedTo">Assign To</Label>
                  <Select
                    id="assignedTo"
                    value={taskFormData.assignedTo}
                    onChange={(e) => setTaskFormData({ ...taskFormData, assignedTo: e.target.value })}
                  >
                    <option value="">No assignment</option>
                    {workspaceMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    type="date"
                    id="dueDate"
                    value={taskFormData.dueDate}
                    onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                  />
                </FormGroup>
                <ButtonGroup>
                  <Button type="button" className="secondary" onClick={() => setShowCreateTaskModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="primary">
                    Create Task
                  </Button>
                </ButtonGroup>
              </Form>
            </ModalContent>
          </Modal>
        )}

        {showTaskViewModal && selectedTask && (
          <Modal onClick={() => setShowTaskViewModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <h2>{selectedTask.title}</h2>
              <div style={{ marginBottom: '20px' }}>
                <Label>Description:</Label>
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '4px',
                  minHeight: '60px',
                  color: selectedTask.description ? '#2c3e50' : '#7f8c8d',
                  fontStyle: selectedTask.description ? 'normal' : 'italic'
                }}>
                  {selectedTask.description || 'No description provided'}
                </div>
              </div>
              {selectedTask.assigned_to_name && (
                <div style={{ marginBottom: '15px' }}>
                  <Label>Assigned to:</Label>
                  <div style={{ 
                    display: 'inline-block',
                    backgroundColor: '#e8f4f8',
                    color: '#3498db',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    {selectedTask.assigned_to_name}
                  </div>
                </div>
              )}
              {selectedTask.due_date && (
                <div style={{ marginBottom: '15px' }}>
                  <Label>Due Date:</Label>
                  <div style={{ color: '#7f8c8d' }}>
                    {new Date(selectedTask.due_date).toLocaleDateString()}
                  </div>
                </div>
              )}
              <div style={{ marginBottom: '20px' }}>
                <Label>Created:</Label>
                <div style={{ color: '#7f8c8d', fontSize: '14px' }}>
                  {new Date(selectedTask.created_at).toLocaleDateString()} at {new Date(selectedTask.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <ButtonGroup>
                <Button type="button" className="secondary" onClick={() => setShowTaskViewModal(false)}>
                  Close
                </Button>
              </ButtonGroup>
            </ModalContent>
          </Modal>
        )}
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div>
          <Title>Boards</Title>
          <Subtitle>
            Boards help you organize and track work using Kanban-style task management. Create lists, add tasks, and drag them through your workflow.
          </Subtitle>
        </div>
        <CreateButton onClick={() => setShowCreateBoardModal(true)}>
          Create Board
        </CreateButton>
      </Header>

      <BoardsContainer>
        {boards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            No boards yet. Create your first board to get started!
          </div>
        ) : (
          <BoardsList>
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                onClick={() => fetchBoardDetails(board.id)}
              >
                <BoardName>{board.name}</BoardName>
                <BoardDescription>
                  {board.description || 'No description'}
                </BoardDescription>
              </BoardCard>
            ))}
          </BoardsList>
        )}
      </BoardsContainer>

      {showCreateBoardModal && (
        <Modal onClick={() => setShowCreateBoardModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h2>Create New Board</h2>
            <Form onSubmit={handleCreateBoard}>
              <FormGroup>
                <Label htmlFor="name">Board Name</Label>
                <Input
                  type="text"
                  id="name"
                  value={boardFormData.name}
                  onChange={(e) => setBoardFormData({ ...boardFormData, name: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="description">Description</Label>
                <TextArea
                  id="description"
                  value={boardFormData.description}
                  onChange={(e) => setBoardFormData({ ...boardFormData, description: e.target.value })}
                />
              </FormGroup>
              <ButtonGroup>
                <Button type="button" className="secondary" onClick={() => setShowCreateBoardModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="primary">
                  Create Board
                </Button>
              </ButtonGroup>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

export default BoardsView;