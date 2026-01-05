SocialGold: Project Manifest (Updated Dec 31, 2025)
1. Core Tech Stack
Frontend: Next.js 15 (App Router), TypeScript, Tailwind CSS 4.
Backend: Firebase (Auth, Firestore).
Image Strategy: Base64 storage in Firestore with client-side compression (800kb-1MB limit).
Icons: Transitioned from Emojis to high-end SVG Icons for Search and Camera; Standard 3xl size for interactions.
Theme: "Gold Leaf" (Pure smooth gradients in layout.tsx, 100% opacity text, no low-quality noise).
2. Feature Set & UI Logic
Branding & Navigation
Branding: Unified "SocialGold" as one word with no spaces across all screens.
Global Navbar: A single component (src/components/Navbar.tsx) that manages all navigation.
Feed View: Shows Search (🔍) icon.
Profile/Settings View: Swaps Search for Inbox (✉️) to save mobile space.
Unread Badge: A gold pulse dot appears on the ✉️ icon when unread messages exist.
Main Feed (/feed)
Performance: Lazy loading with 5 posts per batch.
Infinite Scroll: Integrated with Intersection Observer.
Post Box: 500-character limit with a live counter and gold-scrollbar.
Interactions: Solid Star (✨/⭐) likes with gold confetti, comment counts, and owner-only deletion (🗑️).
Layout: Content-aligned buttons (aligned with text, not the avatar).
Private Vaults (Messaging)
Real-time DMs: Lowecase [chatid] paths.
Unread Logic: recipient's ID added to unreadBy array on send; removed on room entry.
Inbox: High-contrast list of chats with the ability to delete entire conversations (🗑️) via a confirm modal.
Input Area: Unified h-14 height for input and "SEND" button; no white browser outlines.
Threaded Comments (/post/[postid])
Inline Replies: Clicking "Reply" opens a compact input directly under the comment (no scrolling to top).
Comment Likes: Members can "Star" comments, triggering gold confetti.
Divider: A premium "Comments" divider separates the main post from the thread.
Profiles & Settings
Vault View: Toggle between standard List and The Vault (3-column photo grid).
Lazy-Links: Website links auto-format to https:// if the user forgets to type it.
Settings: Centralized page to update Display Name, Bio, Photo, and Website.
3. Critical Fixes (Production/Vercel)
TypeScript Strict Mode: Applied as any type casting to Firestore data maps to prevent Vercel build failures.
Mobile Optimization:
Responsive padding (px-6) on all navbars.
Login/Signup cards positioned higher on mobile (pt-10) to eliminate empty scroll space.
Avatar scaling for smaller screens.
Ghost Listeners: Added (error) => { if (error.code !== "permission-denied")... } to all onSnapshot calls to prevent crashes during logout.
Typography: Replaced leading-none with leading-tight on usernames to prevent cropping lowercase letters (like g or y).
4. Database Configuration
Firestore Collections
users: Profiles, followers/following arrays, and website links.
posts: Content, Base64 images, likes array, and commentCount.
notifications: Real-time alerts for likes, follows, and comments.
chats: Parent document for DMs containing participants, lastMessage, and unreadBy.
messages (sub-collection): The actual DM text stream.
Required Indexes
posts: uid (Asc) + createdAt (Desc)
notifications: toUid (Asc) + createdAt (Desc)
chats: participants (Array) + lastUpdate (Desc)
chats: unreadBy (Array) + lastUpdate (Desc)