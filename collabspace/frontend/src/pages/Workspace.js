import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Layout from '../components/Layout';
import BoardsView from '../components/BoardsView';
import ChatView from '../components/ChatView';
import DocumentsView from '../components/DocumentsView';
import MemberManagement from '../components/MemberManagement';
import { authService } from '../services/auth';
import { workspaceService } from '../services/workspace';

const Container = styled.div`
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
`;

const WorkspaceHeader = styled.div`
  background: white;
  border-bottom: 1px solid #ddd;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const WorkspaceInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const WorkspaceName = styled.h1`
  margin: 0;
  color: #2c3e50;
`;

const WorkspaceDescription = styled.p`
  margin: 5px 0 0 0;
  color: #7f8c8d;
  font-size: 14px;
`;

const TabContainer = styled.div`
  background: white;
  border-bottom: 1px solid #ddd;
  display: flex;
`;

const Tab = styled.button`
  background: none;
  border: none;
  padding: 15px 25px;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  font-size: 16px;
  color: #7f8c8d;
  transition: all 0.3s;

  &.active {
    color: #3498db;
    border-bottom-color: #3498db;
  }

  &:hover {
    background-color: #f8f9fa;
  }
`;

const ContentContainer = styled.div`
  flex: 1;
  overflow: hidden;
`;

function Workspace() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [activeTab, setActiveTab] = useState('boards');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchWorkspace();
  }, [workspaceId, navigate]);

  const fetchWorkspace = async () => {
    try {
      const data = await workspaceService.getWorkspace(workspaceId);
      setWorkspace(data);
    } catch (error) {
      console.error('Failed to fetch workspace:', error);
      if (error.response?.status === 403 || error.response?.status === 404) {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'boards':
        return <BoardsView workspaceId={workspaceId} />;
      case 'chat':
        return <ChatView workspaceId={workspaceId} />;
      case 'documents':
        return <DocumentsView workspaceId={workspaceId} />;
      case 'members':
        return <MemberManagement workspaceId={workspaceId} />;
      default:
        return <BoardsView workspaceId={workspaceId} />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <Container>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            Loading workspace...
          </div>
        </Container>
      </Layout>
    );
  }

  if (!workspace) {
    return (
      <Layout>
        <Container>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            Workspace not found
          </div>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container>
        <WorkspaceHeader>
          <WorkspaceInfo>
            <WorkspaceName>{workspace.name}</WorkspaceName>
            <WorkspaceDescription>
              {workspace.description || 'No description'}
            </WorkspaceDescription>
          </WorkspaceInfo>
        </WorkspaceHeader>

        <TabContainer>
          <Tab
            className={activeTab === 'boards' ? 'active' : ''}
            onClick={() => setActiveTab('boards')}
          >
            Boards
          </Tab>
          <Tab
            className={activeTab === 'chat' ? 'active' : ''}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </Tab>
          <Tab
            className={activeTab === 'documents' ? 'active' : ''}
            onClick={() => setActiveTab('documents')}
          >
            Documents
          </Tab>
          <Tab
            className={activeTab === 'members' ? 'active' : ''}
            onClick={() => setActiveTab('members')}
          >
            Members
          </Tab>
        </TabContainer>

        <ContentContainer>
          {renderContent()}
        </ContentContainer>
      </Container>
    </Layout>
  );
}

export default Workspace;