/**
 * Admin Contact Settings Component
 * Allows admin to manage their WhatsApp contact and support information
 */

import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import { Save, AlertCircle, CheckCircle, Loader, Plus, Edit2, Trash2 } from 'lucide-react';

interface AdminContact {
  id: number;
  admin_name: string;
  whatsapp_number: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

interface FormData {
  admin_name: string;
  whatsapp_number: string;
  email: string;
  phone: string;
  is_active: boolean;
}

export const AdminContactSettings: React.FC = () => {
  const [contacts, setContacts] = useState<AdminContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    admin_name: '',
    whatsapp_number: '',
    email: '',
    phone: '',
    is_active: true,
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/api/admin-contacts/', 'GET');
      if (response.results) {
        setContacts(response.results);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate WhatsApp number format
      if (!formData.whatsapp_number.match(/^\+\d{10,15}$/)) {
        setError('Invalid WhatsApp number format. Use +country_code_number (e.g., +919876543210)');
        setSaving(false);
        return;
      }

      let response;
      if (editingId) {
        // Update existing contact
        response = await apiCall(
          `/api/admin-contacts/${editingId}/`,
          'PUT',
          formData
        );
      } else {
        // Create new contact
        response = await apiCall('/api/admin-contacts/', 'POST', formData);
      }

      if (response) {
        setSuccess(
          editingId
            ? 'Contact updated successfully!'
            : 'Contact created successfully!'
        );
        resetForm();
        loadContacts();

        // Auto-hide success message
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (contact: AdminContact) => {
    setFormData({
      admin_name: contact.admin_name,
      whatsapp_number: contact.whatsapp_number,
      email: contact.email,
      phone: contact.phone,
      is_active: contact.is_active,
    });
    setEditingId(contact.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    setSaving(true);
    try {
      await apiCall(`/api/admin-contacts/${id}/`, 'DELETE');
      setSuccess('Contact deleted successfully!');
      loadContacts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete contact');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      admin_name: '',
      whatsapp_number: '',
      email: '',
      phone: '',
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading contact settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Contact Settings</h2>
          <p className="text-gray-600 mt-1">
            Manage your WhatsApp and contact information for customer support
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Add Contact</span>
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Contact' : 'Add New Contact'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Name *
              </label>
              <input
                type="text"
                name="admin_name"
                value={formData.admin_name}
                onChange={handleInputChange}
                placeholder="e.g., Mubarak Ali"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number * (with country code)
              </label>
              <input
                type="tel"
                name="whatsapp_number"
                value={formData.whatsapp_number}
                onChange={handleInputChange}
                placeholder="e.g., +919876543210"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: +[country code][number]
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="support@menshub.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g., +919876543210"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Active (Use this contact for customer support)
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
            >
              {saving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{editingId ? 'Update' : 'Create'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Contacts List */}
      {contacts.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Contacts ({contacts.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className={`border rounded-lg p-4 ${
                  contact.is_active
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {contact.admin_name}
                    </h4>
                    {contact.is_active && (
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(contact)}
                      className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium text-gray-700">WhatsApp:</span>{' '}
                    <a
                      href={`https://wa.me/${contact.whatsapp_number.replace(
                        '+',
                        ''
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 font-mono"
                    >
                      {contact.whatsapp_number}
                    </a>
                  </p>
                  {contact.email && (
                    <p>
                      <span className="font-medium text-gray-700">Email:</span>{' '}
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-blue-600 hover:text-blue-700 font-mono"
                      >
                        {contact.email}
                      </a>
                    </p>
                  )}
                  {contact.phone && (
                    <p>
                      <span className="font-medium text-gray-700">Phone:</span>{' '}
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-blue-600 hover:text-blue-700 font-mono"
                      >
                        {contact.phone}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !showForm ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No contacts configured yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Create First Contact</span>
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default AdminContactSettings;
