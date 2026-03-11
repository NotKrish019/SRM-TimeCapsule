import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

const provider = new GoogleAuthProvider();
// Force account chooser & restrict domain
provider.setCustomParameters({ hd: "stu.srmuniversity.ac.in" });

export default function LoginPage() {
    const handleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const email = result.user.email;
            // Double-check domain (belt & suspenders)
            if (!email.endsWith("@stu.srmuniversity.ac.in")) {
                await auth.signOut();
                alert("Only SRM students can access this!");
                return;
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
            <h1 className="text-4xl font-bold mb-2">🕰️ SRM Time Capsule</h1>
            <p className="text-gray-400 mb-8">Wisdom buried by seniors. Unearthed by you.</p>
            <button
                onClick={handleLogin}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-3 rounded-lg transition-all"
            >
                Login with SRM Google Account
            </button>
        </div>
    );
}
