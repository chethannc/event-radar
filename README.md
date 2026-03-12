# 🚀 AI Event Radar

AI-powered event discovery platform that automatically finds events happening around the city and displays them in one place.

🌐 Live Demo  
https://event-radar-chethanncs-projects.vercel.app

---

## 📌 Problem

Interesting events are scattered across multiple platforms like event websites, communities, and social media.

It becomes difficult for users to discover them easily.

AI Event Radar solves this by automatically discovering and organizing events in a single platform.

---

## ✨ Features

• 🔎 AI-powered event discovery  
• 🌐 Crawls multiple sources for hidden events  
• 🧠 Extracts event details using AI  
• 📅 Displays events in a clean UI  
• 🎟 Redirects to original booking platform  
• 📍 Integrated map directions  
• ☁️ Cloud deployment

---

## 🖥 Screenshots
<img width="1322" height="940" alt="image" src="https://github.com/user-attachments/assets/d1881a1d-0580-40ce-b512-9d9ebad0bc43" />

### Event Listing
<img width="924" height="868" alt="image" src="https://github.com/user-attachments/assets/c8638e8d-24cf-4b35-b6a2-585314b39db2" />

### Event Details
<img width="1000" height="890" alt="image" src="https://github.com/user-attachments/assets/dda96b48-86f6-4f42-8bdb-2a5b386bd004" />

### Map Directions
<img width="977" height="740" alt="image" src="https://github.com/user-attachments/assets/65397f2c-50a9-4899-a22e-4de58eb32b52" />

---

## 🏗 Main Flow

1. Page load
User -> Next.js page -> server-events -> Firestore -> UI renders dashboard

2. AI recommendation
User prompt -> /api/recommend -> openai.ts
-> OpenAI or fallback ranking -> recommended events -> UI updates

3. Scheduled discovery
Vercel Cron -> /api/discovery/run -> search.ts -> extractor.ts
-> normalize/dedupe/geocode -> Firestore
                         
