import { useState } from 'react'
import { FiUsers, FiPlus, FiTrash2, FiShare2, FiKey, FiMail } from 'react-icons/fi'

interface TeamMember {
  id: number
  name: string
  email: string
  role: 'admin' | 'member' | 'viewer'
  joined_date: string
  status: 'active' | 'invited' | 'inactive'
}

interface Team {
  id: number
  name: string
  description: string
  members: TeamMember[]
  created_date: string
}

export default function TeamPage() {
  const [teams, setTeams] = useState<Team[]>([
    {
      id: 1,
      name: 'Procurement Team',
      description: 'Main procurement and sourcing team',
      members: [
        { id: 1, name: 'John Doe', email: 'john@company.com', role: 'admin', joined_date: '2024-01-15', status: 'active' },
        { id: 2, name: 'Jane Smith', email: 'jane@company.com', role: 'member', joined_date: '2024-02-01', status: 'active' },
        { id: 3, name: 'Mike Johnson', email: 'mike@company.com', role: 'member', joined_date: '2024-02-15', status: 'active' }
      ],
      created_date: '2024-01-01'
    },
    {
      id: 2,
      name: 'Suppliers Team',
      description: 'Team for managing supplier relationships',
      members: [
        { id: 4, name: 'Sarah Lee', email: 'sarah@company.com', role: 'admin', joined_date: '2024-03-01', status: 'active' },
        { id: 5, name: 'Tom Brown', email: 'tom@company.com', role: 'member', joined_date: '2024-03-15', status: 'active' }
      ],
      created_date: '2024-03-01'
    }
  ])

  const [selectedTeam, setSelectedTeam] = useState<Team>(teams[0])
  const [showNewTeamForm, setShowNewTeamForm] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [showApiKeyForm, setShowApiKeyForm] = useState(false)
  const [newTeamData, setNewTeamData] = useState({ name: '', description: '' })
  const [inviteData, setInviteData] = useState({ email: '', role: 'member' as const })
  const [apiKeys, setApiKeys] = useState<any[]>([
    { id: 1, name: 'Production API Key', key: 'sk_live_xxx...xxx', created: '2024-06-01', status: 'active' }
  ])

  const handleCreateTeam = () => {
    if (newTeamData.name) {
      const newTeam: Team = {
        id: Math.max(...teams.map(t => t.id)) + 1,
        name: newTeamData.name,
        description: newTeamData.description,
        members: [],
        created_date: new Date().toISOString().split('T')[0]
      }
      setTeams([...teams, newTeam])
      setSelectedTeam(newTeam)
      setNewTeamData({ name: '', description: '' })
      setShowNewTeamForm(false)
    }
  }

  const handleInviteMember = () => {
    if (inviteData.email && selectedTeam) {
      const newMember: TeamMember = {
        id: Math.max(...selectedTeam.members.map(m => m.id)) + 1,
        name: inviteData.email.split('@')[0],
        email: inviteData.email,
        role: inviteData.role,
        joined_date: new Date().toISOString().split('T')[0],
        status: 'invited'
      }
      const updatedTeams = teams.map(t =>
        t.id === selectedTeam.id ? { ...t, members: [...t.members, newMember] } : t
      )
      setTeams(updatedTeams)
      setSelectedTeam(updatedTeams.find(t => t.id === selectedTeam.id)!)
      setInviteData({ email: '', role: 'member' })
      setShowInviteForm(false)
    }
  }

  const handleRemoveMember = (memberId: number) => {
    if (selectedTeam) {
      const updatedTeams = teams.map(t =>
        t.id === selectedTeam.id
          ? { ...t, members: t.members.filter(m => m.id !== memberId) }
          : t
      )
      setTeams(updatedTeams)
      setSelectedTeam(updatedTeams.find(t => t.id === selectedTeam.id)!)
    }
  }

  const handleCreateApiKey = () => {
    const newKey = {
      id: apiKeys.length + 1,
      name: `API Key ${apiKeys.length + 1}`,
      key: 'sk_live_' + Math.random().toString(36).substr(2, 24),
      created: new Date().toISOString().split('T')[0],
      status: 'active'
    }
    setApiKeys([...apiKeys, newKey])
    setShowApiKeyForm(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        <p className="text-gray-600 mt-1">Manage team members and collaboration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Teams</h2>
            <button
              onClick={() => setShowNewTeamForm(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Create new team"
            >
              <FiPlus className="w-5 h-5 text-blue-500" />
            </button>
          </div>

          <div className="space-y-2">
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedTeam.id === team.id
                    ? 'bg-blue-100 border border-blue-300'
                    : 'hover:bg-gray-100 border border-transparent'
                }`}
              >
                <p className="font-semibold text-gray-900">{team.name}</p>
                <p className="text-xs text-gray-600">{team.members.length} members</p>
              </button>
            ))}
          </div>

          {showNewTeamForm && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
              <input
                type="text"
                placeholder="Team name"
                value={newTeamData.name}
                onChange={(e) => setNewTeamData({ ...newTeamData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Description"
                value={newTeamData.description}
                onChange={(e) => setNewTeamData({ ...newTeamData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTeam}
                  className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewTeamForm(false)}
                  className="flex-1 px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedTeam && (
            <>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedTeam.name}</h2>
                    <p className="text-gray-600 mt-1">{selectedTeam.description}</p>
                    <p className="text-xs text-gray-500 mt-2">Created on {selectedTeam.created_date}</p>
                  </div>
                  <button
                    onClick={() => setShowInviteForm(!showInviteForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    <FiPlus className="w-4 h-4" />
                    Invite Member
                  </button>
                </div>

                {showInviteForm && (
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 space-y-3 mb-6">
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={inviteData.email}
                      onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={inviteData.role}
                      onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleInviteMember}
                        className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
                      >
                        Send Invite
                      </button>
                      <button
                        onClick={() => setShowInviteForm(false)}
                        className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {selectedTeam.members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-semibold text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            member.role === 'admin'
                              ? 'bg-red-100 text-red-700'
                              : member.role === 'member'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {member.role.toUpperCase()}
                          </span>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            member.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500">Joined {member.joined_date}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FiKey className="w-5 h-5" />
                    API Keys
                  </h3>
                  <button
                    onClick={() => setShowApiKeyForm(!showApiKeyForm)}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Generate New
                  </button>
                </div>

                {showApiKeyForm && (
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 mb-4 flex gap-3">
                    <button
                      onClick={handleCreateApiKey}
                      className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      Create API Key
                    </button>
                    <button
                      onClick={() => setShowApiKeyForm(false)}
                      className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  {apiKeys.map(key => (
                    <div key={key.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{key.name}</p>
                        <p className="text-sm text-gray-600 font-mono">{key.key}</p>
                        <p className="text-xs text-gray-500 mt-1">Created {key.created}</p>
                      </div>
                      <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
                        ACTIVE
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
