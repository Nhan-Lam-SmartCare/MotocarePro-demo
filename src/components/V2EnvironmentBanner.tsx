import { useEffect, useState } from "react";

export default function V2EnvironmentBanner() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const isUsingV2 = localStorage.getItem("motocare_use_v2") === "true";

  useEffect(() => {
    const handleQuotaError = () => {
      setQuotaExceeded(true);
    };
    window.addEventListener("supabase-quota-exceeded", handleQuotaError);
    return () => {
      window.removeEventListener("supabase-quota-exceeded", handleQuotaError);
    };
  }, []);

  if (!quotaExceeded && !isUsingV2) return null;

  const handleSwitch = () => {
    if (isUsingV2) {
      localStorage.removeItem("motocare_use_v2");
    } else {
      localStorage.setItem("motocare_use_v2", "true");
    }
    window.location.reload();
  };

  return (
    <div className="bg-amber-600 text-white px-4 py-2 text-sm flex items-center justify-between shadow-md z-50 sticky top-0">
      <div className="flex items-center space-x-2">
        <span className="font-bold">⚠️ Cảnh báo Database:</span>
        <span>
          {quotaExceeded
            ? "Tài khoản Supabase chính đã chạm hạn ngạch Băng thông (Egress)!"
            : "Đang kết nối qua Supabase Dự Phòng (V2 Backup)"}
        </span>
      </div>
      <button
        onClick={handleSwitch}
        className="bg-white text-amber-800 font-semibold px-3 py-1 rounded text-xs hover:bg-amber-100 transition-colors shadow-sm"
      >
        {isUsingV2 ? "Chuyển về Supabase Chính (V1)" : "Chuyển sang Supabase Dự Phòng (V2)"}
      </button>
    </div>
  );
}

