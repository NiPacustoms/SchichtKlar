'use client';

import { logger } from '@/lib/logging';

import React, { useState, useCallback } from 'react';
import type { Customer } from '@/lib/types';
import { Dialog } from '@/components/ui/Dialog';
import { PageContainer } from '@/components/layout/PageContainer';
import { Box, Typography, Button } from '@mui/material';
import { Add } from '@mui/icons-material';

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

  const _handleAddressFormat = useCallback((address: AddressData | string): string => {
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
          'Fehler beim Hinzufügen des Kunden:',
          error instanceof Error ? error.message : String(error)
        );
      }
    },
    [formData]
  );

  return (
    <PageContainer maxWidth="standard">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Kunden
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setIsDialogOpen(true)}
        >
          Kunde hinzufügen
        </Button>
      </Box>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} title="Neuen Kunden anlegen">
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
            placeholder="Straße"
            value={formData.street}
            onChange={e => setFormData(prev => ({ ...prev, street: e.target.value }))}
            className="w-full rounded border px-3 py-2"
          />
          <input
            type="text"
            placeholder="PLZ"
            value={formData.postalCode}
            onChange={e => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
            className="w-full rounded border px-3 py-2"
          />
          <input
            type="text"
            placeholder="Ort"
            value={formData.city}
            onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
            className="w-full rounded border px-3 py-2"
          />
          <input
            type="text"
            placeholder="Land"
            value={formData.country}
            onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
            className="w-full rounded border px-3 py-2"
          />
          <select
            value={formData.type}
            onChange={e => handleTypeChange(e.target.value as 'individual' | 'business')}
            className="w-full rounded border px-3 py-2"
            aria-label="Kundentyp"
            title="Kundentyp"
          >
            <option value="individual">Privat</option>
            <option value="business">Geschäftlich</option>
          </select>
          <select
            value={formData.status}
            onChange={e => handleStatusChange(e.target.value as 'active' | 'inactive')}
            className="w-full rounded border px-3 py-2"
            aria-label="Kundenstatus"
            title="Kundenstatus"
          >
            <option value="active">Aktiv</option>
            <option value="inactive">Inaktiv</option>
          </select>
          <input
            type="email"
            placeholder="E-Mail"
            value={formData.contactEmail}
            onChange={e => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
            className="w-full rounded border px-3 py-2"
          />
          <button
            type="submit"
            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Kunde hinzufügen
          </button>
        </form>
      </Dialog>
    </PageContainer>
  );
}
