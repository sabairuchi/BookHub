import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { categoryAPI } from '../../services/api';
import SEO from '../../components/SEO';
import './CategoryManagement.css';

const CategoryManagement = () => {
  const { categories, refreshCategories, loading } = useShop();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    count: ''
  });

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category? This will affect all books under it.')) {
      try {
        await categoryAPI.deleteCategory(id);
        await refreshCategories();
      } catch (err) {
        console.error("Error deleting category:", err);
        alert('Failed to delete category.');
      }
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      image: category.image || '',
      count: category.count ? category.count.toString() : '0'
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      image: '',
      count: '0'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const catData = {
        name: formData.name,
        image: formData.image,
        count: Number(formData.count || 0)
      };

      if (editingCategory) {
        await categoryAPI.updateCategory(editingCategory.id, catData);
      } else {
        await categoryAPI.createCategory(catData);
      }
      
      await refreshCategories();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving category:", err);
      alert('Failed to save category. Make sure data is valid.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner" style={{ textAlign: 'center', padding: '100px 0' }}>Loading categories...</div>;
  }

  return (
    <div className="category-management-page">
      <SEO title="Manage Categories | Admin" />
      
      <div className="admin-page-header">
        <h1>Category Management</h1>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleAdd}>
          <Plus size={18} /> Add Category
        </button>
      </div>

      <div className="admin-card">
        <div className="table-controls">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search categories..." 
              value={searchTerm}
              onChange={handleSearch}
              className="admin-search-input"
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table category-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Category Name</th>
                <th>Total Books</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category.id}>
                  <td>
                    {category.image ? (
                      <img src={category.image} alt={category.name} className="table-img-landscape" />
                    ) : (
                      <div className="placeholder-img">
                        <ImageIcon size={24} />
                      </div>
                    )}
                  </td>
                  <td>
                    <strong>{category.name}</strong>
                  </td>
                  <td>
                    <span className="count-badge">{category.count || 0} Books</span>
                  </td>
                  <td>
                    <span className="badge badge-published">Active</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn edit" onClick={() => handleEdit(category)} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(category.id)} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCategories.length === 0 && (
          <div className="no-results">
            <p>No categories found matching your search.</p>
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="admin-form-group">
                <label>Category Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="admin-form-group">
                <label>Image URL</label>
                <input required type="text" value={formData.image} placeholder="https://example.com/image.jpg" onChange={e => setFormData({...formData, image: e.target.value})} />
              </div>
              {editingCategory && (
                <div className="admin-form-group">
                  <label>Total Books Count</label>
                  <input required type="number" value={formData.count} onChange={e => setFormData({...formData, count: e.target.value})} />
                </div>
              )}
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : (editingCategory ? 'Save Changes' : 'Add Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
