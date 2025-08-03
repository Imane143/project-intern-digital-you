import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { workspaceService } from '../services/workspace';
import { authService } from '../services/auth';

const Container = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h3`
  margin: 0;
  color: #2c3e50;
`;

const AddButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background-color: #2980b9;
  }
`;

const MembersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MemberItem = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 12px;
  border: 1px solid #ecf0f1;
  border-radius: 4px;
`;

const MemberInfo = styled.div`
  flex: 1;
`;

const MemberName = styled.div`
  font-weight: 500;
  color: #2c3e50;
`;

const MemberEmail = styled.div`
  font-size: 12px;
  color: #7f8c8d;
`;

const MemberRole = styled.span`
  background-color: #e8f4f8;
  color: #3498db;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 10px;
`;

const RemoveButton = styled.button`
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;

  &:hover {
    background-color: #c0392b;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: #7f8c8d;
  padding: 20px;
`;

function MemberManagement({ workspaceId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchMembers();
  }, [workspaceId]);

  const fetchMembers = async () => {
    try {
      const data = await workspaceService.getMembers(workspaceId);
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      await workspaceService.removeMember(workspaceId, userId);
      fetchMembers();
    } catch (error) {
      alert('Failed to remove member');
    }
  };

  const canRemove = (member) => {
    console.log('Checking canRemove for member:', member.name, 'Current user role:', currentUser?.role);
    
    // Only system admins can remove members
    if (currentUser?.role !== 'admin') {
      console.log('Current user is not a system admin, cannot remove members');
      return false;
    }
    
    // System admins cannot remove themselves
    if (member.id === currentUser?.id) {
      console.log('Cannot remove yourself');
      return false;
    }
    
    // System admins cannot remove workspace owners (but can remove other system admins)
    if (member.role === 'owner') {
      console.log('Cannot remove workspace owner');
      return false;
    }
    
    console.log('Can remove this member');
    return true;
  };

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Loading members...</LoadingMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Workspace Members ({members.length})</Title>
      </Header>

      <MembersList>
        {members.map((member) => (
          <MemberItem key={member.id}>
            <MemberInfo>
              <MemberName>{member.name}</MemberName>
              <MemberEmail>{member.email}</MemberEmail>
            </MemberInfo>
            <MemberRole>{member.role}</MemberRole>
            {canRemove(member) && (
              <RemoveButton onClick={() => handleRemoveMember(member.id)}>
                Remove
              </RemoveButton>
            )}
          </MemberItem>
        ))}
      </MembersList>
    </Container>
  );
}

export default MemberManagement;