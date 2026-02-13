
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const { signOut, user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: '控制台', icon: 'dashboard' },
    { id: 'review', label: '复习', icon: 'event_note' },
    { id: 'bank', label: '题库', icon: 'library_books' },
    { id: 'input', label: '录入', icon: 'add_circle_outline' },
  ];

  return (
    <>
      {/* Desktop Sidebar (Hidden on mobile) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 h-screen flex-col fixed left-0 top-0 z-20 transition-all">
        <div className="h-20 flex items-center px-6 border-b border-gray-100">
          <div className="w-10 h-10 bg-google-blue rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="material-icons-round text-white">school</span>
          </div>
          <span className="ml-3 font-bold text-xl text-gray-800 tracking-tight">智学云</span>
        </div>

        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 bg-blue-100 text-google-blue rounded-full flex items-center justify-center font-bold text-xs">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-gray-800 truncate">{user?.email}</p>
              <p className="text-[10px] text-green-500 font-bold uppercase">已认证</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${currentPage === item.id
                  ? 'bg-blue-50 text-google-blue font-bold shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <span className={`material-icons-round text-2xl transition-transform group-hover:scale-110 ${currentPage === item.id ? 'text-google-blue' : 'text-gray-400 group-hover:text-gray-600'}`}>
                {item.icon === 'add_circle_outline' ? 'add_circle' : item.icon}
              </span>
              <span className="ml-3">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-2">
          <button className="w-full flex items-center p-3 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
            <span className="material-icons-round text-2xl text-gray-400">settings</span>
            <span className="ml-3">设置</span>
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center p-3 rounded-xl text-red-400 hover:bg-red-50 transition-colors"
          >
            <span className="material-icons-round text-2xl">logout</span>
            <span className="ml-3 font-medium">退出登录</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (Visible only on mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
          {menuItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-google-blue' : 'text-gray-400'
                  }`}
              >
                <div className={`rounded-full p-1 transition-all ${isActive && item.id === 'input' ? 'bg-google-blue text-white shadow-lg -mt-4 mb-1' : ''}`}>
                  <span className="material-icons-round text-2xl">
                    {item.icon}
                  </span>
                </div>
                <span className={`text-[10px] font-medium ${isActive && item.id === 'input' ? 'hidden' : 'block'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
          {/* Mobile Logout (Optional, separate menu usually better but here simplified) */}
          <button
            onClick={signOut}
            className="flex flex-col items-center justify-center w-full h-full text-gray-400"
          >
            <div className="rounded-full p-1">
              <span className="material-icons-round text-2xl">logout</span>
            </div>
            <span className="text-[10px] font-medium text-xs">退出</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;