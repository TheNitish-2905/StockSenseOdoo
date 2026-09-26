import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [role, setRole] = useState(user?.role || '');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile({
      name,
      email,
      department,
      role,
      avatarInitials: name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'US',
    });
    setSaved(true);
    showToast('Profile information saved successfully.', 'success');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 text-left max-w-3xl">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          User Account Profile
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal details, warehouse station assignment, and credentials
        </p>
      </div>

      <Card
        title="Staff Profile Information"
        subtitle="Operational role and contact details"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <div className="w-14 h-14 rounded-full bg-slate-900 text-white font-bold text-lg flex items-center justify-center border-2 border-slate-200">
              {user?.avatarInitials || 'AD'}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{user?.name}</h3>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <span className="inline-block mt-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {user?.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Department / Unit"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Assigned Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              icon="logout"
              onClick={logout}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
            >
              Sign Out
            </Button>

            <Button type="submit" variant="primary">
              {saved ? 'Saved!' : 'Update Profile'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
