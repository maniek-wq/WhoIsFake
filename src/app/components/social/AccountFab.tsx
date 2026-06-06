import { motion } from "motion/react";
import { Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useFriends } from "../../context/FriendsContext";

export function AccountFab() {
  const { user } = useAuth();
  const { togglePanel, payload, pendingInvite } = useFriends();

  const badge = payload.incoming.length + (pendingInvite ? 1 : 0);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={togglePanel}
      className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-blue-500/30 shadow-[0_0_24px_rgba(37,99,235,0.3)] flex items-center justify-center text-2xl"
      aria-label="Account & friends"
    >
      {user && !user.isGuest ? (
        <span>{user.avatar}</span>
      ) : (
        <Users className="w-6 h-6 text-blue-300" />
      )}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border-2 border-[#0F172A]">
          {badge}
        </span>
      )}
    </motion.button>
  );
}
