import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useInventory } from '../../store/InventoryContext';

export default function WarehouseFormModal({ isOpen, onClose }) {
  const { addWarehouse } = useInventory();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    contactPerson: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.code.trim()) errs.code = 'Warehouse code is required';
    if (!formData.name.trim()) errs.name = 'Warehouse name is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      addWarehouse(formData);
      onClose();
      setFormData({ code: '', name: '', address: '', contactPerson: '', phone: '' });
    } catch (err) {
      setErrors({ form: err.message });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Warehouse"
      subtitle="Register an operational facility or distribution center"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Create Warehouse
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {errors.form && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md">
            {errors.form}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Warehouse Code"
              required
              placeholder="e.g. WH-04"
              value={formData.code}
              onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              error={errors.code}
            />
          </div>

          <div>
            <Input
              label="Warehouse Name"
              required
              placeholder="e.g. South Logistics Depot"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              error={errors.name}
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Physical Address"
              placeholder="e.g. 102 Port Road, Building C"
              value={formData.address}
              onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
            />
          </div>

          <div>
            <Input
              label="Manager / Contact"
              placeholder="e.g. Sarah Jenkins"
              value={formData.contactPerson}
              onChange={(e) => setFormData((p) => ({ ...p, contactPerson: e.target.value }))}
            />
          </div>

          <div>
            <Input
              label="Contact Phone"
              placeholder="e.g. +1 (555) 901-2345"
              value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
