import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GasClient } from '../lib/gasClient';
import { 
  Users, 
  UserPlus, 
  Search, 
  RefreshCw, 
  Download, 
  Eye, 
  EyeOff, 
  Edit2, 
  Trash2, 
  X, 
  ChevronDown, 
  Check, 
  User, 
  Filter, 
  Lock, 
  Unlock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  FileSpreadsheet,
  CheckSquare,
  Square
} from 'lucide-react';

// Define TS Interfaces according to specifications
export interface UserRecord {
  id: string;
  userName: string;
  userType: 'Admin' | 'General';
  designation: string;
  uid: string;
  password?: string;
  department: 'Knitting' | 'Dyeing' | 'Finishing';
  assignedUnits: string[]; // e.g. ['EKL', 'EFL']
  permission: 'Read' | 'Read / Write' | 'Hide';
  status: 'Active' | 'Inactive';
  lastUpdated: string; // "YYYY-MM-DD HH:MM AM/PM"
  allowedTabs?: string[];
}

export const ALL_TABS = [
  'Dashboard',
  'Production Ledger',
  'Floor Dashboard',
  'Management Dashboard',
  'Reports',
  'User Management',
  'Settings'
];

// Designation options as provided in hierarchy
const DESIGNATIONS = [
  'General Manager (GM)',
  'Deputy General Manager (DGM)',
  'Assistant General Manager (AGM)',
  'Senior Manager',
  'Manager',
  'Deputy Manager',
  'Assistant Manager',
  'Senior Executive',
  'Executive',
  'Senior Officer',
  'Officer',
  'Assistant Officer'
];

// Department options
const DEPARTMENTS: Array<'Knitting' | 'Dyeing' | 'Finishing'> = ['Knitting', 'Dyeing', 'Finishing'];

// Available units
const AVAILABLE_UNITS = [
  'EKL',
  'EFL',
  'EFL-2',
  'Auto Stripe',
  'EFL-Extension',
  'ESL-Extension',
  'Sub-Contact'
];

// Default initial premium seed records
const INITIAL_USERS: UserRecord[] = [
  {
    id: 'usr-1',
    userName: 'Md. Raihan Hossain Antu',
    userType: 'Admin',
    designation: 'Senior Manager',
    uid: 'EKL001',
    password: 'Password@2026',
    department: 'Knitting',
    assignedUnits: ['EKL', 'EFL', 'Auto Stripe'],
    permission: 'Read / Write',
    status: 'Active',
    lastUpdated: '2026-07-15 10:30 AM'
  },
  {
    id: 'usr-2',
    userName: 'Zahirul Islam',
    userType: 'Admin',
    designation: 'General Manager (GM)',
    uid: 'EKL002',
    password: 'GmKnitting99',
    department: 'Knitting',
    assignedUnits: ['EKL', 'EFL', 'EFL-2', 'Auto Stripe', 'EFL-Extension', 'ESL-Extension', 'Sub-Contact'],
    permission: 'Read / Write',
    status: 'Active',
    lastUpdated: '2026-07-15 11:45 AM'
  },
  {
    id: 'usr-3',
    userName: 'Akil Zaman',
    userType: 'General',
    designation: 'Assistant Manager',
    uid: 'EKL003',
    password: 'AkilZaman#456',
    department: 'Knitting',
    assignedUnits: ['EKL', 'EFL-2'],
    permission: 'Read',
    status: 'Active',
    lastUpdated: '2026-07-14 02:15 PM'
  },
  {
    id: 'usr-4',
    userName: 'Nasrin Akhter',
    userType: 'General',
    designation: 'Executive',
    uid: 'EKL004',
    password: 'NasrinDyeing@1',
    department: 'Dyeing',
    assignedUnits: ['EFL', 'Auto Stripe'],
    permission: 'Read',
    status: 'Active',
    lastUpdated: '2026-07-13 09:10 AM'
  },
  {
    id: 'usr-5',
    userName: 'Kamal Hossain',
    userType: 'General',
    designation: 'Deputy Manager',
    uid: 'EKL005',
    password: 'KamalFinish88',
    department: 'Finishing',
    assignedUnits: ['EFL-Extension', 'ESL-Extension'],
    permission: 'Read / Write',
    status: 'Inactive',
    lastUpdated: '2026-07-12 04:30 PM'
  },
  {
    id: 'usr-6',
    userName: 'Rashedul Bari',
    userType: 'General',
    designation: 'Senior Officer',
    uid: 'EKL006',
    password: 'BariRashedul!',
    department: 'Knitting',
    assignedUnits: ['Auto Stripe'],
    permission: 'Read',
    status: 'Active',
    lastUpdated: '2026-07-11 11:00 AM'
  },
  {
    id: 'usr-7',
    userName: 'Taslima Begum',
    userType: 'General',
    designation: 'Officer',
    uid: 'EKL007',
    password: 'TaslimaDyeingSecret',
    department: 'Dyeing',
    assignedUnits: ['EFL-2'],
    permission: 'Hide',
    status: 'Inactive',
    lastUpdated: '2026-07-10 03:22 PM'
  }
];

