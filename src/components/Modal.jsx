import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";

const CATEGORY_COLORS = {
  Academics: "#00ffe7", Social: "#ff6b35",
  Infrastructure: "#ffd700", Career: "#a855f7",
};

export default function Modal({ capsule, onClose }) {
  const color = CATEGORY_COLORS[capsule.category] || "#fff";

  const handleUpvote = async () => {
    try {
        await updateDoc(doc(db, "capsules", capsule.id), {
          upvotes: increment(1),
        });
    } catch(err) {
        console.error("Upvote failed (you might not have firestore permissions set yet): ", err);
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20"
         style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="bg-gray-900 border rounded-2xl p-6 max-w-md w-full mx-4"
           style={{ borderColor: color }}>
        <span className="text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block"
              style={{ background: color + "22", color }}>
          {capsule.category}
        </span>
        <h2 className="text-xl font-bold text-white mb-1">{capsule.title}</h2>
        <p className="text-gray-400 text-sm mb-4">📍 {capsule.location}</p>
        <p className="text-gray-200 leading-relaxed mb-6">{capsule.content}</p>
        <div className="flex items-center justify-between">
          <div className="text-gray-500 text-sm">— {capsule.author}</div>
          <div className="flex gap-3">
            <button onClick={handleUpvote}
                    className="flex items-center gap-1 text-sm text-gray-300 hover:text-yellow-400 transition-colors">
              ⬆️ {capsule.upvotes || 0}
            </button>
            <button onClick={onClose}
                    className="text-sm text-gray-400 hover:text-white transition-colors">
              ✕ Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
