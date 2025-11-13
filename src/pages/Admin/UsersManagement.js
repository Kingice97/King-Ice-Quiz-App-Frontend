import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './UsersManagement.css';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setMessage('');
        console.log('Fetching users...');
        
        const token = localStorage.getItem('token');
        if (!token) {
          setMessage('No authentication token found');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Users data received:', data);
          
          // Handle different response structures
          const usersArray = data.data || data.users || data || [];
          
          // FILTER OUT ADMIN USERS - Only show regular users
          const regularUsers = usersArray.filter(user => user.role === 'user');
          console.log('Regular users only:', regularUsers);
          
          // Fetch quiz counts for each user
          const usersWithQuizCounts = await Promise.all(
            regularUsers.map(async (user) => {
              try {
                const statsResponse = await fetch(`/api/results/user/${user._id}/count`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                let quizzesTaken = 0;
                if (statsResponse.ok) {
                  const statsData = await statsResponse.json();
                  quizzesTaken = statsData.count || 0;
                } else {
                  // Fallback: count from user stats
                  quizzesTaken = user.stats?.quizzesTaken || user.quizResults?.length || 0;
                }
                
                return {
                  ...user,
                  quizzesTaken: quizzesTaken
                };
              } catch (error) {
                console.error(`Error fetching quiz count for user ${user._id}:`, error);
                return {
                  ...user,
                  quizzesTaken: user.stats?.quizzesTaken || user.quizResults?.length || 0
                };
              }
            })
          );
          
          setUsers(usersWithQuizCounts);
          
          if (usersWithQuizCounts.length === 0) {
            setMessage('No users found in the system');
          }
        } else {
          const errorText = await response.text();
          console.error('API error:', response.status, errorText);
          setMessage(`Failed to load users: ${response.status} ${response.statusText}`);
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setMessage(`Error: ${error.message}`);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  const toggleUserStatus = async (userId) => {
    try {
      setMessage('');
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          isActive: !users.find(user => user._id === userId)?.isActive 
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(user => 
          user._id === userId ? { 
            ...user, 
            isActive: updatedUser.data?.isActive || !user.isActive 
          } : user
        ));
        setMessage('User status updated successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      setMessage('Error updating user status');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setMessage('');
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setUsers(users.filter(user => user._id !== userId));
        setMessage('User deleted successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage('Error deleting user');
    }
  };

  const viewUserDetails = (user) => {
    const userDetails = `
User Details:

Username: ${user.username}
Email: ${user.email}
Role: ${user.role}
Status: ${user.isActive ? 'Active' : 'Inactive'}
Joined: ${new Date(user.createdAt).toLocaleDateString()}
Quizzes Taken: ${user.quizzesTaken || 0}
Last Active: ${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}

Profile:
${user.profile?.firstName ? `First Name: ${user.profile.firstName}` : ''}
${user.profile?.lastName ? `Last Name: ${user.profile.lastName}` : ''}
${user.profile?.bio ? `Bio: ${user.profile.bio}` : ''}
    `.trim();
    
    alert(userDetails);
  };

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="users-management">
        <div className="management-header">
          <h1>User Management</h1>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-management">
      <div className="management-header">
        <h1>User Management</h1>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`message ${message.includes('success') || message.includes('found') ? 'message-success' : 'message-error'}`}>
          {message}
        </div>
      )}

      {users.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No Users Found</h3>
          <p>There are no users registered in the system yet.</p>
          <p>Users will appear here once they register accounts.</p>
        </div>
      ) : (
        <>
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th>Quizzes Taken</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.profile?.firstName && user.profile?.lastName 
                            ? `${user.profile.firstName[0]}${user.profile.lastName[0]}`.toUpperCase()
                            : user.username?.charAt(0).toUpperCase()
                          }
                        </div>
                        <div className="user-details">
                          <span className="user-name">
                            {user.profile?.firstName && user.profile?.lastName 
                              ? `${user.profile.firstName} ${user.profile.lastName}`
                              : user.username
                            }
                          </span>
                          <span className="user-username">@{user.username}</span>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>{user.quizzesTaken || 0}</td>
                    <td>
                      <div className="user-actions">
                        <button 
                          className="btn-info"
                          onClick={() => viewUserDetails(user)}
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button 
                          className={user.isActive ? 'btn-warning' : 'btn-success'}
                          onClick={() => toggleUserStatus(user._id)}
                          title={user.isActive ? 'Deactivate User' : 'Activate User'}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          className="btn-danger"
                          onClick={() => deleteUser(user._id)}
                          title="Delete User"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="users-stats">
            <div className="stat-card">
              <h3>Total Users</h3>
              <p className="stat-number">{users.length}</p>
            </div>
            <div className="stat-card">
              <h3>Active Users</h3>
              <p className="stat-number">{users.filter(u => u.isActive).length}</p>
            </div>
            <div className="stat-card">
              <h3>Inactive Users</h3>
              <p className="stat-number">{users.filter(u => !u.isActive).length}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UsersManagement;