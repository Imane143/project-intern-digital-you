import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Layout from '../components/Layout';
import { authService } from '../services/auth';

const Container = styled.div`
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Section = styled.section`
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
`;

const SectionTitle = styled.h2`
  color: #333;
  margin-bottom: 20px;
`;

const Form = styled.form`
  display: grid;
  gap: 15px;
  max-width: 500px;
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
    border-color: #2196F3;
  }
`;

const Select = styled.select`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #2196F3;
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background-color: #45a049;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
  
  &.success {
    background-color: #d4edda;
    color: #155724;
  }
  
  &.error {
    background-color: #f8d7da;
    color: #721c24;
  }
`;

function AdminDashboard() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'employee'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!authService.isAuthenticated() || user?.role !== 'admin') {
      navigate('/login');
    }
  }, [navigate, user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await authService.createUser(formData);
      setMessage({ 
        type: 'success', 
        text: `User created successfully! ${formData.name} can now log in with email: ${formData.email} and the password you provided.` 
      });
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'employee'
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to create user' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Container>
        <Section>
          <SectionTitle>Create New User</SectionTitle>
          <p style={{ color: '#666', marginBottom: '20px', lineHeight: '1.5' }}>
            As an admin, you can create new employee accounts. The employee will use the email and password you provide here to log into the system. You can also create additional admin accounts.
          </p>
          
          {message.text && (
            <Message className={message.type}>{message.text}</Message>
          )}
          
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="name">Full Name</Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="password">Password (for the new user)</Label>
              <Input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                minLength="6"
                placeholder="Create a password for this user"
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="role">Role</Label>
              <Select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </Select>
            </FormGroup>
            
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </Form>
        </Section>
      </Container>
    </Layout>
  );
}

export default AdminDashboard;