import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { documentService } from '../services/document';
import { authService } from '../services/auth';
import { workspaceService } from '../services/workspace';

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
`;

const Header = styled.div`
  background: white;
  border-bottom: 1px solid #ddd;
  padding: 20px;
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

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const UploadButton = styled.button`
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

  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }
`;

const CreateFolderButton = styled.button`
  background-color: #27ae60;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #229954;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const FolderPath = styled.div`
  background: #ecf0f1;
  padding: 10px 20px;
  border-bottom: 1px solid #ddd;
  font-size: 14px;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const Breadcrumb = styled.span`
  cursor: pointer;
  color: #3498db;
  
  &:hover {
    text-decoration: underline;
  }
  
  &:first-child {
    color: #3498db;
    font-weight: 500;
  }
`;

const BreadcrumbSeparator = styled.span`
  color: #7f8c8d;
  margin: 0 5px;
`;

const ContentContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const DocumentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
`;

const DocumentCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }
`;

const DocumentIcon = styled.div`
  width: 40px;
  height: 40px;
  background-color: #3498db;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 500;
  margin-bottom: 10px;
`;

const DocumentName = styled.h4`
  margin: 0 0 5px 0;
  color: #2c3e50;
  font-size: 14px;
  word-wrap: break-word;
`;

const DocumentMeta = styled.div`
  font-size: 12px;
  color: #7f8c8d;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const DocumentSize = styled.span``;

const DocumentUploader = styled.span``;

const DocumentDate = styled.span``;

const DocumentActions = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  opacity: 0;
  transition: opacity 0.3s;

  ${DocumentCard}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled.button`
  background: rgba(0,0,0,0.7);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 8px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 5px;

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

const UploadProgress = styled.div`
  background: #e8f4f8;
  border: 1px solid #3498db;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 8px;
  background-color: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background-color: #3498db;
  transition: width 0.3s;
  width: ${props => props.progress}%;
`;

