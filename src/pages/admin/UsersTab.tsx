import type { AdminProfile } from './types'

interface StaffFormState {
  name: string
  email: string
  password: string
  userType: 'driver' | 'club'
}

interface UsersTabProps {
  profiles: AdminProfile[]
  scannerUsersCount: number
  staffForm: StaffFormState
  creatingStaff: boolean
  setStaffForm: React.Dispatch<React.SetStateAction<StaffFormState>>
  createStaffAccount: () => Promise<void>
  setEditingUser: (profile: AdminProfile) => void
  deleteUser: (id: string) => Promise<void>
}

export default function UsersTab({
  profiles,
  scannerUsersCount,
  staffForm,
  creatingStaff,
  setStaffForm,
  createStaffAccount,
  setEditingUser,
  deleteUser,
}: UsersTabProps) {
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <h3 className="font-bold text-gray-900">Create Driver / Club Account</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          <input value={staffForm.name} onChange={(e) => setStaffForm((s) => ({ ...s, name: e.target.value }))} placeholder="Name" className="px-3 py-2 rounded-lg border border-gray-200" />
          <input value={staffForm.email} onChange={(e) => setStaffForm((s) => ({ ...s, email: e.target.value }))} placeholder="Username/Email" className="px-3 py-2 rounded-lg border border-gray-200" />
          <input type="password" value={staffForm.password} onChange={(e) => setStaffForm((s) => ({ ...s, password: e.target.value }))} placeholder="Password" className="px-3 py-2 rounded-lg border border-gray-200" />
          <select value={staffForm.userType} onChange={(e) => setStaffForm((s) => ({ ...s, userType: e.target.value as 'driver' | 'club' }))} className="px-3 py-2 rounded-lg border border-gray-200">
            <option value="driver">Driver</option>
            <option value="club">Club</option>
          </select>
        </div>
        <button onClick={() => void createStaffAccount()} disabled={creatingStaff} className="bg-jamaica-green hover:bg-jamaica-green-dark text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
          {creatingStaff ? 'Creating...' : 'Create Account'}
        </button>
      </div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-gray-900">{profiles.length} Users</h2>
        <span className="text-xs text-gray-500">{scannerUsersCount} scanner users</span>
      </div>
      {profiles.map((p) => (
        <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-jamaica-green/10 rounded-full flex items-center justify-center text-sm font-bold text-jamaica-green shrink-0">
              {p.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900">{p.name}</p>
                {p.is_admin && (
                  <span className="bg-jamaica-gold/15 text-jamaica-gold-dark px-2 py-0.5 rounded text-xs font-medium">Admin</span>
                )}
                {!p.is_admin && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">{p.user_type}</span>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate">{p.email}</p>
              <p className="text-xs text-gray-400 mt-1">Joined {new Date(p.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setEditingUser(p)} className="p-2 text-gray-400 hover:text-jamaica-green hover:bg-jamaica-green/5 rounded-lg transition-colors" title="Edit">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              {!p.is_admin && (
                <button onClick={() => void deleteUser(p.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

