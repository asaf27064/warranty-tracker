import Navbar from "../components/Navbar";
import { Card } from "../components/ui/card";
import { ShieldCheck, AlertTriangle, ShieldX } from "lucide-react";

const Dashboard = () => {
  // data מזויף — נחליף ב-API אחר כך
  const stats = { active: 5, expiringSoon: 2, expired: 1 };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-6xl p-6">
        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {/* TODO: 3 stat cards - Active, Expiring Soon, Expired */}
        </div>

        {/* TODO: Search + Filter */}

        {/* TODO: Product grid */}
      </main>
    </div>
  );
};

export default Dashboard;