function DocumentsView({ workspaceId }) {
  const [allDocuments, setAllDocuments] = useState([]);
  const [folders, setFolders] = useState([]); // Start empty, will be loaded from localStorage
  const hasInitialized = useRef(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeUploadFolder, setActiveUploadFolder] = useState('/');
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const fileInputRef = useRef(null);
  const currentUser = authService.getCurrentUser();

  // Helper function to extract folder paths from tree structure
  const extractFoldersFromTree = (tree, paths = []) => {
    if (tree.path) {
      paths.push(tree.path);
    }
    if (tree.children) {
      tree.children.forEach(child => extractFoldersFromTree(child, paths));
    }
    return paths;
  };

  // Load folders from API on mount and workspace change
  useEffect(() => {
    console.log('DocumentsView component mounted/workspaceId changed:', workspaceId, 'hasInitialized:', hasInitialized.current);
    
    if (!workspaceId) {
      console.log('No workspaceId provided, skipping folder load');
      return;
    }
    
    // Reset initialization flag when workspace changes
    hasInitialized.current = false;
    
    // Load folders from API
    const loadFolders = async () => {
      try {
        const folderTree = await documentService.getFolders(workspaceId);
        const extractedFolders = extractFoldersFromTree(folderTree);
        
        console.log('Loaded folders from API:', extractedFolders);
        setFolders(extractedFolders.length > 0 ? extractedFolders : ['/']);
        hasInitialized.current = true;
        
        // Fetch documents with the loaded folders
        fetchAllDocuments(extractedFolders.length > 0 ? extractedFolders : ['/']);
      } catch (error) {
        console.error('Failed to load folders:', error);
        // Fallback to root folder
        setFolders(['/']);
        hasInitialized.current = true;
        fetchAllDocuments(['/']);
      }
    };
    
    loadFolders();
    
    // Fetch workspace members to get current user's workspace role
    fetchWorkspaceMembers();
    
  }, [workspaceId])


  // No longer need to save folders to localStorage since they're in the database

  const fetchAllDocuments = useCallback(async (foldersToUse = null) => {
    try {
      const currentFolders = foldersToUse || folders;
      console.log('fetchAllDocuments called with folders:', currentFolders);
      
      // Don't fetch if no folders available
      if (!currentFolders || currentFolders.length === 0) {
        console.log('No folders available, skipping fetch');
        return;
      }
      
      // Fetch documents from all existing folders
      let allDocs = [];
      const newFoldersFound = new Set();
      
      // Fetch documents from all known folders (including manually created ones)
      for (const folderPath of currentFolders) {
        try {
          console.log('Fetching documents from folder:', folderPath);
          const folderDocs = await documentService.getDocuments(workspaceId, folderPath);
          allDocs = [...allDocs, ...folderDocs];
          console.log(`Found ${folderDocs.length} documents in ${folderPath}`);
        } catch (error) {
          console.error(`Failed to fetch documents from ${folderPath}:`, error);
        }
      }
      
      // Extract any new folders from document paths that we might have missed
      allDocs.forEach(doc => {
        if (doc.folder_path && !currentFolders.includes(doc.folder_path)) {
          newFoldersFound.add(doc.folder_path);
        }
      });
      
      // Only update documents if we actually got some data (avoid clearing the list)
      console.log('About to set all documents:', allDocs.length, 'total documents');
      setAllDocuments(allDocs);
      
      // Don't automatically add folders from documents to avoid circular updates
      // Only log if we found any, but don't modify state
      if (newFoldersFound.size > 0) {
        console.log('Found new folders from documents (not adding automatically):', Array.from(newFoldersFound));
      } else {
        console.log('No new folders found from documents');
      }
      
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]); // Remove folders from dependencies to avoid circular updates

  const fetchWorkspaceMembers = async () => {
    try {
      const data = await workspaceService.getMembers(workspaceId);
      setWorkspaceMembers(data);
      console.log('Workspace members fetched:', data);
    } catch (error) {
      console.error('Failed to fetch workspace members:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleUpload(file, activeUploadFolder);
    }
  };

  const handleUpload = async (file, folderPath) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await documentService.uploadFile(workspaceId, file, folderPath);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        fetchAllDocuments(folders);
      }, 500);

    } catch (error) {
      setUploading(false);
      setUploadProgress(0);
      alert('Failed to upload file');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (doc) => {
    try {
      console.log('Downloading document:', doc);
      const response = await documentService.downloadFile(workspaceId, doc.id);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: doc.mime_type || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.original_name;
      document.body.appendChild(link); // Add to DOM
      link.click();
      document.body.removeChild(link); // Remove from DOM
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (document) => {
    if (!window.confirm(`Are you sure you want to delete "${document.original_name}"?`)) {
      return;
    }

    try {
      await documentService.deleteFile(workspaceId, document.id);
      
      // Update the state immediately by removing the deleted document
      setAllDocuments(prevDocs => prevDocs.filter(doc => doc.id !== document.id));
      
      // No need to refetch - the immediate state update is sufficient
    } catch (error) {
      alert('Failed to delete file');
    }
  };

  const canDelete = (document) => {
    // User uploaded the file themselves
    if (document.uploaded_by === currentUser?.id) {
      return true;
    }
    
    // System admin can delete any file
    if (currentUser?.role === 'admin') {
      return true;
    }
    
    // Workspace admin can delete any file in their workspace
    const currentUserWorkspaceRole = workspaceMembers.find(member => member.id === currentUser?.id)?.role;
    if (currentUserWorkspaceRole === 'admin' || currentUserWorkspaceRole === 'owner') {
      return true;
    }
    
    return false;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType, fileName) => {
    if (mimeType?.startsWith('image/')) return '🖼️';
    if (mimeType?.startsWith('video/')) return '🎥';
    if (mimeType?.startsWith('audio/')) return '🎵';
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word') || fileName?.endsWith('.doc') || fileName?.endsWith('.docx')) return '📝';
    if (mimeType?.includes('sheet') || fileName?.endsWith('.xls') || fileName?.endsWith('.xlsx')) return '📊';
    if (mimeType?.includes('presentation') || fileName?.endsWith('.ppt') || fileName?.endsWith('.pptx')) return '📋';
    if (mimeType?.includes('zip') || mimeType?.includes('rar') || mimeType?.includes('tar')) return '🗜️';
    return '📁';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading || folders.length === 0) {
    return (
      <Container>
        <LoadingMessage>Loading documents...</LoadingMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div>
          <Title>Documents</Title>
          <Subtitle>
            Centralize all your project files in one place so team members can easily access, share, and collaborate on documents without losing track of important files.
          </Subtitle>
        </div>
        <HeaderActions>
          <CreateFolderButton onClick={() => setShowCreateFolderModal(true)}>
            📁 Create Folder
          </CreateFolderButton>
          <UploadButton
            onClick={() => {
              setActiveUploadFolder('/'); // Always upload to root when using main button
              fileInputRef.current?.click();
            }}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload to Root'}
          </UploadButton>
          <HiddenFileInput
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept="*/*"
          />
        </HeaderActions>
      </Header>

      <ContentContainer>
        {uploading && (
          <UploadProgress>
            <div>Uploading to: {activeUploadFolder === '/' ? 'Root' : activeUploadFolder}</div>
            <ProgressBar>
              <ProgressFill progress={uploadProgress} />
            </ProgressBar>
            <div>{uploadProgress}%</div>
          </UploadProgress>
        )}

        {folders.map((folderPath) => {
          const folderDocuments = allDocuments.filter(doc => doc.folder_path === folderPath);
          const folderName = folderPath === '/' ? 'Root Folder' : folderPath.replace('/', '');
          
          return (
            <div key={folderPath} style={{ marginBottom: '40px' }}>
              {/* Folder Header */}
              <div style={{
                background: '#3498db',
                color: 'white',
                padding: '15px 20px',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  📁 {folderName}
                  <span style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    fontSize: '12px' 
                  }}>
                    {folderDocuments.length} files
                  </span>
                </h3>
                <button
                  onClick={() => {
                    setActiveUploadFolder(folderPath);
                    fileInputRef.current?.click();
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  📤 Upload to this folder
                </button>
              </div>

              {/* Folder Content */}
              <div style={{
                background: 'white',
                border: '1px solid #ddd',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                padding: '20px'
              }}>
                {folderDocuments.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#7f8c8d', 
                    padding: '40px',
                    fontStyle: 'italic'
                  }}>
                    No files in this folder yet. Click "Upload to this folder" to add files.
                  </div>
                ) : (
                  <DocumentsGrid>
                    {folderDocuments.map((document) => (
                      <DocumentCard key={document.id}>
                        <DocumentActions>
                          <ActionButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(document);
                            }}
                          >
                            ⬇️
                          </ActionButton>
                          {canDelete(document) && (
                            <ActionButton
                              className="delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(document);
                              }}
                            >
                              🗑️
                            </ActionButton>
                          )}
                        </DocumentActions>

                        <DocumentIcon>
                          {getFileIcon(document.mime_type, document.original_name)}
                        </DocumentIcon>

                        <DocumentName>{document.original_name}</DocumentName>

                        <DocumentMeta>
                          <DocumentSize>{formatFileSize(document.file_size)}</DocumentSize>
                          <DocumentUploader>by {document.uploaded_by_name}</DocumentUploader>
                          <DocumentDate>{formatDate(document.created_at)}</DocumentDate>
                        </DocumentMeta>
                      </DocumentCard>
                    ))}
                  </DocumentsGrid>
                )}
              </div>
            </div>
          );
        })}

        {folders.length === 0 && (
          <EmptyMessage>
            No folders yet. Create your first folder to organize your documents!
          </EmptyMessage>
        )}
      </ContentContainer>

      {showCreateFolderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3>Create New Folder</h3>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '20px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  setShowCreateFolderModal(false);
                  setNewFolderName('');
                }}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#ecf0f1',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (newFolderName.trim()) {
                    try {
                      await documentService.createFolder(workspaceId, newFolderName);
                      
                      // Fetch the updated folder list from the server
                      const folderTree = await documentService.getFolders(workspaceId);
                      const extractedFolders = extractFoldersFromTree(folderTree);
                      setFolders(extractedFolders);
                      
                      setShowCreateFolderModal(false);
                      setNewFolderName('');
                      
                      // Refresh documents to include the new folder
                      fetchAllDocuments(extractedFolders);
                    } catch (error) {
                      console.error('Failed to create folder:', error);
                      alert('Failed to create folder: ' + (error.response?.data?.error || error.message));
                    }
                  }
                }}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}

export default DocumentsView;