export default function UserManagementView() {
  // ----------------------------------------------------
  // Persistent States
  // ----------------------------------------------------
  const [users, setUsers] = useState<UserRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('knitting_system_users_ledger');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved user ledger:", e);
        }
      }
    }
    return INITIAL_USERS;
  });

  // Load users from central server DB or Google Apps Script on mount
  useEffect(() => {
    const syncUsersWithServer = async () => {
      if (GasClient.getDatabaseMode() === 'gas') {
        try {
          const serverUsers = await GasClient.fetchUsers();
          if (serverUsers && Array.isArray(serverUsers) && serverUsers.length > 0) {
            setUsers(serverUsers);
            localStorage.setItem('knitting_system_users_ledger', JSON.stringify(serverUsers));
            return;
          }
        } catch (e) {
          console.warn("Could not fetch users from Google Sheets, falling back to local DB:", e);
        }
      }
      const db = await GasClient.fetchServerDb();
      if (db && Array.isArray(db.users) && db.users.length > 0) {
        setUsers(db.users);
      }
    };
    syncUsersWithServer();
  }, []);

  // Save to LocalStorage and Central Server DB whenever users state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('knitting_system_users_ledger', JSON.stringify(users));
      GasClient.saveServerDb({ users });
    }
  }, [users]);

  // ----------------------------------------------------
  // Interactive UI Elements & Feedback States
  // ----------------------------------------------------
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // Track password visibility per user ID
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Global search input focus trigger
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ----------------------------------------------------
  // Search & Filter States
  // ----------------------------------------------------
  const [globalSearch, setGlobalSearch] = useState('');
  const [filterUserType, setFilterUserType] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterAssignedUnit, setFilterAssignedUnit] = useState<string>('all');
  const [filterPermission, setFilterPermission] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // ----------------------------------------------------
  // Pagination States
  // ----------------------------------------------------
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState<number>(25);

  // ----------------------------------------------------
  // Dialog / Popup Form States
  // ----------------------------------------------------
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMode, setPopupMode] = useState<'add' | 'edit'>('add');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'Admin' | 'General'>('General');
  const [formDesignation, setFormDesignation] = useState('');
  const [formUid, setFormUid] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [formDepartment, setFormDepartment] = useState<'Knitting' | 'Dyeing' | 'Finishing'>('Knitting');
  const [formAssignedUnits, setFormAssignedUnits] = useState<string[]>([]);
  const [formPermission, setFormPermission] = useState<'Read' | 'Read / Write' | 'Hide'>('Read');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formAllowedTabs, setFormAllowedTabs] = useState<string[]>([]);

  // Popup validation error state
  const [formError, setFormError] = useState<string | null>(null);

  // Custom visual multi-select search input inside popup
  const [unitSearchQuery, setUnitSearchQuery] = useState('');
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const unitDropdownRef = useRef<HTMLDivElement>(null);

  // Form Password eyes
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [showFormConfirmPassword, setShowFormConfirmPassword] = useState(false);

  // Delete Confirmation Dialog state
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // ----------------------------------------------------
  // Dynamic Helpers
  // ----------------------------------------------------
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const getFormattedDateTime = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedHours = String(hours).padStart(2, '0');

    return `${yyyy}-${mm}-${dd} ${formattedHours}:${minutes} ${ampm}`;
  };

  // Close unit dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target as Node)) {
        setIsUnitDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ----------------------------------------------------
  // Actions: Add / Edit / Delete / Export / Refresh
  // ----------------------------------------------------
  const handleFocusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      // Highlight the input temporarily
      searchInputRef.current.classList.add('ring-2', 'ring-blue-500');
      setTimeout(() => {
        searchInputRef.current?.classList.remove('ring-2', 'ring-blue-500');
      }, 1000);
    }
    showToast("Global Search focused. Type to filter records.", "info");
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (GasClient.getDatabaseMode() === 'gas') {
      try {
        const serverUsers = await GasClient.fetchUsers();
        if (serverUsers && Array.isArray(serverUsers)) {
          setUsers(serverUsers);
          localStorage.setItem('knitting_system_users_ledger', JSON.stringify(serverUsers));
        }
      } catch (err: any) {
        showToast(`Sync warning: ${err.message || 'Failed to sync with Google Sheets.'}`, 'error');
      }
    }
    setGlobalSearch('');
    setFilterUserType('all');
    setFilterDepartment('all');
    setFilterAssignedUnit('all');
    setFilterPermission('all');
    setFilterStatus('all');
    setCurrentPage(1);
    setIsRefreshing(false);
    showToast("User Management Ledger refreshed successfully.", "success");
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleToggleStatus = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    const nextStatus = targetUser.status === 'Active' ? 'Inactive' : 'Active';
    const updatedUser: UserRecord = {
      ...targetUser,
      status: nextStatus as 'Active' | 'Inactive',
      lastUpdated: getFormattedDateTime()
    };

    if (GasClient.getDatabaseMode() === 'gas') {
      try {
        await GasClient.updateUser(updatedUser);
        showToast(`Updated ${targetUser.userName} status to ${nextStatus} in Google Sheets`, 'success');
      } catch (err: any) {
        showToast(`Failed to update status in Google Sheets: ${err.message}`, 'error');
        return;
      }
    }

    setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    if (GasClient.getDatabaseMode() !== 'gas') {
      showToast(`User ${targetUser.userName} status set to ${nextStatus}`, 'info');
    }
  };

  const handleOpenAddModal = () => {
    setPopupMode('add');
    setEditingUserId(null);
    setFormError(null);
    
    // Clear all fields
    setFormName('');
    setFormType('General');
    setFormDesignation('');
    setFormUid('');
    setFormPassword('');
    setFormConfirmPassword('');
    setFormDepartment('Knitting');
    setFormAssignedUnits([]);
    setFormPermission('Read');
    setFormStatus('Active');
    setFormAllowedTabs(['Dashboard', 'Production Ledger', 'Floor Dashboard', 'Management Dashboard', 'Reports', 'Settings']);
    
    setShowFormPassword(false);
    setShowFormConfirmPassword(false);
    setIsPopupOpen(true);
  };

  const handleOpenEditModal = (user: UserRecord) => {
    setPopupMode('edit');
    setEditingUserId(user.id);
    setFormError(null);

    // Populate field values
    setFormName(user.userName);
    setFormType(user.userType);
    setFormDesignation(user.designation);
    setFormUid(user.uid);
    setFormPassword(user.password || '');
    setFormConfirmPassword(user.password || '');
    setFormDepartment(user.department);
    setFormAssignedUnits([...user.assignedUnits]);
    setFormPermission(user.permission);
    setFormStatus(user.status);
    setFormAllowedTabs(user.allowedTabs || (user.userType === 'Admin' ? ALL_TABS : ALL_TABS.filter(t => t !== 'User Management')));

    setShowFormPassword(false);
    setShowFormConfirmPassword(false);
    setIsPopupOpen(true);
  };

  const handleClearForm = () => {
    setFormName('');
    setFormType('General');
    setFormDesignation('');
    setFormUid('');
    setFormPassword('');
    setFormConfirmPassword('');
    setFormDepartment('Knitting');
    setFormAssignedUnits([]);
    setFormPermission('Read');
    setFormStatus('Active');
    setFormAllowedTabs(['Dashboard', 'Production Ledger', 'Floor Dashboard', 'Management Dashboard', 'Reports', 'Settings']);
    setFormError(null);
    showToast("Form fields cleared", "info");
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validations
    if (!formName.trim()) return setFormError("User Name is required");
    if (!formType) return setFormError("User Type is required");
    if (!formDesignation) return setFormError("Designation is required");
    if (!formUid.trim()) return setFormError("UID is required");
    if (!formPassword) return setFormError("Password is required");
    if (formPassword !== formConfirmPassword) return setFormError("Passwords do not match");
    if (!formDepartment) return setFormError("Department is required");
    if (formAssignedUnits.length === 0) return setFormError("Please assign at least one unit");
    if (!formPermission) return setFormError("Read / Write Permission is required");
    if (formAllowedTabs.length === 0) return setFormError("Please select at least one allowed tab/view for the user");

    // Check unique UID (excluding current user when editing)
    const isUidTaken = users.some(u => u.uid.toUpperCase() === formUid.trim().toUpperCase() && u.id !== editingUserId);
    if (isUidTaken) {
      return setFormError(`UID '${formUid.trim().toUpperCase()}' is already assigned to another user.`);
    }

    const timestamp = getFormattedDateTime();

    if (popupMode === 'add') {
      const newUser: UserRecord = {
        id: `usr-${Date.now()}`,
        userName: formName.trim(),
        userType: formType,
        designation: formDesignation,
        uid: formUid.trim().toUpperCase(),
        password: formPassword,
        department: formDepartment,
        assignedUnits: [...formAssignedUnits],
        permission: formPermission,
        status: formStatus,
        lastUpdated: timestamp,
        allowedTabs: [...formAllowedTabs]
      };

      if (GasClient.getDatabaseMode() === 'gas') {
        try {
          await GasClient.addUser(newUser);
          showToast(`Successfully registered user in Google Sheets: ${newUser.userName}`, 'success');
        } catch (err: any) {
          setFormError(`Google Sheets Error: ${err.message || 'Failed to save user.'}`);
          showToast(`Google Sheets Sync Error: ${err.message || 'Failed to save user.'}`, 'error');
          return;
        }
      }

      setUsers(prev => [newUser, ...prev]);
      if (GasClient.getDatabaseMode() !== 'gas') {
        showToast(`Successfully registered new user: ${newUser.userName}`, 'success');
      }
    } else {
      // Edit mode
      const updatedUser: UserRecord = {
        id: editingUserId || `usr-${Date.now()}`,
        userName: formName.trim(),
        userType: formType,
        designation: formDesignation,
        uid: formUid.trim().toUpperCase(),
        password: formPassword,
        department: formDepartment,
        assignedUnits: [...formAssignedUnits],
        permission: formPermission,
        status: formStatus,
        lastUpdated: timestamp,
        allowedTabs: [...formAllowedTabs]
      };

      if (GasClient.getDatabaseMode() === 'gas') {
        try {
          await GasClient.updateUser(updatedUser);
          showToast(`Successfully updated user in Google Sheets: ${formName.trim()}`, 'success');
        } catch (err: any) {
          console.warn("Google Sheets update user error:", err);
          setUsers(prev => prev.map(u => u.id === editingUserId ? updatedUser : u));
          showToast(`Google Sheets Sync Warning: ${err.message || 'Failed to sync with Google Sheets.'}. Updated locally.`, 'error');
          setIsPopupOpen(false);
          return;
        }
      }

      setUsers(prev => prev.map(u => u.id === editingUserId ? updatedUser : u));
      if (GasClient.getDatabaseMode() !== 'gas') {
        showToast(`Successfully updated credentials for: ${formName.trim()}`, 'success');
      }
    }

    setIsPopupOpen(false);
  };

  const handleConfirmDelete = (userId: string) => {
    setDeletingUserId(userId);
  };

  const executeDelete = async () => {
    if (!deletingUserId) return;
    const targetUser = users.find(u => u.id === deletingUserId);
    if (targetUser) {
      if (GasClient.getDatabaseMode() === 'gas') {
        try {
          await GasClient.deleteUser(targetUser.uid);
          showToast(`Deleted user from Google Sheets: ${targetUser.userName}`, 'success');
        } catch (err: any) {
          showToast(`Failed to delete user in Google Sheets: ${err.message}`, 'error');
          setDeletingUserId(null);
          return;
        }
      }

      setUsers(prev => prev.filter(u => u.id !== deletingUserId));
      if (GasClient.getDatabaseMode() !== 'gas') {
        showToast(`Permanently deleted user: ${targetUser.userName}`, 'success');
      }
    }
    setDeletingUserId(null);
  };

  // Toggle unit selection in multi-select list
  const toggleUnitSelection = (unit: string) => {
    setFormAssignedUnits(prev => {
      if (prev.includes(unit)) {
        return prev.filter(u => u !== unit);
      } else {
        return [...prev, unit];
      }
    });
  };

  // ----------------------------------------------------
  // Filtering & Search Logic
  // ----------------------------------------------------
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Global Search matching
      const query = globalSearch.toLowerCase().trim();
      const matchesSearch = !query ? true : (
        user.userName.toLowerCase().includes(query) ||
        user.uid.toLowerCase().includes(query) ||
        user.designation.toLowerCase().includes(query) ||
        user.department.toLowerCase().includes(query) ||
        user.userType.toLowerCase().includes(query) ||
        user.permission.toLowerCase().includes(query) ||
        user.assignedUnits.some(unit => unit.toLowerCase().includes(query))
      );

      // Category filters
      const matchesUserType = filterUserType === 'all' || user.userType === filterUserType;
      const matchesDepartment = filterDepartment === 'all' || user.department === filterDepartment;
      const matchesPermission = filterPermission === 'all' || user.permission === filterPermission;
      const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
      
      const matchesAssignedUnit = filterAssignedUnit === 'all' || user.assignedUnits.includes(filterAssignedUnit);

      return matchesSearch && matchesUserType && matchesDepartment && matchesAssignedUnit && matchesPermission && matchesStatus;
    });
  }, [users, globalSearch, filterUserType, filterDepartment, filterAssignedUnit, filterPermission, filterStatus]);

  // Adjust pagination current page if filtered list shrinks
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredUsers.length, usersPerPage, totalPages, currentPage]);

  // Paginated Slice
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    return filteredUsers.slice(startIndex, startIndex + usersPerPage);
  }, [filteredUsers, currentPage, usersPerPage]);

  // ----------------------------------------------------
  // Export Users to spreadsheet (.xlsx formatted CSV)
  // ----------------------------------------------------
  const handleExportUsers = () => {
    if (filteredUsers.length === 0) {
      showToast("No filtered user records available to export.", "error");
      return;
    }

    // Build standard CSV representation
    const headers = [
      'User Name',
      'User Type',
      'Designation',
      'UID',
      'Password',
      'Department',
      'Assigned Units',
      'Permission',
      'Status',
      'Last Updated'
    ];

    const rows = filteredUsers.map(user => [
      `"${user.userName.replace(/"/g, '""')}"`,
      `"${user.userType}"`,
      `"${user.designation}"`,
      `"${user.uid}"`,
      `"${user.password || '********'}"`,
      `"${user.department}"`,
      `"${user.assignedUnits.join(' | ')}"`,
      `"${user.permission}"`,
      `"${user.status}"`,
      `"${user.lastUpdated}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Epyllion_Knitex_Users_Roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filteredUsers.length} filtered user records to spreadsheet CSV.`, "success");
  };

  // Form unit list filtering
  const filteredAvailableUnitsInForm = AVAILABLE_UNITS.filter(unit => 
    unit.toLowerCase().includes(unitSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" id="user-management-module-root">
      
      {/* Toast Notification HUD */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-black text-white shadow-xl animate-bounce border ${
          toastMessage.type === 'success' ? 'bg-[#16A34A] border-emerald-500' : 
          toastMessage.type === 'error' ? 'bg-[#DC2626] border-red-500' : 
          'bg-[#0F4C81] border-sky-600'
        }`}>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Title & Subtitle Card */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#0F4C81]/10 rounded-lg text-[#0F4C81] dark:text-sky-400">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="font-sans text-xl font-black tracking-tight text-gray-900 dark:text-white">
              User Management
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 pl-1">
            Create, Edit and Manage System Users — Admin Panel for Manufacturing Authorization
          </p>
        </div>

        {/* Top Toolbar Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Add User */}
          <button
            type="button"
            id="btn-add-user"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F4C81] hover:bg-[#0c3d68] text-white px-3.5 py-2 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>➕ Add User</span>
          </button>

          {/* Focus Search */}
          <button
            type="button"
            id="btn-focus-search"
            onClick={handleFocusSearch}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 px-3 py-2 text-xs font-bold transition-all cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
            <span>🔍 Search User</span>
          </button>

          {/* Refresh Action */}
          <button
            type="button"
            id="btn-refresh-users"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`inline-flex items-center gap-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
              isRefreshing ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>🔄 Refresh</span>
          </button>

          {/* Export Action */}
          <button
            type="button"
            id="btn-export-users"
            onClick={handleExportUsers}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white px-3 py-2 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>📥 Export Users (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Advanced Search & Filtering Dashboard Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
          <Filter className="h-4 w-4 text-[#0F4C81]" />
          <h3 className="font-sans text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
            Search Filter Control Desk
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3.5">
          {/* Global Search Bar */}
          <div className="col-span-1 md:col-span-2 relative">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Global Search Box
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search className="h-3.5 w-3.5 text-gray-400" />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by Name, UID, Unit, Designation..."
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 py-1.5 pl-9 pr-3 text-xs font-semibold text-gray-700 dark:text-slate-100 transition-all focus:border-[#0F4C81] focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden"
              />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* User Type Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              User Type
            </label>
            <select
              value={filterUserType}
              onChange={(e) => {
                setFilterUserType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-200 transition-all focus:border-[#0F4C81] focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden cursor-pointer"
            >
              <option value="all">📁 All User Types</option>
              <option value="Admin">🔑 Admin Only</option>
              <option value="General">👤 General Only</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Department
            </label>
            <select
              value={filterDepartment}
              onChange={(e) => {
                setFilterDepartment(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-200 transition-all focus:border-[#0F4C81] focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden cursor-pointer"
            >
              <option value="all">🏢 All Departments</option>
              <option value="Knitting">🧵 Knitting</option>
              <option value="Dyeing">🧪 Dyeing</option>
              <option value="Finishing">✨ Finishing</option>
            </select>
          </div>

          {/* Assigned Unit Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Assigned Unit
            </label>
            <select
              value={filterAssignedUnit}
              onChange={(e) => {
                setFilterAssignedUnit(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-200 transition-all focus:border-[#0F4C81] focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden cursor-pointer"
            >
              <option value="all">🏭 All Units</option>
              {AVAILABLE_UNITS.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>

          {/* Read/Write Permission Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Read / Write Permission
            </label>
            <select
              value={filterPermission}
              onChange={(e) => {
                setFilterPermission(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-200 transition-all focus:border-[#0F4C81] focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden cursor-pointer"
            >
              <option value="all">🔰 All Permissions</option>
              <option value="Read">🔷 Read Only</option>
              <option value="Read / Write">🟢 Read / Write</option>
              <option value="Hide">⚪ Hide</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Status Filter
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-200 transition-all focus:border-[#0F4C81] focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden cursor-pointer"
            >
              <option value="all">⚡ All Statuses</option>
              <option value="Active">🟢 Active Only</option>
              <option value="Inactive">🔴 Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Clear Filter Toolbar shortcut */}
        {(globalSearch || filterUserType !== 'all' || filterDepartment !== 'all' || filterAssignedUnit !== 'all' || filterPermission !== 'all' || filterStatus !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-slate-800">
            <span className="text-[11px] font-bold text-gray-400">
              Active Filters found <span className="text-blue-600 dark:text-sky-400">{filteredUsers.length}</span> matching record(s).
            </span>
            <button
              onClick={() => {
                setGlobalSearch('');
                setFilterUserType('all');
                setFilterDepartment('all');
                setFilterAssignedUnit('all');
                setFilterPermission('all');
                setFilterStatus('all');
                showToast("All filters reset", "info");
              }}
              className="text-[11px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              <X className="h-3 w-3" />
              <span>Clear Filter Presets</span>
            </button>
          </div>
        )}
      </div>

      {/* Main ERP Ledger Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col">
        
        {/* Sticky Table Wrapper */}
        <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
          <table className="w-full text-left border-collapse" id="user-ledger-datatable">
            
            {/* Sticky Table Header */}
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-xs">
              <tr className="text-[10px] font-black text-[#0F4C81] dark:text-slate-300 uppercase tracking-wider">
                <th className="px-4 py-3 bg-slate-100 dark:bg-slate-800 whitespace-nowrap">User Name</th>
                <th className="px-4 py-3 bg-slate-100 dark:bg-slate-800 whitespace-nowrap">User Type</th>
                <th className="px-4 py-3 bg-slate-100 dark:bg-slate-800 whitespace-nowrap">Designation</th>
                <th className="px-4 py-3 bg-slate-100 dark:bg-slate-800 whitespace-nowrap">UID</th>
                <th className="px-4 py-3 bg-slate-100 dark:bg-slate-800 whitespace-nowrap text-center">Password</th>
                <th className="px-4 py-3 bg-slate-100 dark:bg-slate-800 whitespace-nowrap">Department</th>
                <th className="px-4 py-3 bg-slate-100 dark:bg-slate-800 whitespace-nowrap">Assigned Unit</th>
                <th className="px-4 py-3 bg-slate-100 dark:bg-slate-800 whitespace-nowrap">Visible Tabs</th>
                <th className="px-4 py-3 bg-slate-100 dark:bg-slate-800 whitespace-nowrap">Read / Write Permission</th>
                <th className="px-4 py-3 bg-slate-100 dark:bg-slate-800 whitespace-nowrap text-center">Status</th>
                <th className="px-4 py-3 bg-slate-100 dark:bg-slate-800 whitespace-nowrap">Last Updated</th>
                <th className="px-4 py-3 bg-slate-100 dark:bg-slate-800 whitespace-nowrap text-center">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs text-gray-700 dark:text-slate-300 font-medium">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => {
                  const isPasswordVisible = !!visiblePasswords[user.id];

                  return (
                    <tr 
                      key={user.id} 
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* User Name */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-[#0F4C81] dark:text-sky-400 flex items-center justify-center font-bold">
                            {user.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-black text-slate-900 dark:text-white text-xs">
                              {user.userName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* User Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          user.userType === 'Admin' 
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {user.userType === 'Admin' ? '🔑 Admin' : '👤 General'}
                        </span>
                      </td>

                      {/* Designation */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {user.designation}
                        </span>
                      </td>

                      {/* UID */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                          {user.uid}
                        </span>
                      </td>

                      {/* Password with Eye */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono text-xs font-bold w-20 text-center tracking-wider text-gray-700 dark:text-slate-300">
                            {isPasswordVisible ? (user.password || '********') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title={isPasswordVisible ? "Hide Password" : "Show Password"}
                          >
                            {isPasswordVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          {user.department}
                        </span>
                      </td>

                      {/* Assigned Unit as Tags */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {user.assignedUnits.map((unit) => (
                            <span 
                              key={unit} 
                              className="text-[9px] font-black px-1.5 py-0.5 rounded-sm bg-blue-50 dark:bg-slate-800 text-[#0F4C81] dark:text-sky-300 border border-blue-100 dark:border-slate-700"
                            >
                              {unit}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Visible Tabs Summary */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="flex flex-wrap gap-1">
                          {user.allowedTabs ? (
                            user.allowedTabs.map((tab) => (
                              <span 
                                key={tab} 
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-50 dark:bg-slate-800/85 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60"
                              >
                                {tab}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold italic uppercase">
                              {user.userType === 'Admin' ? 'All (Admin Default)' : 'Default (No User Mgmt)'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Permission Badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {user.permission === 'Read / Write' ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-[#16A34A] dark:text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-900/50">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                            Read / Write
                          </span>
                        ) : user.permission === 'Read' ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-blue-50 dark:bg-sky-950/40 text-[#0F4C81] dark:text-sky-400 px-2.5 py-1 rounded-md border border-blue-200 dark:border-sky-900/50">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#0F4C81]" />
                            Read Only
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-gray-50 dark:bg-slate-850 text-gray-500 dark:text-slate-400 px-2.5 py-1 rounded-md border border-gray-200 dark:border-slate-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                            Hide
                          </span>
                        )}
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user.id)}
                            className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden"
                            style={{ backgroundColor: user.status === 'Active' ? '#16A34A' : '#94A3B8' }}
                          >
                            <span
                              className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out"
                              style={{ transform: user.status === 'Active' ? 'translateX(16px)' : 'translateX(0px)' }}
                            />
                          </button>
                        </div>
                      </td>

                      {/* Last Updated */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-[10px] text-gray-500 dark:text-slate-400">
                          {user.lastUpdated}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit User Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(user)}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0F4C81] dark:text-sky-400 px-2 py-1 text-[10px] font-black tracking-wider transition-all cursor-pointer"
                            title="Edit User Info"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>✏ Edit</span>
                          </button>

                          {/* Delete User Button */}
                          <button
                            type="button"
                            onClick={() => handleConfirmDelete(user.id)}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 dark:border-red-950/40 bg-white hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/20 text-[#DC2626] px-2 py-1 text-[10px] font-black tracking-wider transition-all cursor-pointer"
                            title="Delete User Record"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>🗑 Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="text-center py-12 px-4 text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-amber-500" />
                      <span className="font-black text-gray-600 dark:text-slate-400 text-sm">No Matching Users Found</span>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                        Adjust your search query or reset the filter dropdowns to show records.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Sticky Table Footer / Pagination Desk */}
        <div className="bg-slate-50 dark:bg-slate-850 px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Info Status text */}
          <div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-center sm:text-left">
            Showing <span className="text-slate-900 dark:text-white font-black">{filteredUsers.length === 0 ? 0 : (currentPage - 1) * usersPerPage + 1}</span> to{' '}
            <span className="text-slate-900 dark:text-white font-black">
              {Math.min(currentPage * usersPerPage, filteredUsers.length)}
            </span> of{' '}
            <span className="text-[#0F4C81] dark:text-sky-400 font-black">{filteredUsers.length}</span> System Users
          </div>

          {/* Rows selector & controls */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Row limit selection */}
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
              <span className="uppercase">Rows per page:</span>
              <select
                value={usersPerPage}
                onChange={(e) => {
                  setUsersPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-0.5 font-bold text-gray-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {/* Page Number Badges */}
              <div className="flex items-center gap-0.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  // Only display neighbors of current page if total pages is large
                  if (totalPages > 5 && Math.abs(pageNum - currentPage) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return <span key={pageNum} className="px-1 text-gray-400 font-bold">...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-6 w-6 rounded-md text-[10px] font-black flex items-center justify-center transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-[#0F4C81] text-white'
                          : 'bg-white border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* ADD / EDIT USER DIALOG POPUP */}
      {/* ========================================================== */}
      {isPopupOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="bg-[#0F4C81] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-sky-300" />
                <h3 className="font-sans text-sm font-black uppercase tracking-wider">
                  {popupMode === 'add' ? '➕ Register New User' : '✏ Edit User Records'}
                </h3>
              </div>
              <button
                onClick={() => setIsPopupOpen(false)}
                className="text-white hover:text-red-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Main Form Fields */}
            <form onSubmit={handleSaveUser} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Validation Warning Alert */}
              {formError && (
                <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-[#DC2626] p-3 rounded-r-lg flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-[#DC2626] shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[11px] font-black text-red-700 dark:text-red-400 uppercase tracking-widest">
                      Form Input Violation
                    </span>
                    <p className="text-[11px] font-bold text-red-600 dark:text-red-300 mt-0.5">
                      {formError}
                    </p>
                  </div>
                </div>
              )}

              {/* Grid 1: Name & UID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    User Name <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full legal name..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-100 transition-all focus:border-[#0F4C81] focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    UID (Login ID) <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EKL001"
                    value={formUid}
                    onChange={(e) => setFormUid(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-mono font-bold text-gray-700 dark:text-slate-100 transition-all focus:border-[#0F4C81] focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Grid 2: Type, Designation & Department */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* User Type Select */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    User Type <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                  >
                    <option value="General">General</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                {/* Designation Select */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Designation Hierarchy <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                  >
                    <option value="">-- Choose Designation --</option>
                    {DESIGNATIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Department Select */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Department <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value as any)}
                    required
                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid 3: Password / Confirm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Password <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showFormPassword ? "text" : "password"}
                      required
                      placeholder="Security credentials password..."
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-3 pr-10 py-1.5 text-xs font-mono font-bold text-gray-700 dark:text-slate-100 transition-all focus:border-[#0F4C81] focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showFormPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Confirm Password <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showFormConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Verify typed password..."
                      value={formConfirmPassword}
                      onChange={(e) => setFormConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-3 pr-10 py-1.5 text-xs font-mono font-bold text-gray-700 dark:text-slate-100 transition-all focus:border-[#0F4C81] focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormConfirmPassword(!showFormConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showFormConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Field: Assigned Units (Multi-select searchable tags chip component) */}
              <div className="space-y-1.5" ref={unitDropdownRef}>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Assigned Unit <span className="text-red-500 font-bold">*</span> <span className="text-[9px] text-gray-400 lowercase">(Searchable Multi-Select)</span>
                </label>

                {/* Selected Unit Chip list */}
                <div className="flex flex-wrap gap-1.5 mb-2 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 min-h-[44px]">
                  {formAssignedUnits.length > 0 ? (
                    formAssignedUnits.map(unit => (
                      <span 
                        key={unit} 
                        className="inline-flex items-center gap-1.5 text-[10px] font-black bg-[#0F4C81] text-white pl-2.5 pr-1.5 py-1 rounded-md shadow-xs"
                      >
                        <span>{unit}</span>
                        <button
                          type="button"
                          onClick={() => toggleUnitSelection(unit)}
                          className="hover:bg-[#16304a] text-sky-200 hover:text-white rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] font-bold text-gray-400 self-center">
                      No units allocated. Click select button below to assign manufacturing units.
                    </span>
                  )}
                </div>

                {/* Searchable dropdown trigger block */}
                <div className="relative">
                  <div 
                    onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                    className="w-full flex items-center justify-between rounded-lg border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-gray-700 dark:text-slate-200 cursor-pointer"
                  >
                    <span>{formAssignedUnits.length} Unit(s) selected</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isUnitDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Search and item list panel */}
                  {isUnitDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 z-20 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-3.5 space-y-2 max-h-56 overflow-y-auto">
                      
                      {/* Sub-search */}
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                          <Search className="h-3 w-3" />
                        </span>
                        <input
                          type="text"
                          placeholder="Search allocated units..."
                          value={unitSearchQuery}
                          onChange={(e) => setUnitSearchQuery(e.target.value)}
                          className="w-full rounded-md border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-850 py-1 pl-7 pr-3 text-[11px] font-semibold text-gray-700 dark:text-slate-200 focus:outline-hidden focus:bg-white"
                        />
                      </div>

                      {/* Options Checklist */}
                      <div className="space-y-1.5 pt-1">
                        {filteredAvailableUnitsInForm.length > 0 ? (
                          filteredAvailableUnitsInForm.map(unit => {
                            const isChecked = formAssignedUnits.includes(unit);
                            return (
                              <div
                                key={unit}
                                onClick={() => toggleUnitSelection(unit)}
                                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs font-bold text-gray-700 dark:text-slate-200"
                              >
                                {isChecked ? (
                                  <CheckSquare className="h-4 w-4 text-[#16A34A] shrink-0" />
                                ) : (
                                  <Square className="h-4 w-4 text-gray-300 shrink-0" />
                                )}
                                <span>{unit}</span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-2 text-[10px] text-gray-400">No units match search filter</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Option: Visible Tabs Selection Checklist */}
              <div className="space-y-2 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Allowed Navigation Tabs / Menus <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormAllowedTabs(ALL_TABS)}
                      className="text-[9px] font-black text-[#0F4C81] dark:text-sky-400 hover:underline uppercase tracking-wider"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300 dark:text-slate-700">|</span>
                    <button
                      type="button"
                      onClick={() => setFormAllowedTabs([])}
                      className="text-[9px] font-black text-red-600 dark:text-red-400 hover:underline uppercase tracking-wider"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wide">
                  Configure exactly which workspace views are visible for this specific user's session.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5">
                  {ALL_TABS.map((tab) => {
                    const isChecked = formAllowedTabs.includes(tab);
                    return (
                      <div
                        key={tab}
                        onClick={() => {
                          setFormAllowedTabs(prev => 
                            prev.includes(tab) 
                              ? prev.filter(t => t !== tab) 
                              : [...prev, tab]
                          );
                        }}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                          isChecked 
                            ? 'border-blue-200 dark:border-sky-900/60 bg-blue-50/40 dark:bg-sky-950/20 text-[#0F4C81] dark:text-sky-400' 
                            : 'border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100/50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="h-4 w-4 shrink-0 text-[#16A34A] dark:text-emerald-400" />
                        ) : (
                          <Square className="h-4 w-4 shrink-0 text-gray-300 dark:text-slate-700" />
                        )}
                        <span className="text-xs font-bold tracking-tight">{tab}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grid 4: Permission & Status Toggle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Permission select */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Read / Write Permission <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={formPermission}
                    onChange={(e) => setFormPermission(e.target.value as any)}
                    required
                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                  >
                    <option value="Read">Read (View Dashboard & Logs only)</option>
                    <option value="Read / Write">Read / Write (Add, Edit, Update production logs)</option>
                    <option value="Hide">Hide (Remove visibility of module)</option>
                  </select>
                </div>

                {/* Status selector */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    User Active Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                  >
                    <option value="Active">🟢 Active State</option>
                    <option value="Inactive">🔴 Inactive State</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPopupOpen(false)}
                  className="rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="rounded-lg border border-amber-200 dark:border-amber-900/50 text-[#F59E0B] px-4 py-2 text-xs font-bold hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors cursor-pointer"
                >
                  Clear Fields
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0F4C81] text-white hover:bg-sky-900 px-5 py-2 text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  {popupMode === 'add' ? 'Save User' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ========================================================== */}
      {deletingUserId && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-950/40 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-150 overflow-hidden">
            
            {/* Header banner */}
            <div className="bg-[#DC2626] text-white px-5 py-3.5 flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5" />
              <h3 className="font-sans text-xs font-black uppercase tracking-wider">
                Delete User Account Confirmation
              </h3>
            </div>

            {/* Content body */}
            <div className="p-5 space-y-4">
              <p className="text-xs font-bold text-gray-600 dark:text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete this user?
              </p>
              
              {/* Highlight target */}
              {(() => {
                const target = users.find(u => u.id === deletingUserId);
                return target ? (
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-lg border border-gray-150 dark:border-slate-750 text-xs font-bold">
                    <span className="block text-[10px] text-gray-400 uppercase tracking-widest">Target User Details:</span>
                    <span className="block text-slate-900 dark:text-white mt-1">Name: {target.userName}</span>
                    <span className="block text-slate-500 mt-0.5 font-mono">UID: {target.uid} | Dept: {target.department}</span>
                  </div>
                ) : null;
              })()}

              <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg">
                ⚠️ Warning: This operation cannot be undone. All access authorization for this UID will be terminated immediately.
              </p>

              {/* Action desk */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeletingUserId(null)}
                  className="rounded-lg border border-gray-200 dark:border-slate-700 px-3.5 py-1.5 text-xs font-bold text-gray-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  className="rounded-lg bg-[#DC2626] text-white hover:bg-red-700 px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
