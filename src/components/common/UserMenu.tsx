import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { showToast } from "../../utils/toast";
import { useNavigate } from "react-router-dom";
import { Crown, UserCog, User, LogOut } from "lucide-react";

export const UserMenu = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      showToast.success("Đã đăng xuất");
      navigate("/login");
    } catch (error) {
      showToast.error("Không thể đăng xuất");
    }
  };

  if (!profile) return null;

  const roleLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    owner: { label: "Chủ cửa hàng", icon: <Crown className="w-3.5 h-3.5" /> },
    manager: { label: "Quản lý", icon: <UserCog className="w-3.5 h-3.5" /> },
    staff: { label: "Nhân viên", icon: <User className="w-3.5 h-3.5" /> },
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
          {profile.full_name?.[0] || profile.email[0].toUpperCase()}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-sm font-medium text-slate-900 dark:text-white">
            {profile.full_name || profile.email}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            {roleLabels[profile.role]?.icon}
            <span>{roleLabels[profile.role]?.label}</span>
          </div>
        </div>
        <svg
          className="w-4 h-4 text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-20">
            <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Đăng nhập với
              </div>
              <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {profile.email}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
