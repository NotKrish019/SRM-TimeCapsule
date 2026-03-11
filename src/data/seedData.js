import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export const DEMO_CAPSULES = [
    {
        title: "UB Canteen Vending Machine Secret",
        content: "Only accepts crisp ₹10 notes. The left slot jams if you insert ₹20. Workaround: tap the panel twice.",
        category: "Infrastructure",
        author: "Senior '23",
        authorId: "demo1",
        position: { x: 2, y: 0, z: -3 },
        location: "UB Building",
        upvotes: 47,
        lat: 12.8231,
        lng: 80.0444,
    },
    {
        title: "NN Lab GPU Survival Guide",
        content: "PC #4 from the left window has the only working GPU in the lab. Book it at 7am. Bring your own HDMI.",
        category: "Academics",
        author: "Senior '22",
        authorId: "demo2",
        position: { x: -4, y: 0, z: 1 },
        location: "NN Lab",
        upvotes: 93,
        lat: 12.8228,
        lng: 80.0448,
    },
    {
        title: "Library Rooftop Trick",
        content: "The library rooftop door is always unlocked during exam season. Best study spot on campus. AC works.",
        category: "Social",
        author: "Senior '23",
        authorId: "demo3",
        position: { x: 0, y: 0, z: 4 },
        location: "Central Library",
        upvotes: 128,
        lat: 12.8235,
        lng: 80.0440,
    },
    {
        title: "Placement Cell Email Hack",
        content: "Email subject lines with [URGENT] get 3x faster responses from placement coordinators. Tested it.",
        category: "Career",
        author: "Senior '22",
        authorId: "demo4",
        position: { x: 3, y: 0, z: 3 },
        location: "Tech Park",
        upvotes: 211,
        lat: 12.8220,
        lng: 80.0452,
    },
];

// Call this once: seedFirestore()
export async function seedFirestore() {
    for (const capsule of DEMO_CAPSULES) {
        await addDoc(collection(db, "capsules"), capsule);
        console.log("Seeded:", capsule.title);
    }
}
