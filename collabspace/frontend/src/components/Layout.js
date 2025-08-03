import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { authService } from '../services/auth';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  background-color: #2c3e50;
  color: white;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Brand = styled.h1`
  font-size: 24px;
  margin: 0;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &.active {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const UserName = styled.span`
  font-size: 14px;
`;

const LogoutButton = styled.button`
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #c0392b;
  }
`;

const Main = styled.main`
  flex: 1;
  background-color: #ecf0f1;
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
  max-width: 400px;
  text-align: center;
`;

const ModalTitle = styled.h3`
  margin: 0 0 15px 0;
  color: #2c3e50;
`;

const ModalText = styled.p`
  margin: 0 0 25px 0;
  color: #7f8c8d;
  line-height: 1.5;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
`;

const ModalButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;

  &.confirm {
    background-color: #e74c3c;
    color: white;

    &:hover {
      background-color: #c0392b;
    }
  }

  &.cancel {
    background-color: #ecf0f1;
    color: #7f8c8d;

    &:hover {
      background-color: #bdc3c7;
    }
  }
`;

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(authService.getCurrentUser());
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Debug logging
  console.log('Layout render - Current user:', user);
  console.log('User role:', user?.role);
  console.log('Is admin?', user?.role === 'admin');

  // Force refresh user data when location changes (like after login)
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, [location.pathname]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    authService.logout();
    navigate('/login');
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path) ? 'active' : '';
  };

  return (
    <Container>
      <Header>
        <Brand>CollabSpace</Brand>
        <Nav>
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={isActive('/admin')}>
              Create New User
            </NavLink>
          )}
          <NavLink to="/dashboard" className={isActive('/dashboard')}>
            Dashboard
          </NavLink>
        </Nav>
        <UserInfo>
          <UserName>{user?.name}</UserName>
          <LogoutButton onClick={handleLogoutClick}>Logout</LogoutButton>
        </UserInfo>
      </Header>
      <Main>{children}</Main>
      
      {showLogoutModal && (
        <Modal onClick={handleLogoutCancel}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Confirm Logout</ModalTitle>
            <ModalText>
              Are you sure you want to log out? You'll need to sign in again to access your workspaces.
            </ModalText>
            <ModalButtons>
              <ModalButton className="cancel" onClick={handleLogoutCancel}>
                Cancel
              </ModalButton>
              <ModalButton className="confirm" onClick={handleLogoutConfirm}>
                Yes, Logout
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

export default Layout;