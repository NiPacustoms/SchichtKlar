'use client';

import { logger } from '@/lib/logging';

import React, { useState, useCallback } from 'react';
import type { Customer } from '@/lib/types';
import { Dialog } from '@/components/ui/Dialog';

interface AddressData {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export default function CustomersPage() {
  const [_customers, setCustomers] = useState<Customer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    street: string;
    postalCode: string;
    city: string;
    country: string;
    type: 'individual' | 'business';
    status: 'active' | 'inactive';
    contactEmail: string;
  }>({
    name: '',
    street: '',
    postalCode: '',
    city: '',
    country: '',
    type: 'individual',
    status: 'active',
    contactEmail: '',
  });

  const handleAddressFormat = useCallback((address: AddressData | string): string => {
    if (typeof address === 'string') return address;
    return `${address.street}, ${address.postalCode} ${address.city}`;
  }, []);

  const handleTypeChange = useCallback((newType: 'individual' | 'business') => {
    setFormData(prev => ({ ...prev, type: newType }));
  }, []);

  const handleStatusChange = useCallback((newStatus: 'active' | 'inactive') => {
    setFormData(prev => ({ ...prev, status: newStatus }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      try {
        const addressData: AddressData = {
          street: formData.street,
          postalCode: formData.postalCode,
          city: formData.city,
          country: formData.country,
        };

        const newCustomer: Customer = {
          id: Date.now().toString(),
          name: formData.name,
          address: addressData,
          type: formData.type,
          status: formData.status,
          contactEmail: formData.contactEmail,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setCustomers(prev => [...prev, newCustomer]);
        setIsDialogOpen(false);
      } catch (error) {
        logger.error(
          'Error adding customer:',
          error instanceof Error ? error.message : String(error)
        );
      }
    },
    [formData]
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customers</h1>
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add Customer
        </button>
      </div>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} title="Add New Customer">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full rounded border px-3 py-2"
          />
          <input
            type="text"
            placeholder="Street"
            value={formData.street}
            onChange={e => setFormData(prev => ({ ...prev, street: e.target.value }))}
            className="w-full rounded border px-3 py-2"
          />
          <input
            type="text"
            placeholder="Postal Code"
            value={formData.postalCode}
            onChange={e => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
            className="w-full rounded border px-3 py-2"
          />
          <input
            type="text"
            placeholder="City"
            value={formData.city}
            onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
            className="w-full rounded border px-3 py-2"
          />
          <input
            type="text"
            placeholder="Country"
            value={formData.country}
            onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
            className="w-full rounded border px-3 py-2"
          />
          <select
            value={formData.type}
            onChange={e => handleTypeChange(e.target.value as 'individual' | 'business')}
            className="w-full rounded border px-3 py-2"
            aria-label="Customer Type"
            title="Customer Type"
          >
            <option value="individual">Individual</option>
            <option value="business">Business</option>
          </select>
          <select
            value={formData.status}
            onChange={e => handleStatusChange(e.target.value as 'active' | 'inactive')}
            className="w-full rounded border px-3 py-2"
            aria-label="Customer Status"
            title="Customer Status"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <input
            type="email"
            placeholder="Email"
            value={formData.contactEmail}
            onChange={e => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
            className="w-full rounded border px-3 py-2"
          />
          <button
            type="submit"
            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Add Customer
          </button>
        </form>
      </Dialog>
    </div>
  );
}
