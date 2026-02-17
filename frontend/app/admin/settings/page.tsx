"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

export default function CompanyDetailsPage() {
  const [company, setCompany] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanyDetails();
  }, []);

  const loadCompanyDetails = async () => {
    try {
      const data = await apiClient.getCompanyDetails();
      setCompany(data);
      setFormData(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load company details:", error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await apiClient.updateCompanyDetails(formData);
      setCompany(response.data);
      setFormData(response.data);
      setEditing(false);
      alert("Company details updated successfully!");
    } catch (error) {
      console.error("Failed to update company details:", error);
      alert("Failed to update company details. Please try again.");
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <a href="/admin" className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block">
              ← Back to program
            </a>
            <h1 className="text-2xl font-bold text-gray-900">Company Details</h1>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-6 py-2 text-white rounded-lg font-medium text-sm"
              style={{ backgroundColor: '#007bff' }}
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData(company);
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 text-white rounded-lg font-medium text-sm"
                style={{ backgroundColor: '#007bff' }}
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-5xl">
          {/* Company Logo Section */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-500 mb-4">Company Logo</h2>
            <div className="space-y-1">
              {editing ? (
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="font-semibold text-gray-900 text-lg bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                  placeholder="Company Name"
                />
              ) : (
                <p className="font-semibold text-gray-900 text-lg">{formData.name || "company"}</p>
              )}
              <a href="#" className="text-sm text-blue-600 hover:underline">
                {formData.company_url || "spatial guide"}
              </a>
              <p className="text-sm text-gray-600">Org ID: {formData.org_id || "Auto-generated on save"}</p>
            </div>
          </div>

          {/* Form Fields - Two Column Layout */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            {/* Left Column */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <input
                type="text"
                value={formData.currency || ""}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="INR"
              />
            </div>

            {/* Right Column */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company URL
              </label>
              <input
                type="text"
                value={formData.company_url || ""}
                onChange={(e) => setFormData({ ...formData, company_url: e.target.value })}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="https://yourcompany.com"
              />
            </div>

            {/* Right Column */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street
              </label>
              <input
                type="text"
                value={formData.street || ""}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="-"
              />
            </div>

            {/* Left Column */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.city || ""}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="-"
              />
            </div>

            {/* Right Column */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                value={formData.state || ""}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="-"
              />
            </div>

            {/* Left Column */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                value={formData.country || ""}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="-"
              />
            </div>

            {/* Right Column */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.postal_code || ""}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="-"
              />
            </div>

            {/* Left Column - Points Expiration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points Expiration
              </label>
              <select
                value={formData.points_expiration || "never"}
                onChange={(e) => setFormData({ ...formData, points_expiration: e.target.value })}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
              >
                <option value="never">Never</option>
                <option value="6_months">6 Months</option>
                <option value="1_year">1 Year</option>
                <option value="2_years">2 Years</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Points expiration applies to all future points earned
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

