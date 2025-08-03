import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Layout from '../components/Layout';
import { authService } from '../services/auth';
import { workspaceService } from '../services/workspace';

const Container = styled.div`
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: #2c3e50;
  margin: 0;
`;

const Subtitle = styled.p`
  color: #7f8c8d;
  margin: 8px 0 0 0;
  font-size: 16px;
  line-height: 1.5;
`;

const CreateButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #2980b9;
  }
`;

const WorkspacesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const WorkspaceCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }

  &:hover .workspace-actions {
    opacity: 1;
  }
`;

const WorkspaceName = styled.h3`
  color: #2c3e50;
  margin: 0 0 10px 0;
`;

const WorkspaceDescription = styled.p`
  color: #7f8c8d;
  margin: 0 0 15px 0;
  font-size: 14px;
`;

const WorkspaceRole = styled.span`
  background-color: #e8f4f8;
  color: #3498db;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const WorkspaceActions = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  opacity: 0;
  transition: opacity 0.3s;
  display: flex;
  gap: 5px;
`;

const ActionButton = styled.button`
  background: rgba(0,0,0,0.7);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 8px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s;

  &:hover {
    background: rgba(0,0,0,0.9);
  }

  &.delete {
    background: rgba(231, 76, 60, 0.8);

    &:hover {
      background: rgba(231, 76, 60, 1);
    }
  }
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

const ModalTitle = styled.h2`
  margin: 0 0 20px 0;
  color: #2c3e50;
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

const TextArea = styled.textarea`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  min-height: 100px;
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

const LoadingMessage = styled.div`
  text-align: center;
  color: #7f8c8d;
  padding: 40px;
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: #7f8c8d;
  padding: 40px;
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

const MembersList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
`;

const MemberItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8f9fa;
  }

  &.selected {
    background-color: #e8f4f8;
    color: #3498db;
  }
`;

const Checkbox = styled.input`
  margin-right: 10px;
`;

function Dashboard() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    memberIds: []
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchWorkspaces();
    fetchUsers();
  }, [navigate]);

  const fetchWorkspaces = async () => {
    try {
      const data = await workspaceService.getWorkspaces();
      setWorkspaces(data);
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await authService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    try {
      const workspace = await workspaceService.createWorkspace({
        name: formData.name,
        description: formData.description
      });
      
      // Add selected members to the workspace
      for (const memberId of formData.memberIds) {
        try {
          await workspaceService.addMember(workspace.id, { userId: memberId, role: 'member' });
        } catch (error) {
          console.error('Failed to add member:', error);
        }
      }
      
      setShowCreateModal(false);
      setFormData({ name: '', description: '', memberIds: [] });
      fetchWorkspaces();
    } catch (error) {
      alert('Failed to create workspace');
    }
  };

  const handleWorkspaceClick = (workspaceId) => {
    navigate(`/workspace/${workspaceId}`);
  };

  const handleMemberToggle = (userId) => {
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter(id => id !== userId)
        : [...prev.memberIds, userId]
    }));
  };

  const handleDeleteWorkspace = async (workspaceId, workspaceName, e) => {
    e.stopPropagation(); // Prevent workspace click
    
    if (!window.confirm(`Are you sure you want to delete "${workspaceName}"? This action cannot be undone and will delete all boards, tasks, and documents in this workspace.`)) {
      return;
    }

    try {
      await workspaceService.deleteWorkspace(workspaceId);
      fetchWorkspaces(); // Refresh the list
    } catch (error) {
      alert('Failed to delete workspace. You may not have permission to delete this workspace.');
    }
  };

  return (
    <Layout>
      <Container>
        <Header>
          <div>
            <Title>My Workspaces</Title>
            <Subtitle>
              Workspaces are collaborative environments where teams can organize projects, manage tasks, share documents, and communicate in real-time. Think of each workspace as a different project Digital and You is working on.
            </Subtitle>
          </div>
          {authService.getCurrentUser()?.role === 'admin' && (
            <CreateButton onClick={() => setShowCreateModal(true)}>
              Create Workspace
            </CreateButton>
          )}
        </Header>

        {loading ? (
          <LoadingMessage>Loading workspaces...</LoadingMessage>
        ) : workspaces.length === 0 ? (
          <EmptyMessage>
            No workspaces yet. Create your first workspace to get started!
          </EmptyMessage>
        ) : (
          <WorkspacesGrid>
            {workspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                onClick={() => handleWorkspaceClick(workspace.id)}
              >
                <WorkspaceActions className="workspace-actions">
                  {authService.getCurrentUser()?.role === 'admin' && (
                    <ActionButton
                      className="delete"
                      onClick={(e) => handleDeleteWorkspace(workspace.id, workspace.name, e)}
                      title="Delete workspace"
                    >
                      🗑️
                    </ActionButton>
                  )}
                </WorkspaceActions>
                <WorkspaceName>{workspace.name}</WorkspaceName>
                <WorkspaceDescription>
                  {workspace.description || 'No description'}
                </WorkspaceDescription>
                <WorkspaceRole>{workspace.user_role}</WorkspaceRole>
              </WorkspaceCard>
            ))}
          </WorkspacesGrid>
        )}

        {showCreateModal && (
          <Modal onClick={() => setShowCreateModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>Create New Workspace</ModalTitle>
              <Form onSubmit={handleCreateWorkspace}>
                <FormGroup>
                  <Label htmlFor="name">Workspace Name</Label>
                  <Input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="description">Description</Label>
                  <TextArea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Select Team Members</Label>
                  <MembersList>
                    {users.map((user) => (
                      <MemberItem
                        key={user.id}
                        className={formData.memberIds.includes(user.id) ? 'selected' : ''}
                        onClick={() => handleMemberToggle(user.id)}
                      >
                        <Checkbox
                          type="checkbox"
                          checked={formData.memberIds.includes(user.id)}
                          onChange={() => handleMemberToggle(user.id)}
                        />
                        <span>{user.name} ({user.email})</span>
                      </MemberItem>
                    ))}
                  </MembersList>
                  <p style={{ fontSize: '12px', color: '#7f8c8d', margin: '8px 0 0 0' }}>
                    Select team members who will have access to this workspace
                  </p>
                </FormGroup>
                <ButtonGroup>
                  <Button type="button" className="secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="primary">
                    Create
                  </Button>
                </ButtonGroup>
              </Form>
            </ModalContent>
          </Modal>
        )}
      </Container>
    </Layout>
  );
}

export default Dashboard;