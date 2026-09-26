import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { useInventory } from '../../store/InventoryContext';

export default function LocationFormModal({
  isOpen,
  onClose,
  warehouse,
}) {
  const { addLocation } = useInventory();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'Standard Storage',
  });
  const [errors, setErrors] = useState({});

  if (!warehouse) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.code.trim()) errs.code = 'Location code is required';
    if (!formData.name.trim()) errs.name = 'Location name is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      addLocation(warehouse.id, formData);
      onClose();
      setFormData({ code: '', name: '', type: 'Standard Storage' });
    } catch (err) {
      setErrors({ form: err.message });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Location to ${warehouse.name}`}
      subtitle={`Configure a new rack or bin for ${warehouse.code}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Add Location
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
              label="Location Code"
              required
              placeholder="e.g. RACK-C01"
              value={formData.code}
              onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              error={errors.code}
            />
          </div>

          <div>
            <Input
              label="Location / Rack Name"
              required
              placeholder="e.g. Rack C-01"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              error={errors.name}
            />
          </div>

          <div className="sm:col-span-2">
            <Select
              label="Storage Category / Type"
              options={[
                'Standard Storage',
                'High Density Rack',
                'Fast Pick Rack',
                'Bulk Pallet Racks',
                'Work in Progress',
                'Temperature Controlled',
                'Hazardous Material Vault',
                'Staging & Intake',
                'Outbound Staging',
              ]}
              value={formData.type}
              onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
