# React + Vite
# 💰 AI-Powered Finance Tracker

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.
A full-stack financial management system that enables users to track expenses, visualize spending patterns, and process real-world financial data using intelligent parsing techniques.

Currently, two official plugins are available:
---

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
## 🚀 Overview

## React Compiler
This project is designed to go beyond a traditional expense tracker by integrating:

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).
* 📊 Interactive financial dashboards
* 📁 Multi-format file ingestion (CSV, Excel, PDF, Images)
* 🧠 NLP-based transaction categorization *(in progress)*
* ⚙️ Asynchronous processing using Redis + BullMQ *(architecture implemented)*

## Expanding the ESLint configuration
---

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
## ✨ Key Features

### 💸 Expense Management

* Add, view, and manage transactions
* Categorize expenses (Food, Transport, Shopping, etc.)
* Store and retrieve user-specific financial data

---

### 📊 Dashboard & Analytics

* Visual representation of:

  * Category-wise spending
  * Monthly trends
* Summary cards:

  * Total Balance
  * Total Income
  * Total Expenses
  * Financial Health Score

---

### 📂 File Upload & Processing

* Upload and process financial data from:

  * CSV files ✅
  * Excel (.xlsx) *(structured parsing)*
  * PDF documents *(planned)*
  * Images via OCR *(planned)*

---

### 🧠 AI & NLP Engine *(In Progress)*

* Extract transaction details from raw text:

  * Merchant name
  * Category
  * Payment method
* Example:

  ```json
  "Paid via UPI to Swiggy ₹450" → Food
  ```

---

### ⚙️ Scalable Architecture

* Hybrid processing system:

  * ⚡ Synchronous for lightweight tasks (CSV)
  * 🔄 Asynchronous (BullMQ + Redis) for heavy tasks (OCR, PDF)

---

## 🏗️ Tech Stack

### Frontend

* React (Vite)
* JavaScript
* Chart Libraries (for visualization)

### Backend

* Node.js
* Express.js

### Database

* MongoDB

### Async Processing

* BullMQ
* Redis

### Parsing & Processing

* xlsx (Excel)
* pdf-parse (PDF)
* tesseract.js (OCR)
* mammoth (Word docs)

---

## 📁 Project Structure

```
finance-tracker/
│
├── client/        # React frontend
├── server/        # Node.js backend
├── database/      # Database scripts
├── scripts/       # Setup scripts
├── *.bat          # Project automation scripts
```

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd finance-tracker
```

---

### 2. Install dependencies

#### Frontend

```bash
cd client
npm install
```

#### Backend

```bash
cd ../server
npm install
```

---

### 3. Start Redis (required for async processing)

```bash
docker run -d -p 6379:6379 redis
```

---

### 4. Run the project

#### Start backend

```bash
cd server
npm run dev
```

#### Start frontend

```bash
cd client
npm run dev
```

---

## 📌 Future Enhancements

* 🤖 Fully functional NLP-based categorization
* 📄 Advanced PDF and OCR transaction extraction
* 🔄 Real-time updates using WebSockets
* 👨‍👩‍👧 Multi-user / family financial tracking
* 📈 Predictive financial analytics

---

## 🧠 Architecture Highlights

* Modular backend design (routes, controllers, services)
* Asynchronous job handling using BullMQ
* Scalable multi-modal data ingestion pipeline
* Separation of concerns between processing and UI

---

## 🎯 Learning Outcomes

This project demonstrates:

* Full-stack development skills
* System design (sync vs async processing)
* Integration of AI/NLP concepts
* Handling real-world unstructured data

---

## 👨‍💻 Author

**Likhit Hegde** **Tejas Raja Bhatt** **Eda Manoj Krishna**

---

## 📜 License

This project is for educational purposes.
